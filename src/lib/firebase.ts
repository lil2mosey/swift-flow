
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdD9lkBjUGJvWFD3HISwRVTCedY1iaFP0",
  authDomain: "order-system-1cdbd.firebaseapp.com",
  projectId: "order-system-1cdbd",
  storageBucket: "order-system-1cdbd.firebasestorage.app",
  messagingSenderId: "106371615174",
  appId: "1:106371615174:web:aec9419df531974fb68ac7",
  measurementId: "G-FV2ND6G96P"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
