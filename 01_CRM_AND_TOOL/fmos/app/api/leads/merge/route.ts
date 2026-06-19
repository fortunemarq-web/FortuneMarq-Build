import { createServerClientWithCookies } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { LEAD_CHILD_TABLES, ACTIVITY_EVENTS_TABLE, type MovedChildren } from "@/lib/leads/merge-relations";

export async function POST(req: NextRequest) {
    const supabase = await createServerClientWithCookies();

    try {
        const body = await req.json();
        const { survivor_id, merged_id, merge_strategy, chosen_fields } = body;

        if (!survivor_id || !merged_id) {
            return NextResponse.json({ success: false, error: "Missing IDs" }, { status: 400 });
        }

        // 1. Fetch source leads to log state before merge
        const { data: leads, error: fetchError } = await supabase
            .from("leads")
            .select("*")
            .in("id", [survivor_id, merged_id]);

        if (fetchError || !leads || leads.length !== 2) throw new Error("Leads not found");

        const survivorLead = leads.find((l: any) => l.id === survivor_id);
        const mergedLead = leads.find((l: any) => l.id === merged_id);

        // 2. Update Survivor with chosen fields. Whitelist to real lead columns
        //    (survivorLead was fetched with select *), so an unexpected key can't 400 the update.
        const allowedKeys = new Set(Object.keys(survivorLead as any));
        const updates: Record<string, any> = {};
        for (const [k, v] of Object.entries((chosen_fields || {}) as Record<string, unknown>)) {
            if (allowedKeys.has(k) && k !== "id") updates[k] = v;
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase.from("leads")
                .update(updates as any)
                .eq("id", survivor_id);
            if (updateError) throw updateError;
        }

        // 3. Re-point child history rows from merged -> survivor, recording exactly which
        //    rows moved so an undo can reverse precisely these (and nothing created later).
        const movedChildren: MovedChildren = {};
        const db = supabase as any;
        for (const table of LEAD_CHILD_TABLES) {
            const { data: rows } = await db.from(table).select("id").eq("lead_id", merged_id);
            const ids = (rows || []).map((r: any) => r.id);
            if (ids.length === 0) continue;
            const { error: moveErr } = await db.from(table).update({ lead_id: survivor_id }).in("id", ids);
            if (!moveErr) movedChildren[table] = ids;
            else console.error(`[merge] re-point ${table} failed:`, moveErr.message);
        }
        // activity_events is keyed by entity_type/entity_id.
        const { data: aeRows } = await supabase.from(ACTIVITY_EVENTS_TABLE)
            .select("id").eq("entity_type", "lead").eq("entity_id", merged_id);
        const aeIds = (aeRows || []).map((r: any) => r.id);
        if (aeIds.length > 0) {
            const { error: aeErr } = await supabase.from(ACTIVITY_EVENTS_TABLE)
                .update({ entity_id: survivor_id } as any).in("id", aeIds);
            if (!aeErr) movedChildren[ACTIVITY_EVENTS_TABLE] = aeIds;
            else console.error("[merge] re-point activity_events failed:", aeErr.message);
        }

        // 4. Mark Duplicate Candidates as merged
        await supabase.from("duplicate_candidates")
            .update({ status: "merged" })
            .or(`primary_id.eq.${merged_id},duplicate_id.eq.${merged_id}`);

        // 5. Create Merge Record (with the moved-children manifest for a precise undo)
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("merges").insert({
            entity_type: "lead",
            survivor_id,
            merged_id,
            merged_by: user?.id,
            merge_strategy,
            moved_children: movedChildren,
            undo_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

        // 6. Create Redirect
        await supabase.from("lead_redirects").insert({
            merged_id,
            survivor_id
        });

        // 7. Soft Disable Merged Lead
        await supabase.from("leads")
            .update({ is_merged: true, merged_into: survivor_id } as any)
            .eq("id", merged_id);

        // 8. Audit Logs
        // Log on Survivor
        // 8. Audit Logs
        // Log on Survivor
        await logAudit({
            action: 'update',
            resourceType: 'lead' as any,
            resourceId: survivor_id,
            resourceLabel: `Merged lead ${(mergedLead as any).company_name} into this record.`,
            newValue: { merged_from_id: merged_id, strategy: merge_strategy }
        });

        // Log on Merged (ghost)
        await logAudit({
            action: 'update',
            resourceType: 'lead' as any,
            resourceId: merged_id,
            resourceLabel: `This lead was merged into ${(survivorLead as any).company_name}.`,
            newValue: { survivor_id, action: "ARCHIVE_MERGE" }
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Merge Error", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
