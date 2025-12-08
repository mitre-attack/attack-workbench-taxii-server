export enum SupportedMediaTypes {
  Application = "application",
}

export enum SupportedMediaSubTypes {
  TaxiiJson = "taxii+json",
}

export enum SupportedMediaVersion {
  V21 = "2.1",
  LATEST = "2.1",
}

export const DEFAULT_CONTENT_TYPE =
  `${SupportedMediaTypes.Application}/${SupportedMediaSubTypes.TaxiiJson};version=${SupportedMediaVersion.LATEST}` as const;
