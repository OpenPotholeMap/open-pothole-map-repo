import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { FIREBASE_APPLICATION_CREDENTIALS } from "./envs";

const firebaseApp = initializeApp({
  credential: FIREBASE_APPLICATION_CREDENTIALS
    ? cert(FIREBASE_APPLICATION_CREDENTIALS)
    : applicationDefault()
});

export default firebaseApp;
