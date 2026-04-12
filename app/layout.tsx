import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "NEXORA SOFT | تطوير حلول البرمجيات والتطبيقات الذكية",
  description: "NEXORA SOFT هي شريكك التقني الأول. نطور مواقع ويب، تطبيقات موبايل، وأنظمة إدارة بأحدث التقنيات لخدمة مشاريعك وتحقيق أهدافك الرقمية.",
  keywords: [
    "شركة برمجيات",
    "تطوير تطبيقات",
    "تصميم مواقع",
    "برمجة موبايل",
    "تطوير ويب",
    "NEXORA SOFT",
    "برمجة في مصر"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "NEXORA SOFT | Building Tomorrow’s Technology",
    description: "منصة برمجية احترافية نبتكر المستقبل بسطر برمجي واحد",
    url: 'https://nexora-soft-website.vercel.app',
    siteName: 'NEXORA SOFT',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={tajawal.variable}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0f172a] text-white">
        {children}
      </body>
    </html>
  );
}