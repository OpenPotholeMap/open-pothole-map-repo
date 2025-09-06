
import dotenv from 'dotenv';

dotenv.config()

const envConfig = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 8000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase',
}

export default envConfig;
