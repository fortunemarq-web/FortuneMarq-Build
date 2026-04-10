import { createClient } from "@/lib/supabase";
import { nanoid } from "nanoid";

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    bucket: string;
    project_id: string | null;
    lead_id: string | null;
    is_client_visible: boolean;
    uploaded_at: string;
}

interface UploadFileOptions {
    file: File;
    bucket: "agency-internal" | "project-assets" | "client-deliverables";
    projectId?: string;
    leadId?: string;
    isClientVisible?: boolean;
}

/**
 * Uploads a file to the specified Supabase Storage bucket and
 * records its metadata in the `files` table.
 */
export async function uploadFile({
    file,
    bucket,
    projectId,
    leadId,
    isClientVisible = false,
}: UploadFileOptions): Promise<UploadedFile> {
    const supabase = createClient();

    // Build a unique storage path to prevent collisions
    const ext = file.name.split(".").pop();
    const storagePath = `${projectId || leadId || "general"}/${nanoid()}.${ext}`;

    // 1. Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    // 2. Get the public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    // 3. Record metadata in the `files` table
    const record = {
        id: nanoid(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        bucket,
        storage_path: storagePath,
        project_id: projectId || null,
        lead_id: leadId || null,
        is_client_visible: isClientVisible,
        uploaded_at: new Date().toISOString(),
    };

    const { error: dbError } = await (supabase.from("files") as any).insert(record);

    if (dbError) {
        // Best-effort: remove the orphaned blob if the DB insert fails
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
    }

    return {
        id: record.id,
        name: record.name,
        size: record.size,
        type: record.type,
        url: record.url,
        bucket: record.bucket,
        project_id: record.project_id,
        lead_id: record.lead_id,
        is_client_visible: record.is_client_visible,
        uploaded_at: record.uploaded_at,
    };
}
