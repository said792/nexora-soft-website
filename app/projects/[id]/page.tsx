"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, query, collection, getDocs, where, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  videoUrls: string[];
  downloadUrl: string;
}

// --- دوال مساعدة ---
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const isFacebookUrl = (url: string) => {
  return url.includes("facebook.com") || url.includes("fb.watch");
};

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // حالة التبويبات
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
  
  // حالة النوافذ المنبثقة (Modals)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  // حالة كود التفعيل الجديدة
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  
  // --- حالة القائمة والصفحات ---
  const [pages, setPages] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    async function fetchProject() {
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const p: Project = {
            id: docSnap.id,
            title: data.title || "",
            description: data.description || "",
            category: data.category || "",
            downloadUrl: data.downloadUrl || "",
            images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
            videoUrls: Array.isArray(data.videoUrls) ? data.videoUrls : (data.videoUrl ? [data.videoUrl] : []),
          };
          setProject(p);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    }

    // جلب الصفحات للقائمة
    async function fetchPages() {
      try {
        const snapshot = await getDocs(collection(db, "site_pages"));
        setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    }

    // التحقق من حالة الأدمن
    if (typeof window !== 'undefined' && localStorage.getItem('siteAdmin') === 'true') {
      setIsAdmin(true);
    }

    fetchProject();
    fetchPages();
  }, [id]);

  // --- دالة ذكية لاكتشاف اتجاه النص (عربي أم إنجليزي) ---
  const getTextDirection = (text: string) => {
    if (!text) return 'rtl'; // افتراضي عربي
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'rtl' : 'ltr';
  };

  // --- دوال التنقل في الميديا ---
  const nextMedia = () => {
    const length = activeTab === "images" ? project?.images.length : project?.videoUrls.length;
    if (length) setCurrentMediaIndex((prev) => (prev + 1) % length);
  };

  const prevMedia = () => {
    const length = activeTab === "images" ? project?.images.length : project?.videoUrls.length;
    if (length) setCurrentMediaIndex((prev) => (prev - 1 + length) % length);
  };

  const openImage = (index: number) => {
    setActiveTab("images");
    setCurrentMediaIndex(index);
    setIsImageModalOpen(true);
  };

  const openVideo = (index: number) => {
    setActiveTab("videos");
    setCurrentMediaIndex(index);
    setIsVideoModalOpen(true);
  };

  // --- دالة التحقق من كود التفعيل ---
  const handleVerifyCode = async () => {
    const codeToCheck = enteredCode.trim();
    if (!codeToCheck) return;
    setCodeError("");
    
    try {
      const q = query(collection(db, "activation_codes"), where("code", "==", codeToCheck));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setCodeError("الكود غير صحيح");
        return;
      }

      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();

      if (codeData.used) {
        setCodeError("هذا الكود مستخدم بالفعل!");
        return;
      }

      await updateDoc(doc(db, "activation_codes", codeDoc.id), { used: true });
      setIsCodeModalOpen(false);
      window.open(project?.downloadUrl, '_blank');
      setEnteredCode("");
      
    } catch (error) {
      console.error("Error verifying code:", error);
      setCodeError("حدث خطأ");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center text-2xl">جاري التحميل...</div>;
  if (!project) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center text-2xl text-red-500">غير موجود</div>;

  const heroImage = project.images[0] || "https://via.placeholder.com/1200x600?text=No+Image";

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-[Tajawal]">
      
      {/* --- Navbar --- */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md border-b border-white/5"></div>
        <div className="container mx-auto px-4 max-w-7xl relative">
          <nav className="flex justify-between items-center h-20">
            
            {/* اللوجو والاسم */}
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
              
              <Link href="/projects" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-blue-500/25 transform hover:-translate-y-1">
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
      <main className="pt-20">
        
        {/* 1. قسم الهيرو */}
        <div className="relative w-full h-[60vh] overflow-hidden group">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
          
          <Link href="/projects" className="absolute top-24 left-6 md:top-28 md:left-8 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md transition flex items-center gap-2 z-20 border border-white/20">
            <span>←</span> رجوع للقائمة
          </Link>
          
          <div className="absolute bottom-0 w-full p-8 md:p-12 z-10">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold mb-4 inline-block">{project.category}</span>
            <h1 className="text-4xl md:text-7xl font-black mb-4 leading-tight drop-shadow-lg">{project.title}</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-12">
          {/* 2. الوصف (تم التعديل هنا لدعم الاتجاه الذكي) */}
          <div className="bg-gray-800/50 border border-gray-700 p-8 rounded-2xl backdrop-blur-sm mb-10">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">عن البرنامج</h2>
            
            {/* ✅ إضافة dir ديناميكي حسب لغة النص */}
            <p 
              dir={getTextDirection(project.description)}
              className="text-gray-300 text-lg leading-relaxed whitespace-pre-line"
            >
              {project.description}
            </p>
          </div>

          {/* 3. التبويبات */}
          <div className="flex gap-4 mb-6 border-b border-gray-700 pb-1">
            <button 
              onClick={() => setActiveTab("images")}
              className={`pb-3 px-6 font-bold transition ${activeTab === "images" ? "text-blue-400 border-b-4 border-blue-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              معرض الصور ({project.images.length})
            </button>
            <button 
              onClick={() => setActiveTab("videos")}
              className={`pb-3 px-6 font-bold transition ${activeTab === "videos" ? "text-red-400 border-b-4 border-red-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              الفيديوهات ({project.videoUrls.length})
            </button>
          </div>

          {/* محتوى التبويبات */}
          {activeTab === "images" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.images.map((img, idx) => (
                <div key={idx} onClick={() => openImage(idx)} className="aspect-video bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition relative group">
                  <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-4xl">🔍</span>
                  </div>
                </div>
              ))}
              {project.images.length === 0 && <p className="col-span-full text-gray-500 text-center py-10">لا توجد صور</p>}
            </div>
          )}

          {activeTab === "videos" && (
            <div className="space-y-4">
              {project.videoUrls.map((vid, idx) => (
                <div key={idx} onClick={() => openVideo(idx)} className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl hover:bg-gray-700 cursor-pointer transition border border-gray-700 hover:border-red-500 group">
                  <div className="w-32 h-20 bg-black rounded-lg flex-shrink-0 relative overflow-hidden">
                     <img src={heroImage} className="w-full h-full object-cover opacity-60" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <span className="text-white ml-1">▶</span>
                       </div>
                     </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white group-hover:text-red-400 transition">فيديو شرحي #{idx + 1}</h4>
                    <p className="text-sm text-gray-400">اضغط للمشاهدة</p>
                  </div>
                </div>
              ))}
              {project.videoUrls.length === 0 && <p className="text-gray-500 text-center py-10">لا توجد فيديوهات</p>}
            </div>
          )}
          
          {/* زر التحميل */}
          <div className="mt-16 text-center">
            <button 
              onClick={() => setIsCodeModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-3xl font-black py-6 px-16 rounded-full shadow-2xl hover:scale-105 transition duration-300 transform"
            >
              تحميل البرنامج
            </button>
            <p className="text-gray-500 mt-4 text-sm">مجاني بالكامل</p>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-[#020617] py-12 border-t border-white/5 relative overflow-hidden mt-20">
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

      {/* --- 4. موديل الصور --- */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm">
          <button onClick={() => setIsImageModalOpen(false)} className="absolute top-4 right-4 text-white text-4xl hover:text-red-500">&times;</button>
          <button onClick={prevMedia} className="absolute left-4 text-white text-5xl hover:text-blue-500 p-4">←</button>
          <img src={project.images[currentMediaIndex]} alt="Full" className="max-w-[90%] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
          <button onClick={nextMedia} className="absolute right-4 text-white text-5xl hover:text-blue-500 p-4">→</button>
          <div className="absolute bottom-4 text-white text-sm bg-black/50 px-4 py-2 rounded-full">{currentMediaIndex + 1} / {project.images.length}</div>
        </div>
      )}

      {/* --- 5. موديل الفيديو --- */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm">
          <button onClick={() => setIsVideoModalOpen(false)} className="absolute top-4 right-4 text-white text-4xl hover:text-red-500 z-50">&times;</button>
          <div className="w-full max-w-5xl px-4 relative">
            <button onClick={prevMedia} className="absolute -left-12 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-red-500">←</button>
            <button onClick={nextMedia} className="absolute -right-12 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-red-500">→</button>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              {(() => {
                const vidUrl = project.videoUrls[currentMediaIndex];
                const ytId = getYouTubeId(vidUrl);
                if (isFacebookUrl(vidUrl)) {
                  return <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(vidUrl)}&show_text=false&width=1280`} width="100%" height="100%" style={{border:"none", overflow:"hidden"}} scrolling="no" allowFullScreen></iframe>;
                } else if (ytId) {
                  return <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} allowFullScreen></iframe>;
                } else {
                  return <video src={vidUrl} controls autoPlay className="w-full h-full"></video>;
                }
              })()}
            </div>
            <div className="text-center mt-4 text-gray-400">فيديو {currentMediaIndex + 1} من {project.videoUrls.length}</div>
          </div>
        </div>
      )}

      {/* --- 6. موديل كود التفعيل --- */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-blue-500/50 p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
            
            <button onClick={() => {setIsCodeModalOpen(false); setCodeError("");}} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
            
            <h3 className="text-2xl font-bold text-white mb-2 text-center">تحميل البرنامج</h3>
            <p className="text-gray-400 text-center mb-6 text-sm">
              للحصول على كود التفعيل، يرجى التواصل معنا عبر الواتساب
            </p>

            <div className="mb-4">
              <input 
                type="text" 
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                placeholder="أدخل كود التفعيل هنا"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white text-center text-xl focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            {codeError && (
              <div className="mb-4 text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">
                {codeError}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={handleVerifyCode}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
              >
                تحميل
              </button>
              <a 
                href="https://wa.me/201000000000" 
                target="_blank"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition text-center flex items-center justify-center gap-2"
              >
                <span>📱</span> احصل على الكود
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}