"use client";

import { useState } from "react";

function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `ORDER-${timestamp}-${random}`;
}

const PROVIDERS = [
  {
    id: "tosspayments",
    name: "토스페이먼츠",
    color: "bg-blue-500 hover:bg-blue-600",
    icon: "💳",
    description: "카드, 계좌이체, 가상계좌 등",
  },
  {
    id: "naverpay",
    name: "네이버페이",
    color: "bg-green-500 hover:bg-green-600",
    icon: "🟢",
    description: "네이버페이 간편결제",
  },
  {
    id: "kakaopay",
    name: "카카오페이",
    color: "bg-yellow-400 hover:bg-yellow-500",
    icon: "💛",
    description: "카카오페이 간편결제",
  },
  {
    id: "stripe",
    name: "Stripe",
    color: "bg-purple-500 hover:bg-purple-600",
    icon: "💜",
    description: "글로벌 카드 결제",
  },
];

export default function Home() {
  const [amount, setAmount] = useState(1000);
  const [productName, setProductName] = useState("테스트 상품");
  const [customerName, setCustomerName] = useState("홍길동");
  const [loading, setLoading] = useState<string | null>(null);

  const handlePayment = async (providerId: string) => {
    setLoading(providerId);
    const orderId = generateOrderId();

    try {
      if (providerId === "tosspayments") {
        await initTossPayments(orderId);
      } else if (providerId === "naverpay") {
        await initNaverPay(orderId);
      } else if (providerId === "kakaopay") {
        await initKakaoPay(orderId);
      } else if (providerId === "stripe") {
        await initStripe(orderId);
      }
    } catch (error) {
      console.error("결제 초기화 실패:", error);
      alert("결제 초기화에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  };

  const initTossPayments = async (orderId: string) => {
    const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
    const tossPayments = await loadTossPayments(
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
    );
    const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });

    await payment.requestPayment({
      method: "CARD",
      amount: { currency: "KRW", value: amount },
      orderId,
      orderName: productName,
      customerName,
      successUrl: `${window.location.origin}/payment/success?provider=tosspayments`,
      failUrl: `${window.location.origin}/payment/fail?provider=tosspayments`,
    });
  };

  const initNaverPay = async (orderId: string) => {
    const res = await fetch("/api/naverpay/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount, productName, customerName }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("네이버페이 결제 준비 실패: " + (data.error || "알 수 없는 오류"));
    }
  };

  const initKakaoPay = async (orderId: string) => {
    const res = await fetch("/api/kakaopay/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount, productName, customerName }),
    });
    const data = await res.json();
    if (data.next_redirect_pc_url) {
      window.location.href = data.next_redirect_pc_url;
    } else {
      alert("카카오페이 결제 준비 실패: " + (data.error || "알 수 없는 오류"));
    }
  };

  const initStripe = async (orderId: string) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount, productName, customerName }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Stripe 결제 준비 실패: " + (data.error || "알 수 없는 오류"));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">결제 테스트</h1>
      <p className="text-gray-500 mb-8">
        각 결제 수단의 테스트 모드를 사용하여 결제를 시뮬레이션합니다.
      </p>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">결제 금액 (원)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={100} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">고객명</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((provider) => (
          <button key={provider.id} onClick={() => handlePayment(provider.id)} disabled={loading !== null} className={`${provider.color} text-white rounded-xl p-6 text-left transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{provider.icon}</span>
              <span className="text-xl font-bold">{provider.name}</span>
            </div>
            <p className="text-white/80 text-sm">{provider.description}</p>
            {loading === provider.id && (<p className="text-white/90 text-sm mt-2 animate-pulse">결제 창을 불러오는 중...</p>)}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-2 flex-wrap">
        <span className="text-sm text-gray-500 self-center mr-2">빠른 금액:</span>
        {[1000, 5000, 10000, 50000, 100000].map((preset) => (
          <button key={preset} onClick={() => setAmount(preset)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${amount === preset ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
            {preset.toLocaleString()}원
          </button>
        ))}
      </div>
    </div>
  );
}
