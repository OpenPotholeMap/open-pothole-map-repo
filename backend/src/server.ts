import express from 'express';
import cors from 'cors';
import envConfig from './config/envs.js';

const app = express();

// Simple CORS setup
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Start server
app.listen(envConfig.port, () => {
  console.log(`Server running on port ${envConfig.port}`);
});