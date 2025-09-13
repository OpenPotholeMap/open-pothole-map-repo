import app from "@/app";
import { connectDB } from "@/config/database";
import { PORT } from "@/config/envs";

// Connect to database
await connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
