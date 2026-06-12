"use server";

import { createAdminClient } from "@/lib/supabase-admin";

// Public entry point (landing pages) — visitors are anonymous, so this
// runs on the service-role client. Validate strictly: this is the only
// unauthenticated write path into the CRM.

const MAX_FIELD_LENGTH = 200;
const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function captureInboundLead(formData: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    industry: string;
    city: string;
}) {
    // 1. Validate before touching the database
    const company_name = (formData.company_name || "").trim().slice(0, MAX_FIELD_LENGTH);
    const contact_person = (formData.contact_person || "").trim().slice(0, MAX_FIELD_LENGTH);
    const email = (formData.email || "").trim().slice(0, MAX_FIELD_LENGTH);
    const phone = (formData.phone || "").trim();
    const industry = (formData.industry || "").trim().slice(0, MAX_FIELD_LENGTH);
    const city = (formData.city || "").trim().slice(0, MAX_FIELD_LENGTH);

    if (!company_name) {
        return { success: false, message: "Business name is required." };
    }
    if (!PHONE_REGEX.test(phone)) {
        return { success: false, message: "Please enter a valid phone number." };
    }
    if (email && !EMAIL_REGEX.test(email)) {
        return { success: false, message: "Please enter a valid email address." };
    }

    const supabase = createAdminClient();

    // 2. Check for duplicates
    const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

    if (existing) {
        return { success: false, message: "A lead with this phone number already exists." };
    }

    // 3. Insert as inbound lead
    const { data, error } = await (supabase.from("leads") as any).insert({
        company_name,
        contact_person,
        email,
        phone,
        industry,
        city,
        status: "new",
        lead_type: "inbound",
        source: "landing_page",
        notes: `Organic inbound lead from ${industry} LP in ${city}.`
    }).select().single();

    if (error) {
        console.error("Capture Lead Error:", error);
        return { success: false, message: "Could not save your details. Please try again." };
    }

    // 4. Audit trail (service-role insert; DB triggers also capture this)
    await (supabase.from("audit_logs") as any).insert({
        action: "create",
        resource_type: "lead",
        resource_id: data.id,
        resource_label: `Inbound Lead: ${company_name}`,
        new_value: { company_name, contact_person, email, phone, industry, city },
        summary: `Inbound lead captured from ${industry}/${city} landing page`,
        user_name: "public-landing-page",
        user_role: "system",
        entity_type: "lead",
        entity_id: data.id,
    });

    return { success: true, data };
}
