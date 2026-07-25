"use client";

import { useState } from "react";

type ProviderId = "tosspayments" | "naverpay" | "kakaopay";

function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `ORDER-${timestamp}-${random}`;
}

const PROVIDERS: Array<{
  id: ProviderId;
  name: string;
  color: string;
  icon: string;
  description: string;
  demoOnly?: boolean;
}> = [
  {
    id: "tosspayments",
    name: "토스페이먼츠",
    color: "bg-blue-500 hover:bg-blue-600",
    icon: "💳",
    description: "테스트 키가 있으면 카드 결제창을 호출합니다.",
  },
  {
    id: "naverpay",
    name: "네이버페이",
    color: "bg-green-500 hover:bg-green-600",
    icon: "🟢",
    description: "상점 계약 전 데모 결제로 동작합니다.",
    demoOnly: true,
  },
  {
    id: "kakaopay",
    name: "카카오페이",
    color: "bg-yellow-400 hover:bg-yellow-500",
    icon: "💛",
    description: "상점 계약 전 데모 결제로 동작합니다.",
    demoOnly: true,
  },
];

export default function Home() {
  const [amount, setAmount] = useState(1000);
  const [productName, setProductName] = useState("테스트 상품");
  const [customerName, setCustomerName] = useState("홍길동");
  const [loading, setLoading] = useState<ProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (providerId: ProviderId) => {
    if (!productName.trim()) {
      setError("상품명을 입력해주세요.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 100) {
      setError("결제 금액은 100원 이상이어야 합니다.");
      return;
    }

    setError(null);
    setLoading(providerId);
    const orderId = generateOrderId();

    try {
      if (providerId === "tosspayments") {
        await initTossPayments(orderId);
      } else {
        goToDemoSuccess(providerId, orderId);
      }
    } catch (paymentError) {
      const message =
        paymentError instanceof Error
          ? paymentError.message
          : "결제 초기화에 실패했습니다.";
      console.error("결제 초기화 실패:", paymentError);
      setError(message);
      setLoading(null);
    }
  };

  const createPaymentLog = async (orderId: string) => {
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "tosspayments",
        orderId,
        amount,
        productName,
        customerName,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "주문 정보를 저장하지 못했습니다.");
    }
  };

  const goToDemoSuccess = (provider: ProviderId, orderId: string) => {
    const params = new URLSearchParams({
      provider,
      orderId,
      amount: String(amount),
      demo: "true",
    });
    window.location.href = `/payment/success?${params.toString()}`;
  };

  const initTossPayments = async (orderId: string) => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      goToDemoSuccess("tosspayments", orderId);
      return;
    }

    await createPaymentLog(orderId);

    const { loadTossPayments } = await import(
      "@tosspayments/tosspayments-sdk"
    );
    const tossPayments = await loadTossPayments(clientKey);
    const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });

    await payment.requestPayment({
      method: "CARD",
      amount: { currency: "KRW", value: amount },
      orderId,
      orderName: productName.trim(),
      customerName: customerName.trim(),
      successUrl: `${window.location.origin}/payment/success?provider=tosspayments`,
      failUrl: `${window.location.origin}/payment/fail?provider=tosspayments`,
    });
  };

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">결제 테스트</h1>
      <p className="mb-8 text-gray-500">
        실제 테스트 키가 없으면 안전한 데모 모드로 결제 흐름을 확인합니다.
      </p>

      <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">주문 정보</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            상품명
            <input
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            결제 금액 (원)
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              min={100}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            고객명
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handlePayment(provider.id)}
            disabled={loading !== null}
            className={`${provider.color} rounded-xl p-6 text-left text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100`}
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{provider.icon}</span>
              <span className="text-xl font-bold">{provider.name}</span>
              {provider.demoOnly && (
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium">
                  데모
                </span>
              )}
            </div>
            <p className="text-sm text-white/80">{provider.description}</p>
            {loading === provider.id && (
              <p className="mt-2 animate-pulse text-sm text-white/90">
                결제를 준비하는 중...
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="mr-2 self-center text-sm text-gray-500">빠른 금액:</span>
        {[1000, 5000, 10000, 50000, 100000].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              amount === preset
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
            }`}
          >
            {preset.toLocaleString()}원
          </button>
        ))}
      </div>
    </div>
  );
}
