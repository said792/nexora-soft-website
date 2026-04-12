import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "NEXORA SOFT | Building Tomorrow’s Technology",
  description: "منصة برمجية احترافية نبتكر المستقبل بسطر برمجي واحد",
  // ✅ لم نعد نستخدم icons هنا، لأننا وضعنا favicon.ico في مجلد app
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtr"
      className={tajawal.variable}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0f172a] text-white">
        {children}
      </body>
    </html>
  );
}