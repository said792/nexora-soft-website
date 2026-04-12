"use client";

import { useEffect, useState } from "react";
import { getDocs, collection, query, where, updateDoc, doc } from "firebase/firestore"; // ✅ إضافة الاستيرادات المطلوبة
import { db } from "../../lib/firebase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  shortDesc?: string;
  category: string;
  images: string[];
  videoUrls: string[];
  downloadUrl?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- حالة القائمة (لجلب الصفحات الديناميكية) ---
  const [pages, setPages] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- حالة كود التفعيل والموديل (من الصفحة الرئيسية) ---
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [targetDownloadUrl, setTargetDownloadUrl] = useState("");
  const [codes, setCodes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. جلب البرامج
        const snapshot = await getDocs(collection(db, "projects"));
        const data: Project[] = [];
        snapshot.forEach((doc) => {
          const rawData = doc.data();
          data.push({
            id: doc.id,
            title: rawData.title || "",
            description: rawData.description || "",
            shortDesc: rawData.shortDesc || "",
            category: rawData.category || "",
            downloadUrl: rawData.downloadUrl || "",
            images: Array.isArray(rawData.images) ? rawData.images : (rawData.image ? [rawData.image] : []),
            videoUrls: Array.isArray(rawData.videoUrls) ? rawData.videoUrls : (rawData.videoUrl ? [rawData.videoUrl] : []),
          });
        });
        setProjects(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    // 2. جلب الصفحات للقائمة
    async function fetchPages() {
      try {
        const snapshot = await getDocs(collection(db, "site_pages"));
        setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    }

    // 3. جلب أكواد التفعيل (جديد)
    async function fetchCodes() {
      try {
        const q = query(collection(db, "activation_codes"));
        const snapshot = await getDocs(q);
        setCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching codes:", error);
      }
    }

    // 4. التحقق من حالة الأدمن
    if (typeof window !== 'undefined' && localStorage.getItem('siteAdmin') === 'true') {
      setIsAdmin(true);
    }

    fetchData();
    fetchPages();
    fetchCodes();
  }, []);

  const handleLogout = () => { 
    setIsAdmin(false); 
    localStorage.removeItem('siteAdmin'); 
  };

  // --- دوال التحقق من الكود (نسخة من الصفحة الرئيسية) ---
  const handleDownloadClick = (url: string) => {
    if(!url) { alert("لا يوجد رابط تحميل"); return; }
    setTargetDownloadUrl(url); 
    setShowCodeModal(true);
  };

  const handleVerifyCode = async () => {
    const codeToCheck = enteredCode.trim();
    if (!codeToCheck) return; 
    setCodeError("");
    try {
      const q = query(collection(db, "activation_codes"), where("code", "==", codeToCheck));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { setCodeError("الكود غير صحيح"); return; }
      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();
      if (codeData.used) { setCodeError("هذا الكود مستخدم بالفعل!"); return; }
      
      // تحديث الكود ليصبح مستخدماً
      await updateDoc(doc(db, "activation_codes", codeDoc.id), { used: true });
      
      // فتح الرابط
      setShowCodeModal(false); 
      window.open(targetDownloadUrl, '_blank'); 
      setEnteredCode("");
    } catch (error) { 
      console.error(error); 
      setCodeError("حدث خطأ"); 
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700;900&display=swap');
        body { font-family: 'Tajawal', sans-serif; background-color: #0f172a; color: #f8fafc; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* --- Navbar (نسخة من الصفحة الرئيسية) --- */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md border-b border-white/5"></div>
        <div className="container mx-auto px-4 max-w-7xl relative">
          <nav className="flex justify-between items-center h-20">
            
            {/* اللوجو والاسم الجديد */}
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
            
            {/* القائمة في الديسكتوب */}
            <div className="hidden md:flex gap-8 items-center">
              <Link href="/" className="text-white/90 font-medium hover:text-blue-400 transition relative group">
                الرئيسية
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              {/* الصفحات الديناميكية */}
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
              
              <Link href="/projects" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-blue-500/25 transform hover:-translate-y-1 cursor-default">
                تصفح البرامج
              </Link>
            </div>

            {/* زر الموبايل */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </nav>

          {/* قائمة الموبايل */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-4 right-4 bg-[#1e293b]/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl z-50 flex flex-col p-4 gap-4 animate-in-up">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg p-2 border-b border-gray-700">الرئيسية</Link>
              
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

              <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="bg-blue-600 text-white text-center font-bold p-3 rounded-lg">البرامج</Link>
              
              {isAdmin && <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-400 font-bold text-lg p-2">لوحة التحكم</Link>}
            </div>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="min-h-screen bg-[#0f172a] pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16 fade-in-up">
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
              مكتبة البرامج الكاملة
            </h1>
            <p className="text-gray-400 text-lg">تصفح جميع الحلول البرمجية التي قمنا بتطويرها</p>
          </div>
          
          {loading ? (
            <div className="text-center text-blue-400 text-2xl animate-pulse fade-in-up">جاري تحميل البرامج...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <div key={project.id} className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  
                  {/* توهج خلفي */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500"></div>

                  {/* Slider الصور */}
                  <div className="relative w-full h-56 bg-black overflow-hidden">
                    <div className="flex overflow-x-auto snap-x snap-mandatory h-full scroll-smooth no-scrollbar">
                      {(project.images.length > 0 ? project.images : ["https://via.placeholder.com/400x250?text=No+Image"]).map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${project.title} ${index}`}
                          className="w-full h-full object-cover flex-shrink-0 snap-center"
                        />
                      ))}
                    </div>
                    <span className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm z-10">
                      {project.category}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-grow relative z-10">
                    <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-400 transition">{project.title}</h3>
                    
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed flex-grow">
                      {project.shortDesc 
                        ? project.shortDesc 
                        : (project.description ? project.description.substring(0, 80) + "..." : "")
                      }
                    </p>

                    <div className="flex gap-3 mt-auto">
                      {/* ✅ تم تعديل زر التحميل لاستدعاء دالة الموديل */}
                      <button 
                        onClick={() => handleDownloadClick(project.downloadUrl || "")}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        <span>⬇</span> تحميل
                      </button>
                      
                      <Link 
                        href={`/projects/${project.id}`}
                        className="flex-1 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                      >
                        <span>👁️</span> التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="bg-[#020617] py-12 border-t border-white/5 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
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
          </div>
          <div className="text-center text-gray-600 text-sm pt-8 border-t border-white/10">
            © 2024 NEXORA SOFT. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      {/* --- Code Modal (تم إضافته من الصفحة الرئيسية) --- */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-blue-500 p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-in-up">
            <button onClick={() => {setShowCodeModal(false); setCodeError("");}} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">✕</button>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">تحميل البرنامج</h3>
            <p className="text-gray-400 text-sm text-center mb-6">أدخل كود التفعيل للمتابعة</p>
            <input type="text" value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()} placeholder="أدخل الكود هنا" className="w-full p-3 rounded-lg bg-[#0f172a] border border-gray-600 text-white text-center mb-2 focus:border-blue-500 focus:outline-none text-lg" autoFocus />
            {codeError && <div className="bg-red-500/10 border border-red-500 text-red-500 text-xs p-2 rounded mb-3 text-center">{codeError}</div>}
            <div className="flex gap-2">
              <button onClick={handleVerifyCode} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-bold transition shadow-lg">تحميل</button>
              <a href="https://wa.me/201000000000" target="_blank" className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2">احصل على كود</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}