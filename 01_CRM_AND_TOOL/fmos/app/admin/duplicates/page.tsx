import DuplicatesReviewCenter from "@/components/admin/duplicates-review-center";

export default function DuplicatesPage() {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-mono tabular-nums font-bold text-slate-900 mb-2">Data Quality</h1>
            <p className="text-slate-500 mb-8">Review and merge duplicate records to keep your CRM clean.</p>

            <DuplicatesReviewCenter />
        </div>
    );
}
