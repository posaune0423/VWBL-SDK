import AWS from "aws-sdk";
import { ethers } from "ethers";
import * as Stream from "stream";
import Web3 from "web3";

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
import { BaseConstructorProps, UploadContentType, UploadMetadataType } from "./types";

const MESSAGE_TO_BE_SIGNED = "Hello VWBL";

export class VWBLBase {
  protected api: VWBLApi;
  public signMsg?: string;
  public signature?: string;
  protected uploadToIpfs?: UploadToIPFS;
  public contractAddress: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(props: BaseConstructorProps) {
    const { contractAddress, uploadContentType, uploadMetadataType, awsConfig, vwblNetworkUrl, ipfsNftStorageKey } =
      props;
    this.contractAddress = contractAddress;
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
   * You need to call this method before you send a transaction（eg. mint NFT, decrypt NFT data）
   */
  protected _sign = async (signer: Web3 | ethers.providers.JsonRpcSigner | ethers.Wallet, targetContract?: string) => {
    //TODO: signerがWeb3 instanceかどうかを判断するロジックを切り出さないといけない signer instanceof Web3では意図した通り動かなかったため
    const castedSigner = signer as any;
    // eslint-disable-next-line
    const chainId = castedSigner.hasOwnProperty("eth")
      ? await castedSigner.eth.getChainId()
      : await castedSigner.getChainId();
    const address = await this._getAddressBySigner(signer);
    const contractAddress = targetContract || this.contractAddress;
    const signatureString = await this.api
      .getSignatureString(contractAddress, chainId, address)
      .catch(() => MESSAGE_TO_BE_SIGNED);
    if (this.signMsg === signatureString) return;
    this.signMsg = signatureString;
    this.signature = await signToProtocol(signer, signatureString);
    console.log("signed");
  };

  protected _getAddressBySigner = async (
    signer: Web3 | ethers.providers.JsonRpcSigner | ethers.Wallet
  ): Promise<string> => {
    //TODO: signerがWeb3 instanceかどうかを判断するロジックを切り出さないといけない signer instanceof Web3では意図した通り動かなかったため
    const castedSigner = signer as any;
    // eslint-disable-next-line
    return castedSigner.hasOwnProperty("eth")
      ? (await castedSigner.eth.getAccounts())[0]
      : await castedSigner.getAddress();
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
   * @param chainId - The indentifier of blockchain
   * @param key - The key generated by {@link VWBL.createKey}
   * @param address address
   * @param hasNonce
   * @param autoMigration
   *
   */
  protected _setKey = async (
    documentId: string,
    chainId: number,
    key: string,
    address?: string,
    hasNonce?: boolean,
    autoMigration?: boolean
  ): Promise<void> => {
    if (!this.signature) {
      throw "please sign first";
    }

    await this.api.setKey(documentId, chainId, key, this.signature, address);
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
