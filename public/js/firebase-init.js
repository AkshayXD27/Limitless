// Sakhi Health - Firebase Client Initialization
const firebaseConfig = {
  apiKey: "AIzaSyD-lP1JlqnNeOw23O8LU4KVCDgj3Q7-eAo",
  authDomain: "women-shealth.firebaseapp.com",
  projectId: "women-shealth",
  storageBucket: "women-shealth.firebasestorage.app",
  messagingSenderId: "1094860182470",
  appId: "1:1094860182470:web:dd5f2f83058e839f0118c7",
  measurementId: "G-TZYEJH848B"
};

try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    window.SakhiFirebase = {
      isLoaded: true,
      auth: auth,
      registerWithEmail: async (name, email, password) => {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if (name && cred.user) {
          try {
            await cred.user.updateProfile({ displayName: name });
          } catch (e) {
            console.warn("Could not set displayName on Firebase:", e.message);
          }
        }
        return cred.user;
      },
      loginWithEmail: async (email, password) => {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
      },
      loginWithGoogle: async () => {
        const cred = await auth.signInWithPopup(googleProvider);
        return cred.user;
      },
      signOutUser: async () => {
        await auth.signOut();
      }
    };
    console.log("[Firebase] Auth initialized successfully.");
    window.dispatchEvent(new Event("sakhi-firebase-ready"));
  } else {
    console.warn("[Firebase] Global firebase object not found on window.");
  }
} catch (err) {
  console.error("[Firebase] Initialization error:", err);
}
