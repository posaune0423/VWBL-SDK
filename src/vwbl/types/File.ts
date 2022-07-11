import { EncryptLogic } from "./EncryptLogic";

type UploadEncryptedFile = (
  fileName: string,
  encryptedContent: string | ArrayBuffer,
  uuid: string,
)=> Promise<string>

type UploadThumbnail = (
  thumbnailImage: File,
  uuid: string,
) => Promise<string>

type UploadMetadata = (
  tokenId: number,
  name: string,
  description: string,
  previewImageUrl: string,
  encryptedDataUrl: string,
  mimeType: string,
  encryptLogic: EncryptLogic,
) => Promise<void>;

export {  UploadMetadata, UploadEncryptedFile, UploadThumbnail };
