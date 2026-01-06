import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "톡톡리뷰 - 체험단 마케팅 플랫폼",
  description: "무료로 제품을 체험하고 포인트를 받으세요. 네이버, 쿠팡 체험단 모집 플랫폼",
  keywords: ["체험단", "리뷰", "네이버", "쿠팡", "무료체험", "포인트"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
