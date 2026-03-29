import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Only connect to emulators when explicitly enabled via env var.
// Set VITE_USE_EMULATORS=true in a .env.local file for local dev.
// Production builds will use the real Firebase services automatically.
export const USE_EMULATORS =
  import.meta.env.VITE_USE_EMULATORS === "true" ||
  import.meta.env.DEV === true && import.meta.env.VITE_USE_EMULATORS !== "false";

if (USE_EMULATORS) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.log("✅ Connected to Auth emulator");
  } catch {
    console.warn("⚠️ Could not connect to Auth emulator");
  }

  try {
    connectFirestoreEmulator(db, "localhost", 8081);
    console.log("✅ Connected to Firestore emulator");
  } catch {
    console.warn("⚠️ Could not connect to Firestore emulator");
  }
} else {
  console.log("🔥 Using production Firebase");
}
