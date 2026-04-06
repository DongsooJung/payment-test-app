import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: allLogs, error } = await supabase
      .from("payment_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const logs = allLogs || [];

    const stats = {
      total: logs.length,
      success: logs.filter((l) => l.status === "success").length,
      fail: logs.filter((l) => l.status === "fail").length,
      pending: logs.filter((l) => l.status === "pending").length,
      cancelled: logs.filter((l) => l.status === "cancelled").length,
      totalAmount: logs
        .filter((l) => l.status === "success")
        .reduce((sum, l) => sum + l.amount, 0),
      byProvider: {
        tosspayments: logs.filter((l) => l.provider === "tosspayments").length,
        naverpay: logs.filter((l) => l.provider === "naverpay").length,
        kakaopay: logs.filter((l) => l.provider === "kakaopay").length,
        stripe: logs.filter((l) => l.provider === "stripe").length,
      },
    };

    return NextResponse.json({ stats, recentLogs: logs.slice(0, 20) });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
