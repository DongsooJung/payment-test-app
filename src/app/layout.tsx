import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "결제 테스트 앱",
  description: "토스페이먼츠 결제와 네이버페이·카카오페이 데모 테스트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen font-sans">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Payment Test
            </Link>
            <div className="flex gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                결제 테스트
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                대시보드
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
