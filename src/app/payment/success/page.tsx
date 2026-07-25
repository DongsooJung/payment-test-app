"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const PROVIDER_NAMES: Record<string, string> = {
  tosspayments: "토스페이먼츠",
  naverpay: "네이버페이",
  kakaopay: "카카오페이",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "unknown";
  const orderId = searchParams.get("orderId") || "";
  const paymentKey = searchParams.get("paymentKey") || "";
  const amount = searchParams.get("amount") || "";
  const demo = searchParams.get("demo") === "true";
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedConfirmation = useRef(false);

  useEffect(() => {
    if (attemptedConfirmation.current) return;
    attemptedConfirmation.current = true;

    const confirmPayment = async () => {
      try {
        if (provider === "tosspayments" && paymentKey && orderId && amount) {
          const response = await fetch("/api/tosspayments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(
              data.error?.message || data.error || "결제 승인에 실패했습니다."
            );
          }
        } else if (demo) {
          // 데모 결제는 실제 승인이나 결제 로그 저장을 수행하지 않습니다.
        }

        setConfirmed(true);
      } catch (confirmationError) {
        setError(
          confirmationError instanceof Error
            ? confirmationError.message
            : "결제 승인에 실패했습니다."
        );
      }
    };

    confirmPayment();
  }, [provider, paymentKey, orderId, amount, demo]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        {error ? (
          <>
            <div className="mb-4 text-6xl" aria-hidden="true">❌</div>
            <h1 className="mb-2 text-2xl font-bold text-red-600">결제 승인 실패</h1>
            <p role="alert" className="mb-6 text-gray-500">{error}</p>
          </>
        ) : confirmed ? (
          <>
            <div className="mb-4 text-6xl" aria-hidden="true">✅</div>
            <h1 className="mb-2 text-2xl font-bold text-green-600">결제 성공</h1>
            <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">결제 수단</span>
                <span className="font-medium">
                  {PROVIDER_NAMES[provider] || provider}
                </span>
              </div>
              {orderId && (
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">주문 번호</span>
                  <span className="break-all text-right font-mono text-xs">{orderId}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">결제 금액</span>
                  <span className="font-medium">
                    {Number(amount).toLocaleString()}원
                  </span>
                </div>
              )}
              {demo && (
                <div className="mt-2 text-center text-xs text-orange-500">
                  데모 모드 · 실제 결제 없음
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 animate-pulse text-6xl" aria-hidden="true">⏳</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-700">결제 처리 중</h1>
            <p className="mb-6 text-gray-500">승인 결과를 확인하고 있습니다.</p>
          </>
        )}

        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            다시 테스트
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            대시보드
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p>로딩 중...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
