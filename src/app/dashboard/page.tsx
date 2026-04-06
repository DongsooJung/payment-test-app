"use client";

import { useEffect, useState } from "react";

type PaymentLog = {
  id: string;
  provider: string;
  order_id: string;
  amount: number;
  status: string;
  payment_key: string | null;
  customer_name: string | null;
  product_name: string;
  created_at: string;
};

type Stats = {
  total: number;
  success: number;
  fail: number;
  pending: number;
  cancelled: number;
  totalAmount: number;
  byProvider: Record<string, number>;
};

const PROVIDER_LABELS: Record<string, string> = {
  tosspayments: "토스페이먼츠",
  naverpay: "네이버페이",
  kakaopay: "카카오페이",
  stripe: "Stripe",
};

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  fail: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  success: "성공",
  fail: "실패",
  pending: "대기",
  cancelled: "취소",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stats");
      const data = await res.json();
      setStats(data.stats);
      setLogs(data.recentLogs || []);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs =
    filter === "all" ? logs : logs.filter((l) => l.provider === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-gray-500 animate-pulse">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">결제 대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">결제 테스트 내역을 확인합니다.</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          새로고침
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="전체" value={stats.total} color="text-gray-900" />
          <StatCard label="성공" value={stats.success} color="text-green-600" />
          <StatCard label="실패" value={stats.fail} color="text-red-600" />
          <StatCard label="대기" value={stats.pending} color="text-yellow-600" />
          <StatCard
            label="총 결제액"
            value={`${stats.totalAmount.toLocaleString()}원`}
            color="text-blue-600"
          />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats.byProvider).map(([key, count]) => (
            <div
              key={key}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFilter(filter === key ? "all" : key)}
            >
              <div className="text-sm text-gray-500">{PROVIDER_LABELS[key]}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              {filter === key && (
                <div className="text-xs text-blue-500 mt-1">필터 적용 중</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {["all", "tosspayments", "naverpay", "kakaopay", "stripe"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border hover:border-gray-400"
            }`}
          >
            {f === "all" ? "전체" : PROVIDER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">PG사</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">주문번호</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">상품명</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium">금액</th>
              <th className="px-4 py-3 text-center text-gray-500 font-medium">상태</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">일시</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  결제 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {PROVIDER_LABELS[log.provider] || log.provider}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {log.order_id.length > 20
                      ? log.order_id.slice(0, 20) + "..."
                      : log.order_id}
                  </td>
                  <td className="px-4 py-3">{log.product_name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {log.amount.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_STYLES[log.status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABELS[log.status] || log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(log.created_at).toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
