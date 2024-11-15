import { Bond, Offer, ViewDataReturnType } from "@itheum/sdk-mx-data-nft/out";

export interface ContractsType {
  itheumToken: string;
}

export type AddressBoughtOffer = {
  id: number;
  address: string;
  offerId: number;
  quantity: number;
};

export interface ExtendedOffer extends Offer, Partial<Bond> {}

export enum BlobDataType {
  TEXT,
  IMAGE,
  AUDIO,
  SVG,
  PDF,
  VIDEO,
}

export interface ExtendedViewDataReturnType extends ViewDataReturnType {
  blobDataType: BlobDataType;
}

export interface NftMedia {
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  fileType: string;
  fileSize: number;
}
