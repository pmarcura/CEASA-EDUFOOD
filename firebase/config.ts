// firebase/config.ts

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuração do Firebase da sua aplicação
const firebaseConfig = {
  apiKey: "AIzaSyA6RYMtpAyi_D4ybdJpjF0JENPMkr4ovJs",
  authDomain: "ceasa-campinas.firebaseapp.com",
  projectId: "ceasa-campinas",
  storageBucket: "ceasa-campinas.firebasestorage.app",
  messagingSenderId: "131729335179",
  appId: "1:131729335179:web:77c653f8a272a8dda4c58e",
  measurementId: "G-XBQNGZH84Z"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços para o resto do app
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const db = getFirestore(app);
export const storage = getStorage(app);

// (opcional) export default app se em algum lugar você precisar do app direto
export default app;
