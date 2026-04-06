"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "unknown";
  const orderId = searchParams.get("orderId") || "";
  const paymentKey = searchParams.get("paymentKey") || "";
  const amount = searchParams.get("amount") || "";
  const demo = searchParams.get("demo") === "true";
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      if (provider === "tosspayments" && paymentKey && orderId && amount) {
        try {
          const res = await fetch("/api/tosspayments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
          });
          const data = await res.json();
          if (data.success) { setConfirmed(true); } else { setError(data.error?.message || "결제 승인 실패"); }
        } catch (e) { setError(String(e)); }
      } else if (demo) {
        try {
          await fetch("/api/payments/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status: "success", provider }) });
        } catch {}
        setConfirmed(true);
      } else { setConfirmed(true); }
    };
    confirmPayment();
  }, [provider, paymentKey, orderId, amount, demo]);

  const providerNames: Record<string, string> = { tosspayments: "토스페이먼츠", naverpay: "네이버페이", kakaopay: "카카오페이", stripe: "Stripe" };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md w-full text-center">
        {error ? (
          <><div className="text-6xl mb-4">&#10060;</div><h1 className="text-2xl font-bold text-red-600 mb-2">결제 승인 실패</h1><p className="text-gray-500 mb-4">{error}</p></>
        ) : confirmed ? (
          <><div className="text-6xl mb-4">&#9989;</div><h1 className="text-2xl font-bold text-green-600 mb-2">결제 성공!</h1>
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">결제 수단</span><span className="font-medium">{providerNames[provider] || provider}</span></div>
              {orderId && <div className="flex justify-between text-sm"><span className="text-gray-500">주문 번호</span><span className="font-mono text-xs">{orderId}</span></div>}
              {amount && <div className="flex justify-between text-sm"><span className="text-gray-500">결제 금액</span><span className="font-medium">{Number(amount).toLocaleString()}원</span></div>}
              {demo && <div className="text-xs text-orange-500 text-center mt-2">* 데모 모드 (실제 결제 없음)</div>}
            </div>
          </>
        ) : (
          <><div className="text-6xl mb-4 animate-spin">&#9203;</div><h1 className="text-2xl font-bold text-gray-700 mb-2">결제 처리 중...</h1><p className="text-gray-500">잠시만 기다려주세요.</p></>
        )}
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">다시 테스트</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50">대시보드</Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><p>로딩 중...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
