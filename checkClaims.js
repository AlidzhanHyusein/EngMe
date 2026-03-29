import admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

async function checkCustomClaims() {
  try {
    const user = await admin.auth().getUser("D7eJB1I7QZb1zWEYOuieN5rgsp12");
    console.log("Custom claims:", user.customClaims);
  } catch (error) {
    console.error("Error checking custom claims:", error);
  }
}

checkCustomClaims();
