import {
  Inject,
  Injectable,
  NestMiddleware,
  OnModuleInit,
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { RequestContextModel } from "./request-context.model";
import { REQUEST_CONTEXT_MODULE_OPTIONS } from "./constants";
import { RequestContextModuleOptions } from "./request-context.module";

@Injectable()
export class RequestContextMiddleware<T extends RequestContextModel>
  implements NestMiddleware<Request, Response>, OnModuleInit
{
  constructor(
    @Inject(REQUEST_CONTEXT_MODULE_OPTIONS)
    private readonly options: RequestContextModuleOptions<T>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    middleware(this.options.contextClass, req, res, next);
  }

  onModuleInit(): void {
    // do nothing
  }
}

export function requestContextMiddleware<T extends RequestContextModel>(
  contextClass: new () => T,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(contextClass, req, res, next);
  };
}

function middleware<T extends RequestContextModel>(
  contextClass: new () => T,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  RequestContextModel.start(contextClass);
  next();
}
