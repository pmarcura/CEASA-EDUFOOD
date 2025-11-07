
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/*
████████╗██╗░░██╗██████╗░███████╗██████╗░░█████╗░████████╗███████╗
╚══██╔══╝██║░░██║██╔══██╗██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
░░░██║░░░███████║██████╔╝█████╗░░██████╔╝██║░░██║░░░██║░░░█████╗░░
░░░██║░░░██╔══██║██╔══██╗██╔══╝░░██╔══██╗██║░░██║░░░██║░░░██╔══╝░░
░░░██║░░░██║░░██║██║░░██║███████╗██║░░██║╚█████╔╝░░░██║░░░███████╗
░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚══════╝

*** THIS IS A PLACEHOLDER CONFIGURATION ***

To run this application, you MUST create your own Firebase project and replace the values below.

STEPS:
1. Go to the Firebase Console: https://console.firebase.google.com/
2. Click "Add project" and follow the steps to create a new project.
3. Once your project is created, click the "</>" icon (for Web) to add a web app.
4. Give your app a nickname and click "Register app".
5. Firebase will provide you with a `firebaseConfig` object. COPY the entire object.
6. PASTE your `firebaseConfig` object here, replacing the placeholder below.
7. In your Firebase project console, go to "Build" -> "Firestore Database".
8. Click "Create database" and start in "production mode". Choose a location.
9. Go to "Build" -> "Authentication".
10. Click the "Sign-in method" tab and enable "Email/Password" and "Google" as providers.

The app will not work until you complete these steps.
*/
const firebaseConfig = {
  apiKey: "AIzaSyA6RYMtpAyi_D4ybdJpjF0JENPMkr4ovJs",
  authDomain: "ceasa-campinas.firebaseapp.com",
  projectId: "ceasa-campinas",
  storageBucket: "ceasa-campinas.firebasestorage.app",
  messagingSenderId: "131729335179",
  appId: "1:131729335179:web:77c653f8a272a8dda4c58e",
  measurementId: "G-XBQNGZH84Z"
};

// Proactive configuration check
const isConfigPlaceholder = Object.values(firebaseConfig).some(
  value => typeof value === 'string' && value.startsWith('REPLACE_WITH_YOUR_')
);

if (isConfigPlaceholder) {
  console.error(
    `
    ================================================================================
    [CONFIG ERROR] Firebase configuration is incomplete. 
    Please follow the instructions in 'firebase/config.ts' to set up your project.
    You need to replace the placeholder values with your actual Firebase credentials.
    The app will render, but login and database features WILL NOT WORK.
    ================================================================================
    `
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export modular services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();