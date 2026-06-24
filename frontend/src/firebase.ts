// Import the functions you need from the SDKs you need
import { Capacitor } from "@capacitor/core";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1UL2PsTyU2HDdeMFEOB64s6lmuvzuM1M",
  authDomain: "shemaps-23078.firebaseapp.com",
  projectId: "shemaps-23078",
  storageBucket: "shemaps-23078.firebasestorage.app",
  messagingSenderId: "1017408436204",
  appId: "1:1017408436204:web:41c33d70ce6ff913adb2c9",
  measurementId: "G-7VJCFPCQ1T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let firebaseAuth: Auth;

try {
  firebaseAuth = Capacitor.isNativePlatform()
    ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
    : getAuth(app);
} catch {
  firebaseAuth = getAuth(app);
}

export const auth = firebaseAuth;
export const db = getFirestore(app);

export default app;
