// Server component — emits a JSON-LD <script> tag. No "use client": this renders
// on the server so the structured data is in the initial HTML for crawlers.
// Accepts a single schema node or an array of nodes.

export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
