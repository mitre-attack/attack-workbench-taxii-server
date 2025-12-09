export class StixBundleInterface {
  type: string;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects?: { [key: string]: any }[];
}
