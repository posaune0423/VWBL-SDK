import { FileReader as FileReaderNodeJs } from "@tanker/file-reader";
import mime from 'mime';
import { FileOrPath } from "../vwbl/types";
const isRunningOnBrowser = typeof window !== "undefined";

export const toBase64FromBlob = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = switchReader(blob);
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const result = reader.result;
      if (!result || typeof result !== "string") {
        reject("cannot convert to base64 string");
      } else {
        resolve(result);
      }
    };
    reader.onerror = (error: any) => reject(error);
  });
};

export const getMimeType =  (file: FileOrPath): string=> {
  return file instanceof File ? file.type :mime.getType(file) || "";
};

export const toArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = switchReader(blob);
    reader.readAsArrayBuffer(blob);
    reader.onload = () => {
      const result = reader.result;
      if (!result || !(result instanceof Uint8Array)) {
        reject("cannot convert to ArrayBuffer");
      } else {
        resolve(result);
      }
    };
    reader.onerror = (error: any) => reject(error);
  });
};

const switchReader = (blob: Blob): any => {
  if (isRunningOnBrowser) {
    return new window.FileReader();
  } else {
    console.log(blob)
    return new FileReaderNodeJs(blob);
  }
};
