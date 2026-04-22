import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnp_Q614vS64euY7zBRhHS-3f8INzcEAg",
  authDomain: "motorsync-f37fc.firebaseapp.com",
  projectId: "motorsync-f37fc",
  storageBucket: "motorsync-f37fc.firebasestorage.app",
  messagingSenderId: "550191345575",
  appId: "1:550191345575:web:c4bea01ccb54c605a6d082",
  measurementId: "G-T92VF45R1C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
