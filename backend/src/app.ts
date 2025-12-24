import cors from "cors";
import express, { Request, Response } from "express";
import { routeErrorHandler } from "./utils/errors";
import { attachUserFromToken } from "./middleware/auth.middleware";
import routes from "./routes";
import { CLIENT_URL } from "./config/envs";
import morgan from "morgan";

const app = express();

// Simple CORS setup
app.use(
  cors({
    origin: [
      "https://open-pothole-map.xyz",
      "https://www.open-pothole-map.xyz",
    ],
    credentials: true,
  })
);

app.use(morgan("dev"));

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(attachUserFromToken);

app.use("/api", routes);
app.use(routeErrorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).send("Not found");
});

export default app;
