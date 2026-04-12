// app/contact/page.js
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6">تواصل معي</h1>
        <p className="text-gray-400 mb-8">هل تريد نظام مخصص لمؤسستك؟ تواصل معي مباشرة.</p>
        
        <div className="space-y-4">
          <a href="https://wa.me/201000000000" target="_blank" 
             className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold transition">
            <span>واتساب</span>
          </a>
          
          <a href="https://facebook.com/yourpage" target="_blank"
             className="flex items-center justify-center gap-3 w-full bg-blue-800 hover:bg-blue-900 py-3 rounded-xl font-bold transition">
            <span>فيسبوك</span>
          </a>
        </div>
      </div>
    </div>
  );
}