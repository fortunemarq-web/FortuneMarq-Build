"use client";

import { useState, useTransition } from "react";
import { Database, CheckCircle } from "lucide-react";
import { seedWhatsAppTemplates } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SeedTemplatesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ seeded: number; skipped: number } | null>(null);

  function handleSeed() {
    startTransition(async () => {
      const res = await seedWhatsAppTemplates();
      if (res.success) {
        setResult({ seeded: res.seeded, skipped: res.skipped });
      }
    });
  }

  if (result) {
    return (
      <Badge tone="brand" size="md">
        <CheckCircle className="h-4 w-4" />
        Seeded {result.seeded} templates ({result.skipped} already existed)
      </Badge>
    );
  }

  return (
    <Button onClick={handleSeed} disabled={isPending} variant="primary">
      <Database className="h-4 w-4" />
      {isPending ? "Seeding..." : "Seed 17 Templates"}
    </Button>
  );
}
