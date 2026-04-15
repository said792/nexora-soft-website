"use client";

import { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../lib/firebase"; // تأكد إن المسار صحيح، لو الملف جواه app غيّر النقطتين حسب مكانك
import Link from "next/link";

export default function ProfitsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- جلب الصفحات للقائمة (عشان النافبار يشتغل زي بقيه الموقع) ---
  useEffect(() => {
    async function fetchPages() {
      try {
        const snapshot = await getDocs(collection(db, "site_pages"));
        setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    }
    fetchPages();
    if (typeof window !== 'undefined' && localStorage.getItem('siteAdmin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // --- منطق الحاسبة (نفس الكود اللي انت عملته، بس معمول بـ React) ---
  const [inputs, setInputs] = useState({ rev: '', raw: '', wages: '', mach: '', adm: '' });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState(false);

  const handleCalc = () => {
    const rev = parseFloat(inputs.rev) || 0;
    const raw = parseFloat(inputs.raw) || 0;
    const wages = parseFloat(inputs.wages) || 0;
    const mach = parseFloat(inputs.mach) || 0;
    const adm = parseFloat(inputs.adm) || 0;

    const expenses = raw + wages + mach + adm;
    const net = rev - expenses;

    if (net <= 0) {
      setError(true);
      setResult(null);
    } else {
      setError(false);
      setResult({
        r: rev.toLocaleString(),
        e: expenses.toLocaleString(),
        n: net.toLocaleString(),
        a: (net * 0.40).toFixed(2),
        b: (net * 0.15).toFixed(2),
        c: (net * 0.10).toFixed(2),
        d: (net * 0.10).toFixed(2),
        f: (net * 0.10).toFixed(2),
        g: (net * 0.15).toFixed(2),
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-[Tajawal]">
      
      {/* --- Navbar (مثل باقي الموقع) --- */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md border-b border-white/5"></div>
        <div className="container mx-auto px-4 max-w-7xl relative">
          <nav className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 transform hover:scale-105 transition duration-300">
              <img src="https://i.postimg.cc/Dy7mjvGn/Futuristic-NEXORA-SOFT-logo-design.png" alt="Logo" className="h-10 w-auto" />
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 hover:to-blue-500">NEXORA SOFT</span>
            </Link>
            
            <div className="hidden md:flex gap-8 items-center">
              <Link href="/" className="text-white/90 font-medium hover:text-blue-400 transition relative group">
                الرئيسية
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {pages.map((page) => (
                <Link key={page.id} href={`/page/${page.id}`} className="text-gray-400 hover:text-white transition">{page.title}</Link>
              ))}
              {isAdmin && <Link href="/admin" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg text-sm font-bold transition hover:bg-emerald-500/30">لوحة التحكم</Link>}
              <Link href="/projects" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-1">تصفح البرامج</Link>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </nav>
        </div>
      </header>

      {/* --- المحتوى (الحاسبة) --- */}
      <main className="pt-24 pb-10 px-4">
        <style jsx>{`
          :root {
            --bg1:#0f172a; --bg2:#111827; --card:rgba(255,255,255,0.06);
            --card2:rgba(255,255,255,0.1); --text:#e5e7eb; --muted:#9ca3af;
            --primary:#8b5cf6; --secondary:#06b6d4; --success:#22c55e;
            --warning:#f59e0b; --danger:#ef4444;
          }
          .ps-header { text-align:center; padding:25px; border-radius:16px; background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2)); backdrop-filter: blur(10px); border:1px solid rgba(255,255,255,0.1); margin-bottom:20px; }
          .ps-container { max-width:1100px; margin: auto; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          @media(max-width: 900px){ .ps-container{grid-template-columns:1fr;} }
          .ps-card { background:var(--card); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:18px; backdrop-filter: blur(12px); box-shadow:0 10px 30px rgba(0,0,0,0.3); }
          .ps-title { font-size:1.1rem; margin-bottom:15px; color:var(--primary); font-weight:bold; display:flex; align-items:center; gap:8px; }
          .ps-label { font-size:0.85rem; color:var(--muted); margin-bottom:5px; display:block; }
          .ps-input { width:100%; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2); color:white; outline:none; margin-bottom:15px; font-size:1rem; }
          .ps-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(139,92,246,0.2); }
          .ps-summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
          .ps-box { background:var(--card2); padding:12px; border-radius:12px; text-align:center; }
          .ps-box h3 { font-size:0.8rem; color:var(--muted); margin-bottom:5px; }
          .ps-box span { font-size:1.2rem; font-weight:bold; }
          .ps-net { grid-column:span 2; background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(6,182,212,0.2)); border:1px solid rgba(34,197,94,0.3); }
          .ps-btn { width:100%; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg,var(--primary),var(--secondary)); color:white; cursor:pointer; margin-top:10px; font-weight:bold; }
          .ps-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px dashed rgba(255,255,255,0.1); }
          .ps-badge { background:rgba(139,92,246,0.2); color:#d8b4fe; padding:2px 8px; border-radius:20px; font-size:0.75rem; margin-right:8px; }
          .ps-error { display:block; background:rgba(239,68,68,0.15); color:#fca5a5; padding:12px; border-radius:10px; margin-bottom:15px; text-align:center; }
          .ps-chart-container { display:flex; justify-content:center; margin:20px 0; }
          .ps-chart { width:160px; height:160px; border-radius:50%; background:conic-gradient(var(--primary) 0% 40%, var(--success) 40% 55%, var(--warning) 55% 65%, var(--secondary) 65% 75%, var(--danger) 75% 85%, #64748b 85% 100%); position:relative; }
          .ps-chart::after { content:""; position:absolute; width:100px; height:100px; background:var(--bg2); border-radius:50%; top:50%; left:50%; transform:translate(-50%,-50%); box-shadow:inset 0 0 20px rgba(0,0,0,0.5); }
        `}</style>

        <div className="ps-header">
          <h1 className="text-2xl font-bold">نظام توزيع أرباح مشروع المدرسة 2026</h1>
          <p className="text-gray-400">واجهة حديثة لحساب صافي الربح وتوزيعه تلقائياً</p>
        </div>

        <div className="ps-container">
          {/* Input Section */}
          <div className="ps-card">
            <div className="ps-title">💰 البيانات المالية</div>
            
            {error && <div className="ps-error">⚠️ لا يوجد ربح كافٍ للتوزيع</div>}
            
            <label className="ps-label">الإيرادات (المبيعات)</label>
            <input className="ps-input" type="number" placeholder="0" value={inputs.rev} onChange={e => setInputs({...inputs, rev: e.target.value})} />
            
            <label className="ps-label">تكلفة الخامات</label>
            <input className="ps-input" type="number" placeholder="0" value={inputs.raw} onChange={e => setInputs({...inputs, raw: e.target.value})} />
            
            <label className="ps-label">الأجور</label>
            <input className="ps-input" type="number" placeholder="0" value={inputs.wages} onChange={e => setInputs({...inputs, wages: e.target.value})} />
            
            <label className="ps-label">الصيانة</label>
            <input className="ps-input" type="number" placeholder="0" value={inputs.mach} onChange={e => setInputs({...inputs, mach: e.target.value})} />
            
            <label className="ps-label">مصاريف إدارية</label>
            <input className="ps-input" type="number" placeholder="0" value={inputs.adm} onChange={e => setInputs({...inputs, adm: e.target.value})} />

            <button className="ps-btn" onClick={handleCalc}>احسب التوزيع 🚀</button>
          </div>

          {/* Result Section */}
          <div className="ps-card">
            <div className="ps-title">📊 النتائج والتوزيع</div>
            
            <div className="ps-summary">
              <div className="ps-box"><h3>الإيرادات</h3><span>{result ? result.r : '0'}</span></div>
              <div className="ps-box"><h3>المصروفات</h3><span>{result ? result.e : '0'}</span></div>
              <div className="ps-box ps-net"><h3>صافي الربح</h3><span>{result ? result.n : '0'}</span></div>
            </div>

            <div className="ps-chart-container">
              <div className="ps-chart"></div>
            </div>

            <div style={{margin:'15px 0', borderTop:'1px solid rgba(255,255,255,0.1)'}}></div>

            <div className="ps-row"><div className="name">لجنة التنفيذ <span className="ps-badge">40%</span></div><div className="val">{result ? result.a : '0'}</div></div>
            <div className="ps-row"><div className="name">الطلاب <span className="ps-badge">15%</span></div><div className="val">{result ? result.b : '0'}</div></div>
            <div className="ps-row"><div className="name">الصيانة <span className="ps-badge">10%</span></div><div className="val">{result ? result.c : '0'}</div></div>
            <div className="ps-row"><div className="name">الإدارة <span className="ps-badge">10%</span></div><div className="val">{result ? result.d : '0'}</div></div>
            <div className="ps-row"><div className="name">معاونة <span className="ps-badge">10%</span></div><div className="val">{result ? result.f : '0'}</div></div>
            <div className="ps-row"><div className="name">احتياطي <span className="ps-badge">15%</span></div><div className="val">{result ? result.g : '0'}</div></div>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-[#020617] py-12 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 text-sm pt-8 border-t border-white/10">
            © 2024 NEXORA SOFT. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

    </div>
  );
}