"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Link from "next/link";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  // --- حالة البيانات ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- حالة القائمة (نسخة من الصفحة الرئيسية) ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pages, setPages] = useState<any[]>([]); // لعرض الصفحات في القائمة
  const [isAdmin, setIsAdmin] = useState(false); // لزر الأدمن

  useEffect(() => {
    // 1. جلب بيانات الصفحة الحالية
    async function fetchPage() {
      if (!slug) return;
      try {
        const docRef = doc(db, "site_pages", slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    }

    // 2. جلب جميع الصفحات للقائمة (نسخة من الصفحة الرئيسية)
    async function fetchPages() {
      try {
        const snapshot = await getDocs(collection(db, "site_pages"));
        setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    }

    // 3. التحقق من حالة الأدمن
    if (typeof window !== 'undefined' && localStorage.getItem('siteAdmin') === 'true') {
      setIsAdmin(true);
    }

    fetchPage();
    fetchPages();
  }, [slug]);

  const handleLogout = () => { 
    setIsAdmin(false); 
    localStorage.removeItem('siteAdmin'); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        جاري تحميل الصفحة...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">الصفحة غير موجودة</h2>
        <Link href="/" className="text-blue-400 hover:underline">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-[Tajawal]">
      
      {/* --- Navbar (مطابق للصفحة الرئيسية الجديدة) --- */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md border-b border-white/5"></div>
        <div className="container mx-auto px-4 max-w-7xl relative">
          <nav className="flex justify-between items-center h-20">
            
            {/* ✅ اللوجو والاسم الجديد NEXORA SOFT */}
            <Link href="/" className="flex items-center gap-3 transform hover:scale-105 transition duration-300">
              <img 
                src="https://i.postimg.cc/Dy7mjvGn/Futuristic-NEXORA-SOFT-logo-design.png" 
                alt="NEXORA SOFT Logo" 
                className="h-10 w-auto" 
              />
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 hover:to-blue-500">
                NEXORA SOFT
              </span>
            </Link>
            
            {/* 🖥️ القائمة في الديسكتوب (تمت إزالة رقم الهاتف وإضافة الصفحات الديناميكية) */}
            <div className="hidden md:flex gap-8 items-center">
              <Link href="/" className="text-white/90 font-medium hover:text-blue-400 transition relative group">
                الرئيسية
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              {/* 📄 الصفحات الديناميكية */}
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/page/${page.id}`}
                  className="text-gray-400 hover:text-white transition"
                >
                  {page.title}
                </Link>
              ))}

              {isAdmin && (
                <Link href="/admin" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg text-sm font-bold transition hover:bg-emerald-500/30">
                  لوحة التحكم
                </Link>
              )}
              
              <Link href="/projects" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-1">
                تصفح البرامج
              </Link>
            </div>

            {/* 📱 زر قائمة الموبايل */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </nav>

          {/* 📱 قائمة الموبايل المنسدلة (بدون رقم هاتف) */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-4 right-4 bg-[#1e293b]/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl z-50 flex flex-col p-4 gap-4 animate-in-up">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg p-2 border-b border-gray-700">
                الرئيسية
              </Link>
              <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg p-2 border-b border-gray-700">
                تصفح البرامج
              </Link>
              
              {/* الصفحات الديناميكية في الموبايل */}
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={`/page/${p.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white font-bold text-lg p-2 border-b border-gray-700"
                >
                  {p.title}
                </Link>
              ))}

              {isAdmin && (
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-400 font-bold text-lg p-2">
                  لوحة التحكم
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* --- المحتوى الرئيسي للصفحة --- */}
      {/* pt-20 مهم ليعطي مسافة للنافبار الثابت */}
      <main className="pt-20">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: data.content || "<p>لا يوجد محتوى</p>" 
          }} 
          className="prose prose-invert prose-lg max-w-none p-4"
        />
      </main>

      {/* --- Footer (الفوتر المحدث) --- */}
      <footer className="bg-[#020617] py-12 border-t border-white/5 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              {/* ✅ تحديث الاسم في الفوتر */}
              <div className="text-2xl font-black text-white mb-4">NEXORA SOFT</div>
              <div className="text-lg text-blue-300 mb-4">Building Tomorrow’s Technology</div>
              <p className="text-gray-500 text-sm">نحول أفكارك إلى واقع رقمي ملموس.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition">الرئيسية</Link></li>
                <li><Link href="/projects" className="text-gray-400 hover:text-white transition">المشاريع</Link></li>
                <li><Link href="/work" className="text-gray-400 hover:text-white transition">أعمالنا</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">تواصل</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">📍 القاهرة، مصر</li>
                <li className="flex items-center gap-2">📧 info@devsoft.com</li>
                <li className="flex items-center gap-2 font-bold text-blue-400">📞 01094222737</li>
              </ul>
            </div>
            <div>
               {/* زر تسجيل الخروج إذا كان أدمن */}
               {isAdmin && (
                 <button onClick={handleLogout} className="text-red-500 hover:text-red-400 text-sm underline mt-4">
                   تسجيل خروج
                 </button>
               )}
            </div>
          </div>
          <div className="text-center text-gray-600 text-sm pt-8 border-t border-white/10">
            © 2024 NEXORA SOFT. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

    </div>
  );
}