import app from './app.js';
import envConfig from './config/envs.js';
import { connectDB } from './config/database.js';

// Connect to database
await connectDB(envConfig.mongoUri);

// Start server
app.listen(envConfig.port, () => {
  console.log(`Server running on port ${envConfig.port}`);
});