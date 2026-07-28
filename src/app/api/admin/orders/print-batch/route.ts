export const dynamic = "force-dynamic";
export const maxDuration = 26;
import { NextResponse } from "next/server";
import { runPrintBatch } from "@/lib/print-batch";

/** Manual "Send batch to printer" trigger — admin auth enforced by middleware. */
export async function POST() {
  try {
    const result = await runPrintBatch();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/print-batch] failed:", err);
    return NextResponse.json({ error: "Print batch failed" }, { status: 500 });
  }
}
