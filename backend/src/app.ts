import cors from "cors";
import express, { Request, Response } from "express";
import { routeErrorHandler } from "./middleware/utils";
import routes from "./routes";
import { CLIENT_URL } from "./config/envs";

const app = express();

// Simple CORS setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", routes);
app.use(routeErrorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).send("Not found");
});

export default app;
