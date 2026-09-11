import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "status", data = {} } = body;

    switch (action) {
      case "validate_allocation":
        const allocations = data.allocations ?? {};
        const total = Object.values(allocations).reduce((sum: number, v: unknown) => sum + (Number(v) || 0), 0);
        return new Response(JSON.stringify({ ok: total === 100, total }), { status: 200, headers: { "Content-Type": "application/json" } });

      case "split_income": {
        const { amount = 0, percentages = {} } = data;
        const totalPercent = Object.values(percentages).reduce((sum: number, v: unknown) => sum + (Number(v) || 0), 0);
        if (totalPercent !== 100 || !amount) { return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 }); }
        const sorted = Object.entries(percentages).sort((a, b) => Number(b[1]) - Number(a[1]));
        let assigned = 0;
        const result: Record<string, number> = {};
        for (let i = 0; i < sorted.length; i++) {
          const [wallet, pct] = sorted[i];
          if (i === sorted.length - 1) { result[wallet] = amount - assigned; } else { const slice = Math.floor((amount * Number(pct)) / 100); result[wallet] = slice; assigned += slice; }
        }
        return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ ok: true, message: "danara function ready" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
  } catch (err) {
    console.error("[danara-function]", err);
    return new Response(JSON.stringify({ error: "Function error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
