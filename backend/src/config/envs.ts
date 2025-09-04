
import dotenv from 'dotenv';

dotenv.config()

const envConfig = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 8000,
}

export default envConfig;
