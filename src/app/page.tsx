"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PortOneModule = typeof import("@portone/browser-sdk/v2");
type CheckoutConfig = Parameters<PortOneModule["requestPayment"]>[0];

export default function Home() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAlipay() {
    setLoading(true);
    setError(null);

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "alipay-test",
          customerName,
          customerEmail,
          customerPhone,
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "주문 생성에 실패했습니다.");

      const PortOne = await import("@portone/browser-sdk/v2");
      const payment = await PortOne.requestPayment(order as CheckoutConfig);
      if (!payment) throw new Error("결제창이 닫혔습니다.");
      if (payment.code) throw new Error(payment.message || "Alipay 결제에 실패했습니다.");

      const verifyResponse = await fetch("/api/portone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.paymentId }),
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok || !verified.paid) {
        throw new Error(verified.error || "결제 승인 상태를 확인할 수 없습니다.");
      }

      router.push(`/payment/success?provider=alipay&paymentId=${encodeURIComponent(payment.paymentId)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "결제 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          PortOne V2 · Eximbay · Alipay+
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Alipay+ 테스트 결제</h1>
        <p className="mt-2 text-gray-500">
          테스트 상품은 USD 1.00입니다. 결제 금액은 서버의 상품 정보로 고정됩니다.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between rounded-xl bg-gray-50 p-4">
          <div>
            <div className="text-sm text-gray-500">상품</div>
            <div className="font-semibold text-gray-900">STARGATE Alipay+ Test Product</div>
          </div>
          <div className="text-xl font-bold text-gray-900">$1.00</div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">구매자 이름</span>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={100} autoComplete="name" placeholder="ZHANG SAN" className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">이메일</span>
            <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="buyer@example.com" className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">휴대전화 (선택)</span>
            <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={30} autoComplete="tel" placeholder="+86 138 0000 0000" className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>

        {error && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <button onClick={handleAlipay} disabled={loading || customerName.trim().length < 2 || !customerEmail.includes("@")} className="mt-6 w-full rounded-xl bg-[#1677ff] px-5 py-3 font-bold text-white transition hover:bg-[#0f62d6] disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Alipay 결제창 연결 중…" : "Alipay+로 $1.00 결제"}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-gray-400">
          결제 완료 여부는 포트원 서버 조회와 Supabase 주문 금액을 대조해 확정합니다.
        </p>
      </div>
    </div>
  );
}
