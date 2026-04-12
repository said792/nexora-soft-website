// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
// استدعاء getAnalytics تم إلغاؤه هنا لأنه يسبب خطأ في Next.js Server Side

// Your web app's Firebase configuration (من كودك)
const firebaseConfig = {
  apiKey: "AIzaSyAUZOX_fpdBYm5ko09nF_sbvC1rjWxPHf4",
  authDomain: "my-portfolio-28ddc.firebaseapp.com",
  projectId: "my-portfolio-28ddc",
  storageBucket: "my-portfolio-28ddc.firebasestorage.app",
  messagingSenderId: "718123877519",
  appId: "1:718123877519:web:cb78ef548db53ac7c15cfa",
  measurementId: "G-XCY230YTSF"
};

// Initialize Firebase (مع التأكد من عدم تهيئته مرتين)
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// تهيئة قاعدة البيانات
const db: Firestore = getFirestore(app);

export { db };