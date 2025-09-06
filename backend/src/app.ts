import cors from 'cors';
import express from 'express';

const app = express();

// Simple CORS setup
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export default app;