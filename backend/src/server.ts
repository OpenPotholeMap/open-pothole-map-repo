import app from "@/app";
import { connectDB } from "@/config/database";
import { PORT } from "@/config/envs";

// Connect to database
await connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

// Mobile Same network Debugging
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// });
