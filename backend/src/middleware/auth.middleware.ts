import { handleError } from "@/utils/errors";
import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/envs";
import { UserModel } from "@/models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string };
      user?: { id: string; role?: string };
      service?: { role: string };
    }
  }
}

const getAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const anyReq = req as any;
  const cookies = anyReq.cookies as Record<string, string> | undefined;
  if (
    cookies &&
    typeof cookies === "object" &&
    typeof cookies["access_token"] === "string"
  ) {
    return cookies["access_token"];
  }
  const cookieHeader = req.headers["cookie"];
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(/;\s*/);
  for (const p of pairs) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const key = p.substring(0, idx).trim();
    const val = decodeURIComponent(p.substring(idx + 1));
    if (key === "access_token") return val;
  }
  return undefined;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await UserModel.findById(decoded.id).lean();
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    if (user.isActive === false) {
      res.status(403).json({ message: "Account is deactivated" });
      return;
    }
    req.auth = { userId: decoded.id };
    req.user = { id: decoded.id, role: user.role };
    (req.body as any).userId = decoded.id;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const attachUserFromToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getAccessToken(req);
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await UserModel.findById(decoded.id).lean();
    if (!user || user.isActive === false) return next();
    req.auth = { userId: decoded.id };
    req.user = { id: decoded.id, role: user.role };
    (req.body as any).userId = decoded.id;
    next();
  } catch {
    next();
  }
};

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const wrappedHandlers = (
  handlers: AsyncRequestHandler[]
): RequestHandler[] => {
  return handlers.map((handler: AsyncRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  });
};

export const routeErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { statusCode, errors } = handleError(err);
  res.status(statusCode).json({ errors });
  return;
};

export const sanitizeMiddleware = () =>
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`This request [${key}] is sanitized`, req);
    },
  });
