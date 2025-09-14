import { initializeApp, applicationDefault } from "firebase-admin/app";

const app = initializeApp({ credential: applicationDefault() });
