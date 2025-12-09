import { AsyncLocalStorage } from 'async_hooks';

export abstract class RequestContextModel {
  static als = new AsyncLocalStorage<RequestContextModel>();

  static start = <T extends RequestContextModel>(constructor: new () => T): void => {
    RequestContextModel.als.enterWith(new constructor());
  };

  static get<T extends RequestContextModel>(): T {
    return RequestContextModel.als.getStore() as T;
  }
}
