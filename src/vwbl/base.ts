import AWS from "aws-sdk";
import * as Stream from "stream";
import Web3 from "web3";

import { AWSConfig } from "../storage/aws/types";
import { UploadToIPFS } from "../storage/ipfs/upload";
import {
  createRandomKey,
  decryptFile,
  decryptStream,
  encryptFile,
  encryptStream,
  encryptString,
} from "../util/cryptoHelper";
import { toBase64FromBlob } from "../util/fileHelper";
import { VWBLApi } from "./api";
import { signToProtocol } from "./blockchain";
import { ManageKeyType, UploadContentType, UploadMetadataType } from "./types";

export type ConstructorProps = {
  web3: Web3;
  contractAddress: string;
  vwblNetworkUrl: string;
  manageKeyType?: ManageKeyType;
  uploadContentType?: UploadContentType;
  uploadMetadataType?: UploadMetadataType;
  awsConfig?: AWSConfig;
  ipfsNftStorageKey?: string;
};

export type VWBLOption = ConstructorProps;

export class VWBLBase {
  public opts: VWBLOption;
  protected api: VWBLApi;
  public signature?: string;
  protected uploadToIpfs?: UploadToIPFS;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(props: ConstructorProps) {
    const { uploadContentType, uploadMetadataType, awsConfig, vwblNetworkUrl, ipfsNftStorageKey } = props;
    this.opts = props;
    this.api = new VWBLApi(vwblNetworkUrl);
    if (uploadContentType === UploadContentType.S3 || uploadMetadataType === UploadMetadataType.S3) {
      if (!awsConfig) {
        throw new Error("please specify S3 bucket.");
      }
      AWS.config.update({
        region: awsConfig.region,
        credentials: new AWS.CognitoIdentityCredentials({
          IdentityPoolId: awsConfig.idPoolId,
        }),
      });
    } else if (uploadContentType === UploadContentType.IPFS || uploadMetadataType === UploadMetadataType.IPFS) {
      if (!ipfsNftStorageKey) {
        throw new Error("please specify nftstorage config of IPFS.");
      }
      this.uploadToIpfs = new UploadToIPFS(ipfsNftStorageKey);
    }
  }

  /**
   * Sign to VWBL
   *
   * @remarks
   * You need to call this method before you send a transaction（eg. mint NFT）
   */
  sign = async () => {
    this.signature = await signToProtocol(this.opts.web3);
    console.log("signed");
  };

  /**
   * Create a key used for encryption and decryption
   *
   * @returns Random string generated by uuid
   */
  createKey = (): string => {
    return createRandomKey();
  };

  /**
   * Set key to VWBL Network
   *
   * @param documentId - DocumentId
   * @param key - The key generated by {@link VWBL.createKey}
   * @param hasNonce
   * @param autoMigration
   *
   */
  protected _setKey = async (
    documentId: string,
    key: string,
    hasNonce?: boolean,
    autoMigration?: boolean
  ): Promise<void> => {
    if (!this.signature) {
      throw "please sign first";
    }

    const chainId = await this.opts.web3.eth.getChainId();
    await this.api.setKey(documentId, chainId, key, this.signature);
  };

  /**
   * Encode `plainData` to Base64 and encrypt it
   *
   * @param plainData - The data that only NFT owner can view
   * @param key - The key generated by {@link VWBL.createKey}
   * @returns Encrypted file data
   */
  encryptDataViaBase64 = async (plainData: File, key: string): Promise<string> => {
    const content = await toBase64FromBlob(plainData);
    return encryptString(content, key);
  };

  /**
   * Encrypt `plainData`
   *
   * @param plainFile - The data that only NFT owner can view
   * @param key - The key generated by {@link VWBL.createKey}
   * @returns Encrypted file data
   */
  encryptFile = async (plainFile: File, key: string): Promise<ArrayBuffer> => {
    return encryptFile(plainFile, key);
  };

  /**
   * Decrypt `encryptFile`
   *
   * @param encryptFile - The data that only NFT owner can view
   * @param key - The key generated by {@link VWBL.createKey}
   * @returns Encrypted file data
   */
  decryptFile = async (encryptFile: ArrayBuffer, key: string): Promise<ArrayBuffer> => {
    return decryptFile(encryptFile, key);
  };

  /**
   * Encrypt `plainData`
   *
   * @param plainFile - The data that only NFT owner can view
   * @param key - The key generated by {@link VWBL.createKey}
   * @returns Encrypted file data
   */
  encryptStream = (plainFile: Stream, key: string): Stream => {
    return encryptStream(plainFile, key);
  };

  /**
   * Decrypt `encryptFile`
   *
   * @param encryptFile - The data that only NFT owner can view
   * @param key - The key generated by {@link VWBL.createKey}
   * @returns Encrypted file data
   */
  decryptStream = (encryptFile: Stream, key: string): Stream => {
    return decryptStream(encryptFile, key);
  };
}
