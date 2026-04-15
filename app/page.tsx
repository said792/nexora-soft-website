"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDocs, collection, query, limit, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Project {
  id: string;
  title: string;
  description: string;
  shortDesc?: string;
  category: string;
  image: string;
  images?: string[];
  videoUrls?: string[];
  downloadUrl?: string;
}

// --- كومبوننت الكارت ---
function ProjectCard({ project, onDownloadClick }: { project: Project, onDownloadClick: (url: string) => void }) {
  const displayImage = project.images && project.images.length > 0 ? project.images[0] : project.image;

  return (
    <div className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500">
      
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500"></div>
      <img src={displayImage} alt={project.title} className="w-full h-56 object-cover transition duration-500 group-hover:scale-110" />
      
      <div className="p-6 relative z-10 flex-grow flex flex-col">
        <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-blue-300 bg-blue-500/10 rounded-full w-fit mb-3 border border-blue-500/20">
          {project.category}
        </span>
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition">{project.title}</h3>
        
        <p className="text-gray-400 mb-6 flex-grow text-sm leading-relaxed line-clamp-2">
          {project.shortDesc ? project.shortDesc : (project.description ? project.description.substring(0, 80) + "..." : "")}
        </p>
        
        <div className="flex gap-3 mt-auto">
          <button onClick={() => onDownloadClick(project.downloadUrl || "")} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            <span>⬇</span> تحميل
          </button>
          <Link href={`/projects/${project.id}`} className="flex-1 border border-white/20 text-white hover:bg-white/10 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
            <span>👁️</span> تفاصيل
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [pages, setPages] = useState<any[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const ADMIN_PASSWORD = "admin123"; 

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [targetDownloadUrl, setTargetDownloadUrl] = useState("");
  const [codes, setCodes] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('siteAdmin') === 'true') setIsAdmin(true);

    async function fetchData() {
      try {
        const q = query(collection(db, "projects"), limit(3));
        const snapshot = await getDocs(q);
        const projectsData: Project[] = [];
        snapshot.forEach((doc) => {
          const rawData = doc.data();
          projectsData.push({ 
            ...rawData as Project, 
            id: doc.id,
            images: Array.isArray(rawData.images) ? rawData.images : (rawData.image ? [rawData.image] : []),
          });
        });
        setProjects(projectsData);
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    }

    async function fetchCodes() {
      const q = query(collection(db, "activation_codes"));
      const snapshot = await getDocs(q);
      setCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    async function fetchPages() {
      try {
        const snapshot = await getDocs(collection(db, "site_pages"));
        setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    }

    fetchData();
    fetchCodes();
    fetchPages();
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true); setShowLoginModal(false); localStorage.setItem('siteAdmin', 'true'); setLoginError("");
    } else { setLoginError("كلمة المرور غير صحيحة"); }
  };
  const handleLogout = () => { setIsAdmin(false); localStorage.removeItem('siteAdmin'); };

  const handleDownloadClick = (url: string) => {
    if(!url) { alert("لا يوجد رابط تحميل"); return; }
    setTargetDownloadUrl(url); setShowCodeModal(true);
  };

  const handleVerifyCode = async () => {
    const codeToCheck = enteredCode.trim();
    if (!codeToCheck) return; setCodeError("");
    try {
      const q = query(collection(db, "activation_codes"), where("code", "==", codeToCheck));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { setCodeError("الكود غير صحيح"); return; }
      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();
      if (codeData.used) { setCodeError("هذا الكود مستخدم بالفعل!"); return; }
      await updateDoc(doc(db, "activation_codes", codeDoc.id), { used: true });
      setShowCodeModal(false); window.open(targetDownloadUrl, '_blank'); setEnteredCode("");
    } catch (error) { console.error(error); setCodeError("حدث خطأ"); }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700;900&display=swap');
        body { font-family: 'Tajawal', sans-serif; background-color: #0f172a; color: #f8fafc; overflow-x: hidden; }
        .hero-bg {
          background: linear-gradient(-45deg, #0f172a, #1e293b, #0f172a);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; transform: translateY(20px); }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        .glass-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
      `}</style>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md border-b border-white/5"></div>
        <div className="container mx-auto px-4 max-w-7xl relative">
          <nav className="flex justify-between items-center h-20">
            {/* ✅ تم تعديل اللوجو هنا: أضفنا الصورة بجانب الاسم */}
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
            
            <div className="hidden md:flex gap-8 items-center">
              <Link href="/" className="text-white/90 font-medium hover:text-blue-400 transition relative group">الرئيسية<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span></Link>
              
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/page/${page.id}`}
                  className="text-gray-400 hover:text-white transition"
                >
                  {page.title}
                </Link>
              ))}

              {isAdmin && <Link href="/admin" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg text-sm font-bold transition hover:bg-emerald-500/30">لوحة التحكم</Link>}
              
              <Link href="/projects" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-1">تصفح البرامج</Link>
<Link
  href="/profits-2026"
  className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold 
  bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500
  shadow-lg shadow-blue-500/30
  transition-all duration-300
  hover:shadow-blue-500/50 hover:-translate-y-1
  overflow-hidden"
>
  {/* Glow Effect */}
  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition"></span>

  {/* Icon */}
  <span className="text-lg">📊</span>

  {/* Text */}
  <span className="relative z-10">
    التعليم الفني - توزيع أرباح مشروع رأس المال
  </span>

  {/* Small Badge */}
  <span className="relative z-10 ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
    2026
  </span>
</Link>            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
          </nav>

          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-4 right-4 bg-[#1e293b]/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl z-50 flex flex-col p-4 gap-4 animate-in-up">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg p-2 border-b border-gray-700">الرئيسية</Link>
              <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg p-2 border-b border-gray-700">تصفح البرامج</Link>
              
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

              {isAdmin && <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-400 font-bold text-lg p-2">لوحة التحكم</Link>}
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-bg min-h-[90vh] flex items-center justify-center text-center relative overflow-hidden pt-20 px-4">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <span className="inline-block py-1 px-4 rounded-full bg-white/10 border border-white/20 text-blue-300 text-sm font-bold mb-6 animate-in-up">منصة برمجية احترافية</span>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight text-white animate-in-up delay-100">
            نبتكر المستقبل <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500">سطر برمجي واحد</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto animate-in-up delay-200">
            نحن نحول الأفكار المعقدة إلى حلول برمجية ذكية، سريعة، ومصممة لتخدم أهدافك بكل احترافية.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in-up delay-300">
            <Link href="/projects" className="group relative px-8 py-4 bg-white text-blue-900 font-bold rounded-full text-lg transition hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              استكشف الموقع
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping"></div>
            </Link>
            <Link href="/contact" className="px-8 py-4 border-2 border-blue-500/50 text-white rounded-full text-lg font-bold hover:bg-blue-500/20 transition backdrop-blur-sm">طلب مشروعك</Link>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto animate-in-up delay-200">
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-blue-400 mb-1">50+</div>
              <div className="text-sm text-gray-400">برنامج تم تطويره</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-purple-400 mb-1">100%</div>
              <div className="text-sm text-gray-400">رضا العملاء</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-pink-400 mb-1">24/7</div>
              <div className="text-sm text-gray-400">دعم فني</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-bold tracking-wider text-sm uppercase animate-in-up">اختياراتنا</span>
            <h2 className="text-5xl font-black text-white mt-2 animate-in-up delay-100">أحدث البرامج المميزة</h2>
          </div>
          
          {loading ? (<div className="text-center text-blue-400 text-2xl animate-pulse">جاري تجهيز العرض...</div>) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <div key={project.id} className="animate-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <ProjectCard key={project.id} project={project} onDownloadClick={handleDownloadClick} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900 opacity-20"></div>
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl font-black text-white mb-6">جاهز لنقل مشروعك للمستوى التالي؟</h2>
          <p className="text-gray-300 mb-10 text-lg">انضم إلى قائمة عملائنا الراضين واستفد من خبرتنا في تطوير البرمجيات.</p>
          <div className="flex justify-center">
             <button onClick={() => setShowLoginModal(true)} className="bg-white text-blue-900 px-10 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition shadow-2xl transform hover:scale-105">ابدأ الآن</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020617] py-12 border-t border-white/5 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              {/* ✅ تم تعديل اسم الشركة في الفوتر أيضاً */}
              <div className="text-2xl font-black text-white mb-4">NEXORA SOFT</div>
              <div className="text-lg text-blue-300 mb-4">Building Tomorrow’s Technology</div>
              <p className="text-gray-500 text-sm">نحول أفكارك إلى واقع رقمي ملموس.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition">الرئيسية</Link></li>
                <li><Link href="/projects" className="text-gray-400 hover:text-white transition">المشاريع</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition">من نحن</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">تواصل</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">saidsadeik879@gmail.com</li>
                <li className="text-gray-400">+20 123 456 789</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
             <p className="text-gray-600 text-sm">© 2024 NEXORA SOFT. جميع الحقوق محفوظة.</p>
             <div className="flex gap-4 mt-4 md:mt-0">
               {isAdmin ? (
                 <Link href="/admin" className="text-green-400 hover:text-green-300 text-sm">لوحة التحكم</Link>
               ) : (
                 <button onClick={() => setShowLoginModal(true)} className="text-gray-600 hover:text-white text-sm flex items-center gap-1"><span>🔒</span> دخول الأدمن</button>
               )}
               {isAdmin && <button onClick={handleLogout} className="text-red-500 hover:text-red-400 text-sm underline">تسجيل خروج</button>}
             </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-in-up">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">دخول الإدارة</h3>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="كلمة المرور" className="w-full p-4 rounded-lg bg-[#0f172a] border border-gray-600 text-white focus:border-blue-500 focus:outline-none mb-2" />
            {loginError && <p className="text-red-500 text-center mb-2">{loginError}</p>}
            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold transition hover:shadow-lg">دخول</button>
          </div>
        </div>
      )}

      {/* Code Modal */}
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
              <a href="https://wa.me/01094222737" target="_blank" className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2">احصل على كود</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}