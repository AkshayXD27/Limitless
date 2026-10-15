// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-lP1JlqnNeOw23O8LU4KVCDgj3Q7-eAo",
  authDomain: "women-shealth.firebaseapp.com",
  projectId: "women-shealth",
  storageBucket: "women-shealth.firebasestorage.app",
  messagingSenderId: "1094860182470",
  appId: "1:1094860182470:web:dd5f2f83058e839f0118c7",
  measurementId: "G-TZYEJH848B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Ignore analytics initialization failure in ad-blocked or non-supported contexts
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Expose clean helper methods for React frontend
window.SakhiFirebase = {
  app,
  auth,
  analytics,
  registerWithEmail: async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch (err) {
        console.warn("Could not set displayName on Firebase:", err.message);
      }
    }
    return cred.user;
  },
  loginWithEmail: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },
  loginWithGoogle: async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  },
  signOutUser: async () => {
    await signOut(auth);
  }
};
