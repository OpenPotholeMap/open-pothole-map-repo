import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

export abstract class ApplicationSpecificError extends Error {
  public metadata: object;
  public statusCode: number;

  constructor(message: string, metadata: object, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
    this.statusCode = statusCode;
  }
}

export class ResourceNotFoundError extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 404);
  }
}

export class UnauthorizedError extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 401);
  }
}

export class ForbiddenError extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 403);
  }
}

export class DuplicateResourceError extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 409);
  }
}

export class InternalServerError extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 500);
  }
}

export class BadRequest extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 400);
  }
}

export class LinkProcessingBadRequest extends BadRequest {}

export class InterviewInsightBadRequest extends BadRequest {}

export class EmailError extends ApplicationSpecificError {
  constructor(message: string, metadata: object) {
    super(message, metadata, 500);
  }
}

export const routeErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const { statusCode, errors } = handleError(err);
  res.status(statusCode).json({ errors });
  return;
};

export const handleError = (error: unknown) => {
  // console.dir(error, { depth: null });
  if (error instanceof ZodError) {
    console.log(error);
    return {
      statusCode: 400,
      errors: error.issues.map((issue) => ({
        message: issue.message,
      })),
    };
  } else if (
    error instanceof jwt.JsonWebTokenError ||
    error instanceof jwt.TokenExpiredError
  ) {
    const unauthorized = new UnauthorizedError(error.message, { cause: "jwt" });
    return {
      statusCode: unauthorized.statusCode,
      errors: [{ message: unauthorized.message }],
    };
  } else if (error instanceof ApplicationSpecificError) {
    return {
      statusCode: error.statusCode,
      errors: [{ message: error.message }],
    };
  } else {
    return { statusCode: 500, errors: [{ message: "Unknown server error" }] };
  }
};
