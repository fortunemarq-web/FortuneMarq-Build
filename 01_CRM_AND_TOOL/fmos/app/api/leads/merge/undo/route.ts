import { createServerClientWithCookies } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { ACTIVITY_EVENTS_TABLE, type MovedChildren } from "@/lib/leads/merge-relations";

export async function POST(req: NextRequest) {
    const supabase = await createServerClientWithCookies();

    try {
        const { merge_id } = await req.json();

        // 1. Get Merge Record
        const { data: mergeRecord, error: fetchError } = await supabase.from("merges")
            .select("*")
            .eq("id", merge_id)
            .single();

        const data = mergeRecord as any;
        if (fetchError || !data) throw new Error("Merge record not found");

        if (data.is_undone) throw new Error("Already undone");
        if (new Date(data.undo_until) < new Date()) throw new Error("Undo window expired");

        const { survivor_id, merged_id } = data;

        // 2. Restore Merged Lead
        await supabase.from("leads")
            .update({ is_merged: false, merged_into: null } as any)
            .eq("id", merged_id);

        // 3. Remove Redirect
        await supabase.from("lead_redirects")
            .delete()
            .eq("merged_id", merged_id);

        // 4. Revert exactly the child rows recorded at merge time (merges.moved_children).
        //    Because we stored the precise row IDs, undo only moves back rows that the merge
        //    moved — rows created on the survivor after the merge are left untouched.
        const moved = (data.moved_children || {}) as MovedChildren;
        const db = supabase as any;
        for (const [table, ids] of Object.entries(moved)) {
            if (!Array.isArray(ids) || ids.length === 0) continue;
            if (table === ACTIVITY_EVENTS_TABLE) {
                const { error } = await db.from(table).update({ entity_id: merged_id }).in("id", ids);
                if (error) console.error(`[undo] revert ${table} failed:`, error.message);
            } else {
                const { error } = await db.from(table).update({ lead_id: merged_id }).in("id", ids);
                if (error) console.error(`[undo] revert ${table} failed:`, error.message);
            }
        }

        // Restore any duplicate_candidates that were marked merged for this pair
        // back to their original 'open' state (the column default).
        await supabase.from("duplicate_candidates")
            .update({ status: "open" })
            .eq("status", "merged")
            .or(`primary_id.eq.${merged_id},duplicate_id.eq.${merged_id}`);

        // 5. Mark Merge Undone
        await supabase.from("merges")
            .update({ is_undone: true })
            .eq("id", merge_id);

        // 6. Audit
        const { data: { user } } = await supabase.auth.getUser();
        await logAudit({
            action: 'update',
            resourceType: 'lead' as any,
            resourceId: survivor_id,
            resourceLabel: `Undid merge of lead ${merged_id}.`,
            newValue: { is_undone: true }
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Undo Error", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
