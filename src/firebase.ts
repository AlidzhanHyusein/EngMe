// firebase.js
import {initializeApp} from "firebase/app";
import {getAuth, GoogleAuthProvider, connectAuthEmulator} from "firebase/auth";
import {getFirestore, connectFirestoreEmulator} from "firebase/firestore";

// Firebase config using Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app); // Firestore uses default database
// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Emulator flag
export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === "true";

// Connect to emulators if enabled
if (USE_EMULATORS) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", {disableWarnings: true});
    console.log("✅ Auth emulator connected");
  } catch (err) {
    console.error("❌ Auth emulator failed:", err);
  }

  try {
    connectFirestoreEmulator(db, "localhost", 8081);
    console.log("✅ Firestore emulator connected");
  } catch (err) {
    console.error("❌ Firestore emulator failed:", err);
  }
} else {
  console.log("🔥 Using production Firebase");
}
