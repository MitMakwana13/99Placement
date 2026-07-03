import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Cannot find resource ${req.method} ${req.originalUrl}`));
}
export default notFoundHandler;
