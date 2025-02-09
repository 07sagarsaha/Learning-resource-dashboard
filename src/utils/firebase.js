import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHpC-WFCiWF78DbHrThzaPtIHeJGLMGy0",
  authDomain: "learndashbord.firebaseapp.com",
  projectId: "learndashbord",
  storageBucket: "learndashbord.firebasestorage.app",
  messagingSenderId: "409981005104",
  appId: "1:409981005104:web:e4da0972114fe28436ecf5",
  measurementId: "G-C7M7H5WSTG",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
