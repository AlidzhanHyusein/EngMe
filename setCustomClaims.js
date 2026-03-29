import admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Set custom claims for HR role
admin
  .auth()
  .setCustomUserClaims("D7eJB1I7QZb1zWEYOuieN5rgsp12", {role: "hr"})
  .then(() => {
    console.log("Custom claims set for HR role.");
  })
  .catch((error) => {
    console.error("Error setting custom claims:", error);
  });
