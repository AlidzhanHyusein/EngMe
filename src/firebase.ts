import {initializeApp} from "firebase/app";
import {getAuth, GoogleAuthProvider, connectAuthEmulator} from "firebase/auth";
import {getFirestore, connectFirestoreEmulator} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === "true";

if (USE_EMULATORS) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", {disableWarnings: true});
    console.log("✅ Auth emulator connected");
  } catch {}
  try {
    connectFirestoreEmulator(db, "localhost", 8081);
    console.log("✅ Firestore emulator connected");
  } catch {}
} else {
  console.log("🔥 Using production Firebase");
}
