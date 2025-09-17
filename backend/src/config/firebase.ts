import { initializeApp, applicationDefault } from "firebase-admin/app";

const firebaseApp = initializeApp({ credential: applicationDefault() });

export default firebaseApp;
