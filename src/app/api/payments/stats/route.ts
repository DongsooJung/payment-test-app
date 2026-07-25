import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  isAdminTokenConfigured,
  isAuthorizedAdminRequest,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const EMPTY_STATS = {
  total: 0,
  success: 0,
  fail: 0,
  pending: 0,
  cancelled: 0,
  totalAmount: 0,
  byProvider: {
    tosspayments: 0,
    naverpay: 0,
    kakaopay: 0,
  },
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        stats: EMPTY_STATS,
        recentLogs: [],
        configured: false,
      });
    }

    if (!isAdminTokenConfigured()) {
      return NextResponse.json(
        { error: "PAYMENT_ADMIN_TOKEN이 설정되지 않았습니다." },
        { status: 503 }
      );
    }

    if (!isAuthorizedAdminRequest(request)) {
      return NextResponse.json(
        { error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: allLogs, error } = await supabase
      .from("payment_logs")
      .select(
        "id,provider,order_id,amount,status,customer_name,product_name,created_at"
      )
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
      },
    };

    return NextResponse.json({
      stats,
      recentLogs: logs.slice(0, 20),
      configured: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
