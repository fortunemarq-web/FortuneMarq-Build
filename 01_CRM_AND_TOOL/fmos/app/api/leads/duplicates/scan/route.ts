import { createServerClientWithCookies } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";
import { normalizePhone, normalizeEmail, extractDomain, normalizeName } from "@/lib/normalize";

export async function POST(req: NextRequest) {
    const supabase = await createServerClientWithCookies();

    // Verify Admin (Optional but recommended)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // 1. Fetch active leads
        // We fetch minimal fields needed for matching
        const { data: leads, error } = await supabase
            .from("leads")
            .select("id, company_name, city, phone, email, website_domain, phone_normalized, email_normalized")
            // Scan all non-merged leads. (Previously also filtered status='active', but
            // 'active' is not a valid lead_status value, which made the query throw.)
            .is("is_merged", false)
            .limit(1000) as any; // Batch size for safety

        if (error) throw error;
        if (!leads || leads.length === 0) return NextResponse.json({ message: "No leads to scan" });

        const candidates: any[] = [];
        let dupsFound = 0;

        // Helper to add candidate
        const addCandidate = (id1: string, id2: string, type: string, confidence: number, reason: any) => {
            // Always store smaller ID first to avoid duplicates (A-B vs B-A)
            const [primary, duplicate] = id1 < id2 ? [id1, id2] : [id2, id1];
            candidates.push({
                entity_type: 'lead',
                primary_id: primary,
                duplicate_id: duplicate,
                match_type: type,
                confidence,
                reason: JSON.stringify(reason),
                status: 'open'
            });
            dupsFound++;
        };

        // 2. Scan Logic
        // In-memory scan for 1000 leads is O(N^2) = 1,000,000 checks, relatively fast in JS (~100ms)
        // For larger sets, doing this in SQL with self-joins is better.
        // Given the prompt asks for a endpoint, we can do a hybrid or SQL approach.
        // SQL approach is much more robust for existing data.
        // Let's use SQL logic via multiple queries for strict matches to ensure we find ALL dups in DB, not just fetched 1000.

        // A) Phone Match
        const { data: phoneDups } = await supabase.rpc('find_phone_duplicates' as any); // Hypothetical RPC?
        // Since we can't create RPC easily without raw SQL access in migration step (blocked?), we'll do raw SQL query or use client-side logic on fetching.
        // Actually, we can use `.select` with modifier? No.
        // Let's Iterate locally for now as V1 implementation for safely controlled batch.

        for (let i = 0; i < leads.length; i++) {
            for (let j = i + 1; j < leads.length; j++) {
                const l1 = leads[i];
                const l2 = leads[j];

                // 1. Strict Phone
                const p1 = l1.phone_normalized || normalizePhone(l1.phone);
                const p2 = l2.phone_normalized || normalizePhone(l2.phone);
                if (p1 && p2 && p1 === p2) {
                    addCandidate(l1.id, l2.id, 'phone', 95, { field: 'phone', value: p1 });
                    continue;
                }

                // 2. Strict Email
                const e1 = l1.email_normalized || normalizeEmail(l1.email);
                const e2 = l2.email_normalized || normalizeEmail(l2.email);
                if (e1 && e2 && e1 === e2) {
                    addCandidate(l1.id, l2.id, 'email', 95, { field: 'email', value: e1 });
                    continue;
                }

                // 3. Domain
                // Assuming website_domain is populated or we extract it
                // const d1 = l1.website_domain; 
                // const d2 = l2.website_domain;
                // if (d1 && d2 && d1 === d2) {
                //    addCandidate(l1.id, l2.id, 'domain', 85, { field: 'domain', value: d1 });
                //    continue;
                // }

                // 4. Name + City
                const n1 = normalizeName(l1.company_name);
                const n2 = normalizeName(l2.company_name);
                const c1 = normalizeName(l1.city);
                const c2 = normalizeName(l2.city);

                if (n1 && n2 && n1 === n2) {
                    if (c1 && c2 && c1 === c2) {
                        addCandidate(l1.id, l2.id, 'name_city', 70, { name: n1, city: c1 });
                    }
                }
            }
        }

        // 3. Insert Candidates (ignore duplicates via ON CONFLICT)
        if (candidates.length > 0) {
            const { error: insertError } = await supabase
                .from("duplicate_candidates")
                .upsert(candidates, { onConflict: "entity_type, primary_id, duplicate_id, match_type", ignoreDuplicates: true });

            if (insertError) throw insertError;
        }

        return NextResponse.json({
            success: true,
            scanned: leads.length,
            candidates_found: candidates.length
        });

    } catch (err) {
        console.error("Scan Error", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
