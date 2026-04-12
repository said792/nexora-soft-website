"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";

export default function AboutPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      try {
        // جلب المستند الذي معرف 'about' من مجموعة site_pages
        const docRef = doc(db, "site_pages", "about");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setContent(docSnap.data().content);
        } else {
          // محتوى افتراضي في حال لم يتم إنشاء الصفحة في قاعدة البيانات بعد
          setContent(`
            <div class="text-center py-20">
              <h2 class="text-3xl font-bold text-white mb-4">الصفحة جاري التحضير...</h2>
              <p class="text-gray-400">يرجى الذهاب لوحة التحكم وإضافة محتوى لصفحة "من نحن"</p>
            </div>
          `);
        }
      } catch (error) {
        console.error("Error fetching page content:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-[Tajawal]">
      {/* Navbar (بسيط للتنقل) */}
      <header className="fixed top-0 w-full bg-[#0f172a]/95 backdrop-blur-md z-50 border-b border-white/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex justify-between items-center h-20">
            <Link href="/" className="text-2xl font-black text-blue-500">&lt;/&gt; ديف سوفت</Link>
            <div className="hidden md:flex gap-8 items-center">
              <Link href="/" className="text-gray-300 hover:text-white">الرئيسية</Link>
              <Link href="/projects" className="text-gray-300 hover:text-white">المشاريع</Link>
              <Link href="/about" className="text-blue-400 font-bold border-b-2 border-blue-500 pb-1">من نحن</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white">تواصل معنا</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* عرض المحتوى الديناميكي */}
      {/* نستخدم dangerouslySetInnerHTML لعرض كود HTML الذي أضفته في الأدمن */}
      <div className="pt-24 pb-20 min-h-screen">
        <div dangerouslySetInnerHTML={{ __html: content }} className="container mx-auto px-4 max-w-6xl" />
      </div>
      
      {/* Footer */}
      <footer className="bg-[#020617] py-8 border-t border-white/5 text-center">
        <p className="text-gray-600 text-sm">جميع الحقوق محفوظة © 2024</p>
      </footer>
    </div>
  );
}