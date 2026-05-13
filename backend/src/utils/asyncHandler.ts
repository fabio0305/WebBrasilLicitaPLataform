import type { NextFunction, Request, RequestHandler, Response } from "express";
// Express v4 does not catch async handler rejections automatically.
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
}
