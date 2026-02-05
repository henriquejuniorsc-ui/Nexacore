import { NextRequest, NextResponse } from "next/server";
import { processPendingReminders } from "@/services/reminder-service";

// This endpoint should be called by a cron job (e.g., every hour)
// You can use services like Vercel Cron, AWS CloudWatch, or a simple cron on your VPS

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Starting reminder processing...");

    const results = await processPendingReminders();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[Cron] Processed ${results.length} reminders: ${successful} success, ${failed} failed`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results,
    });

  } catch (error) {
    console.error("[Cron] Error processing reminders:", error);
    return NextResponse.json(
      { error: "Erro ao processar lembretes" },
      { status: 500 }
    );
  }
}

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
