"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function FailContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "unknown";
  const reason = searchParams.get("reason") || searchParams.get("message") || "알 수 없는 오류";
  const code = searchParams.get("code") || "";

  const providerNames: Record<string, string> = {
    tosspayments: "토스페이먼츠",
    naverpay: "네이버페이",
    kakaopay: "카카오페이",
    stripe: "Stripe",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">&#10060;</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">결제 실패</h1>
        <div className="text-left bg-red-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">결제 수단</span>
            <span className="font-medium">{providerNames[provider] || provider}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">실패 사유</span>
            <span className="font-medium text-red-600">{reason}</span>
          </div>
          {code && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">에러 코드</span>
              <span className="font-mono text-xs">{code}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">다시 시도</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50">대시보드</Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><p>로딩 중...</p></div>}>
      <FailContent />
    </Suspense>
  );
}
