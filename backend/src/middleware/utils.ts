import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";

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

export const sanitizeMiddleware = () =>
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`This request [${key}] is sanitized`, req);
    },
  });
