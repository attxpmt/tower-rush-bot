import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Оборачивает async-обработчик: любая ошибка (например, упавшая БД)
 * пробрасывается в Express error-middleware, а не вешает запрос до таймаута.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
