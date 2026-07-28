export const dynamic = "force-dynamic";
export const maxDuration = 26;
import { NextResponse } from "next/server";
import { runPrintBatch } from "@/lib/print-batch";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPrintBatch();
    console.log("[cron/print-batch]", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron/print-batch] failed:", err);
    return NextResponse.json({ error: "Print batch failed" }, { status: 500 });
  }
}
