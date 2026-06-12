import { redirect } from "next/navigation";

// Agreement generation is now handled inline on the lead profile page.
export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/leads/${id}`);
}
