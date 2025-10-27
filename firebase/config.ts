
import { initializeApp } from "@firebase/app";
import { getAuth, GoogleAuthProvider } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
import { getStorage } from '@firebase/storage';

// Your web app's Firebase configuration, provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyA6RYMtpAyi_D4ybdJpjF0JENPMkr4ovJs",
  authDomain: "ceasa-campinas.firebaseapp.com",
  projectId: "ceasa-campinas",
  storageBucket: "ceasa-campinas.appspot.com",
  messagingSenderId: "131729335179",
  appId: "1:131729335179:web:77c653f8a272a8dda4c58e",
  measurementId: "G-XBQNGZH84Z"
};

// Initialize Firebase using the v9 modular approach.
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();
