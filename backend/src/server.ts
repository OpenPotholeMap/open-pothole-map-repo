import express from 'express';
import envConfig from './config/envs.js';

const app = express();

app.listen(envConfig.port, () => {
    console.log(`Server is running on port ${envConfig.port}`);
})