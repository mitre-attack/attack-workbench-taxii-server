import { Request } from "express";
import { RequestContextModel } from "./request-context.model";

export class RequestContext extends RequestContextModel {
  "x-request-id": string;
  req: Request;
}

export { RequestContextModel } from "./request-context.model";
export { RequestContextModule } from "./request-context.module";
