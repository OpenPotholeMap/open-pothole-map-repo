import { initializeApp, cert, getApps } from "firebase-admin/app";

const getFirebaseApp = () => {
  if (!getApps().length) {
    const decoded = Buffer.from(
      process.env.FIREBASE_APPLICATION_CREDENTIALS!,
      "base64"
    ).toString("utf8");

    const credentials = JSON.parse(decoded);
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

    return initializeApp({
      credential: cert(credentials),
    });
  }
  return getApps()[0];
};

export default getFirebaseApp();
