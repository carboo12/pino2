import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Configuración de proyecto Firebase (studio-9680180520-dbbe0)
const firebaseConfig = {
  apiKey: "AIzaSyBpkjdNmpPtsVuu_63OQLz_UnROkeJR-Zk",
  authDomain: "studio-9680180520-dbbe0.firebaseapp.com",
  projectId: "studio-9680180520-dbbe0",
  storageBucket: "studio-9680180520-dbbe0.firebasestorage.app",
  messagingSenderId: "104051514611",
  appId: "1:104051514611:web:a56b0a2ec514aebf18eb86",
  measurementId: "G-CS50QV7T5F"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios opcionales
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

