"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const paymentId = useSearchParams().get("paymentId") || "";
  const [state, setState] = useState<"checking" | "paid" | "pending" | "error">(
    paymentId ? "checking" : "error",
  );
  const [message, setMessage] = useState(paymentId ? "" : "결제 번호가 없습니다.");

  useEffect(() => {
    if (!paymentId) return;
    fetch("/api/portone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "결제 검증 실패");
        setState(data.paid ? "paid" : "pending");
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "결제 검증 실패");
      });
  }, [paymentId]);

  const paid = state === "paid";
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">{paid ? "✅" : state === "checking" ? "⏳" : "⚠️"}</div>
        <h1 className={`mb-2 text-2xl font-bold ${paid ? "text-green-600" : "text-gray-800"}`}>
          {paid ? "Alipay 결제 완료" : state === "checking" ? "결제 확인 중" : state === "pending" ? "승인 대기 중" : "결제 확인 실패"}
        </h1>
        <p className="mb-5 text-sm text-gray-500">
          {paid ? "포트원 결제 내역과 주문 금액이 일치합니다." : message || "웹훅 수신 후 상태가 자동으로 갱신됩니다."}
        </p>
        {paymentId && <div className="mb-6 break-all rounded-lg bg-gray-50 p-3 text-left font-mono text-xs text-gray-500">{paymentId}</div>}
        <Link href="/" className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">결제 화면으로</Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={<div className="p-10 text-center">결제 확인 중…</div>}><SuccessContent /></Suspense>;
}
