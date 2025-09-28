import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { FIREBASE_APPLICATION_CREDENTIALS } from "./envs";

let credentials;

if (FIREBASE_APPLICATION_CREDENTIALS) {
  const decoded = Buffer.from(
    FIREBASE_APPLICATION_CREDENTIALS,
    "base64"
  ).toString("utf8");
  credentials = JSON.parse(decoded);
}

const firebaseApp = initializeApp({
  credential: credentials ? cert(credentials) : applicationDefault(),
});

export default firebaseApp;
