import { StixObjectPropertiesInterface } from "./stix-object-properties.interface";

export class StixBundleInterface {
  type: string;
  id: string;
  objects?: Array<StixObjectPropertiesInterface>;
}
