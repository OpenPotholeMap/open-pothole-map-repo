import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCa5Q0zYYTSM0E89bniYLsLUiVh4Ot4_aE",
  authDomain: "open-pothole-map.firebaseapp.com",
  projectId: "open-pothole-map",
  storageBucket: "open-pothole-map.firebasestorage.app",
  messagingSenderId: "150377865515",
  appId: "1:150377865515:web:e6026a2fc98131dba5e56e",
  measurementId: "G-T76HB7HM03"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { app, auth, googleProvider };