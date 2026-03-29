import admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function updateUserRole() {
  try {
    // First check if the document exists
    const docRef = db.collection("users").doc("D7eJB1I7QZb1zWEYOuieN5rgsp12");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      // Update existing document
      await docRef.update({
        role: "hr",
      });
      console.log("User role updated to HR in Firestore");
    } else {
      // Create new document with HR role
      await docRef.set({
        uid: "D7eJB1I7QZb1zWEYOuieN5rgsp12",
        displayName: "Alidzhan", // From the auth export
        email: "ahmedovvv120@gmail.com",
        photoURL: "https://lh3.googleusercontent.com/a/ACg8ocKh9wSWr47x73e2zNhqGY-MeRfxStE8gEMNICnbdu0T35LHgA=s96-c",
        role: "hr",
        points: 0,
        streak: 1,
        badges: ["Newcomer"],
        completedTasksCount: 0,
        onboarded: true,
      });
      console.log("User profile created with HR role in Firestore");
    }
  } catch (error) {
    console.error("Error updating/creating user role:", error);
  }
}

updateUserRole();
