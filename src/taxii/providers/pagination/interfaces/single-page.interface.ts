export class SinglePageInterface<T> {
  readonly id: string;
  readonly more: boolean;
  readonly next: string;
  readonly objects: T[];
}
