"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// --- 1. تحديث الواجهات (Interfaces) ---
interface Project {
  id: string;
  title: string;
  description: string;       
  shortDesc?: string;      
  category: string;
  images: string[];
  videoUrls: string[];
  downloadUrl: string;
  createdAt?: any;
}

interface SitePage {
  id: string; 
  title: string;
  content: string;
  updatedAt?: any;
}

// --- 2. المكون الفرعي لعرض صف البرنامج ---
function ProjectRow({ p, onEdit, onDelete }: { p: Project, onEdit: (project: Project) => void, onDelete: (id: string) => void }) {
  return (
    <div key={p.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-750 transition">
       <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden shrink-0">
            <img src={p.images[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="thumb" onError={(e) => (e.currentTarget.src = "/placeholder.png")}/>
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-white text-lg truncate">{p.title}</h3>
            <p className="text-xs text-blue-300 bg-blue-900/30 inline-block px-2 py-0.5 rounded">{p.category}</p>
            {p.shortDesc && <p className="text-gray-400 text-xs mt-2 line-clamp-2">{p.shortDesc}</p>}
          </div>
       </div>
       <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={() => onEdit(p)} className="flex-1 md:flex-none bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white border border-yellow-600/50 px-4 py-2 rounded-lg text-sm transition">تعديل</button>
          <button onClick={() => onDelete(p.id)} className="flex-1 md:flex-none bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 px-4 py-2 rounded-lg text-sm transition">حذف</button>
       </div>
    </div>
  );
}

export default function AdminPage() {
  // --- حالة التبويبات ---
  const [activeTab, setActiveTab] = useState<"projects" | "pages" | "codes">("projects");

  // --- حالة البرامج ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDesc, setShortDesc] = useState(""); 
  const [category, setCategory] = useState("");
  const [imageInputs, setImageInputs] = useState<string[]>([""]); 
  const [videoInputs, setVideoInputs] = useState<string[]>([""]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- حالة الصفحات ---
  const [pages, setPages] = useState<SitePage[]>([]);
  const [editingPageSlug, setEditingPageSlug] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  // ✅ إضافة حقل جديد لـ Slug
  const [pageSlug, setPageSlug] = useState(""); 

  // --- حالة الأكواد ---
  const [codes, setCodes] = useState<any[]>([]);

  // --- جلب البيانات ---
  useEffect(() => {
    fetchProjects();
    fetchPages();
    fetchCodes();
  }, []);

  const fetchProjects = async () => {
    const q = query(collection(db, "projects"));
    const snapshot = await getDocs(q);
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
        createdAt: rawData.createdAt
      });
    });
    data.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });
    setProjects(data);
  };

  const fetchPages = async () => {
    const snapshot = await getDocs(collection(db, "site_pages"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SitePage));
    setPages(data);
  };

  const fetchCodes = async () => {
    const q = query(collection(db, "activation_codes"));
    const snapshot = await getDocs(q);
    setCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // --- دوال الصفحات ---
  const handleEditPage = async (slug: string) => {
    const docRef = doc(db, "site_pages", slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setPageTitle(data.title || "");
      setPageContent(data.content || "");
      // ✅ عند التعديل، نملأ حقل الـ slug بالقيمة الموجودة (الـ ID)
      setPageSlug(slug); 
      setEditingPageSlug(slug);
      setActiveTab("pages");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // دالة مساعدة لتنظيف الـ Slug (تحويل المسافات لشرطات وحذف الرموز)
  const cleanSlug = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')           // مسافات -> شرطات
      .replace(/[^\w-]+/g, '')        // حذف أي رموز غير حروف/أرقام
      .replace(/^-+/, '')             
      .replace(/-+$/, '');            
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pageTitle.trim()) {
      alert("الرجاء إدخال عنوان للصفحة");
      return;
    }

    try {
      // ✅ المنطق الجديد: نستخدم ما كتبته في حقل Slug، وإذا كان فارغاً نولده من العنوان
      let slugToUse = pageSlug.trim();
      
      if (!slugToUse && !editingPageSlug) {
        // لو حقل السلاج فارغ وهذه صفحة جديدة، نولد من العنوان (كاحتياطي)
        slugToUse = cleanSlug(pageTitle);
      } else if (!slugToUse && editingPageSlug) {
        // لو حقل السلاج فارغ ونحن نعدل، نحافظ على القديم
        slugToUse = editingPageSlug;
      } else {
        // لو كتبنا شيئاً في حقل السلاج، ننظفه ونستخدمه
        slugToUse = cleanSlug(slugToUse);
      }

      await setDoc(doc(db, "site_pages", slugToUse), {
        title: pageTitle,
        content: pageContent || "<p>لا يوجد محتوى</p>", 
        slug: slugToUse,
        updatedAt: new Date()
      }, { merge: true });

      alert("تم حفظ الصفحة بنجاح!");
      setPageTitle(""); 
      setPageContent(""); 
      setPageSlug(""); // تصفير الحقل الجديد
      setEditingPageSlug(null);
      fetchPages();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  // --- دوال البرامج ---
  const addImageInput = () => setImageInputs([...imageInputs, ""]);
  const removeImageInput = (index: number) => {
    const newInputs = imageInputs.filter((_, i) => i !== index);
    if(newInputs.length === 0) newInputs.push("");
    setImageInputs(newInputs);
  };
  const handleImageChange = (index: number, value: string) => {
    const newInputs = [...imageInputs];
    newInputs[index] = value;
    setImageInputs(newInputs);
  };
  
  const addVideoInput = () => setVideoInputs([...videoInputs, ""]);
  const removeVideoInput = (index: number) => {
    const newInputs = videoInputs.filter((_, i) => i !== index);
    if(newInputs.length === 0) newInputs.push("");
    setVideoInputs(newInputs);
  };
  const handleVideoChange = (index: number, value: string) => {
    const newInputs = [...videoInputs];
    newInputs[index] = value;
    setVideoInputs(newInputs);
  };

  const handleEditProject = (project: Project) => {
    setTitle(project.title); 
    setDescription(project.description); 
    setCategory(project.category); 
    setDownloadUrl(project.downloadUrl);
    setShortDesc(project.shortDesc || ""); 
    setImageInputs(project.images.length > 0 ? project.images : [""]);
    setVideoInputs(project.videoUrls.length > 0 ? project.videoUrls : [""]);
    setEditingId(project.id); 
    setActiveTab("projects");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا البرنامج؟")) return;
    await deleteDoc(doc(db, "projects", id)); 
    fetchProjects();
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    const imagesArray = imageInputs.filter(link => link.trim() !== "");
    const videosArray = videoInputs.filter(link => link.trim() !== "");
    
    const dataPayload = { 
      title, 
      description, 
      shortDesc, 
      category, 
      images: imagesArray, 
      videoUrls: videosArray, 
      downloadUrl, 
      updatedAt: new Date() 
    };
    
    try {
      if (editingId) { 
        await updateDoc(doc(db, "projects", editingId), dataPayload); 
        alert("تم تحديث البرنامج!"); 
      } else { 
        await addDoc(collection(db, "projects"), { ...dataPayload, createdAt: new Date() }); 
        alert("تمت إضافة البرنامج!"); 
      }
      resetProjectForm(); 
      fetchProjects();
    } catch (error) { 
      console.error(error); 
      alert("حدث خطأ أثناء الحفظ"); 
    }
    finally { setLoading(false); }
  };

  const resetProjectForm = () => { 
    setTitle(""); 
    setDescription(""); 
    setShortDesc(""); 
    setCategory(""); 
    setImageInputs([""]); 
    setVideoInputs([""]); 
    setDownloadUrl(""); 
    setEditingId(null); 
  };

  // --- دوال الأكواد ---
  const generateNewCode = async () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try { 
      await addDoc(collection(db, "activation_codes"), { code: newCode, used: false, createdAt: new Date() }); 
      fetchCodes(); 
      alert(`تم توليد الكود: ${newCode}`); 
    } catch (e) { alert("خطأ في توليد الكود"); }
  };
  
  const deleteCode = async (id: string) => { 
    if(!confirm("حذف الكود؟")) return; 
    await deleteDoc(doc(db, "activation_codes", id)); 
    fetchCodes(); 
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-[Tajawal]">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">لوحة التحكم</h1>
          <a href="/" className="text-gray-400 hover:text-white text-sm">العودة للموقع</a>
        </div>

        {/* 1. شريط التبويبات */}
        <div className="flex gap-2 mb-8 bg-gray-800 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab("projects")} className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === "projects" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}>البرامج</button>
          <button onClick={() => setActiveTab("pages")} className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === "pages" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}>الصفحات</button>
          <button onClick={() => setActiveTab("codes")} className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === "codes" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}>الأكواد</button>
        </div>

        {/* 2. محتوى تبويب البرامج */}
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-gray-800 p-6 rounded-2xl border border-gray-700 h-fit">
              <h2 className="text-xl font-bold mb-4 text-blue-400 border-b border-gray-700 pb-2">
                {editingId ? "تعديل البرنامج" : "إضافة برنامج جديد"}
              </h2>
              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">اسم البرنامج *</label>
                  <input type="text" placeholder="مثال: نظام المدارس" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-500 outline-none" required />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">وصف مختصر (للبطاقة) *</label>
                  <input type="text" placeholder="جملة قصيرة تعرف بالبرنامج..." value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-500 outline-none text-sm" />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الوصف الكامل (للتفاصيل) *</label>
                  <textarea placeholder="تفاصيل البرنامج الكاملة..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-500 outline-none h-24 resize-none" required />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">التصنيف *</label>
                  <input type="text" placeholder="مثال: تعليمي، مالي..." value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-500 outline-none" required />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">روابط الصور</label>
                  <div className="space-y-2">
                    {imageInputs.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="url" value={url} onChange={(e) => handleImageChange(i, e.target.value)} placeholder="https://..." className="flex-grow p-2 rounded bg-gray-900 border border-gray-700 text-white text-xs" />
                        {imageInputs.length > 1 && <button type="button" onClick={() => removeImageInput(i)} className="text-red-400 px-2 text-xs hover:text-red-300">حذف</button>}
                      </div>
                    ))}
                    <button type="button" onClick={addImageInput} className="text-xs text-blue-400 hover:text-blue-300 mt-1">+ إضافة صورة أخرى</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">رابط التحميل *</label>
                  <input type="url" placeholder="رابط الملف المضغوط..." value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-500 outline-none" required />
                </div>
                
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/50 transition transform active:scale-95">
                  {loading ? "جاري الحفظ..." : (editingId ? "حفظ التعديلات" : "إضافة البرنامج")}
                </button>
                {editingId && <button type="button" onClick={resetProjectForm} className="w-full text-center text-xs text-gray-500 hover:text-white mt-2">إلغاء التعديل</button>}
              </form>
            </div>

            <div className="lg:col-span-8">
               <h3 className="text-xl font-bold mb-4 text-white">قائمة البرامج ({projects.length})</h3>
               <div className="grid grid-cols-1 gap-4">
                  {projects.length === 0 ? <div className="text-gray-500 text-center py-10">لا توجد برامج مضافة</div> : projects.map((p) => (
                    <ProjectRow key={p.id} p={p} onEdit={handleEditProject} onDelete={handleDeleteProject} />
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* 3. محتوى تبويب الصفحات (المعدل) */}
        {activeTab === "pages" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-gray-800 p-6 rounded-2xl border border-gray-700 h-fit">
              <h2 className="text-xl font-bold mb-4 text-emerald-400 border-b border-gray-700 pb-2">
                {editingPageSlug ? "تعديل الصفحة" : "إنشاء صفحة جديدة"}
              </h2>
              <form onSubmit={handleSavePage} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">عنوان الصفحة (يظهر للناس) *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: عملاؤنا" 
                    value={pageTitle} 
                    onChange={(e) => setPageTitle(e.target.value)} 
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-emerald-500 outline-none" 
                    required 
                  />
                </div>

                {/* ✅ الحقل الجديد: اسم الرابط (Slug) */}
                <div>
                  <label className="block text-xs text-blue-400 mb-1 font-bold">اسم الرابط (Slug) - بالإنجليزي *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: clients أو about-us" 
                    value={pageSlug} 
                    onChange={(e) => setPageSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())} // يتحول لصغير ومسافات لشرطات تلقائياً
                    className="w-full p-3 rounded bg-gray-900 border border-blue-900/50 text-blue-300 font-mono text-sm focus:border-blue-500 outline-none" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1">سيظهر في الرابط هكذا: yoursite.com/page/<span className="text-blue-400">{pageSlug || '...'}</span></p>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">محتوى الصفحة (HTML)</label>
                  <textarea 
                    value={pageContent} 
                    onChange={(e) => setPageContent(e.target.value)} 
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white font-mono text-xs h-64 focus:border-emerald-500 outline-none" 
                    placeholder="<h1>...</h1>"
                  />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/50 transition transform active:scale-95">
                  حفظ الصفحة
                </button>
                {editingPageSlug && <button type="button" onClick={() => {setEditingPageSlug(null); setPageTitle(""); setPageContent(""); setPageSlug("");}} className="w-full text-center text-xs text-gray-500 hover:text-white mt-2">إلغاء التعديل</button>}
              </form>
            </div>

            <div className="lg:col-span-8">
              <h3 className="text-xl font-bold mb-4 text-white">الصفحات المنشورة ({pages.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.length === 0 ? <div className="text-gray-500 text-center py-10 md:col-span-2">لا توجد صفحات مضافة</div> : pages.map((page) => (
                  <div key={page.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col justify-between h-32 hover:border-gray-600 transition">
                    <div>
                      <h4 className="font-bold text-white truncate">{page.title}</h4>
                      <span className="text-xs text-blue-400 font-mono">/{page.id}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEditPage(page.id)} className="flex-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/50 py-1 rounded text-xs transition">تعديل</button>
                      <a href={`/page/${page.id}`} target="_blank" className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white py-1 rounded text-xs text-center transition">مشاهدة</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. محتوى تبويب الأكواد */}
        {activeTab === "codes" && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <h2 className="text-xl font-bold text-purple-400">إدارة أكواد التفعيل</h2>
               <button onClick={generateNewCode} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg transition transform active:scale-95">+ توليد كود جديد</button>
            </div>
            <div className="overflow-x-auto bg-gray-900 rounded-xl">
              <table className="w-full text-right">
                <thead className="bg-gray-800 text-gray-400 text-sm border-b border-gray-700">
                    <tr><th className="p-4">الكود</th><th className="p-4">الحالة</th><th className="p-4">التاريخ</th><th className="p-4">إجراءات</th></tr>
                </thead>
                <tbody>
                  {codes.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">لا توجد أكواد</td></tr> : codes.map((c) => (
                    <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                      <td className="p-4 font-mono font-bold text-lg text-white select-all">{c.code}</td>
                      <td className="p-4">
                        <span className={`text-xs px-3 py-1 rounded-full border ${c.used ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'}`}>
                          {c.used ? "مستخدم" : "جديد"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '-'}
                      </td>
                      <td className="p-4">
                        <button onClick={() => deleteCode(c.id)} className="text-red-500 hover:text-red-400 text-sm font-bold">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}