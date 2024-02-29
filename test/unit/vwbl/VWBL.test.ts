import { expect } from 'chai'
import * as dotenv from 'dotenv'
import sinon from 'sinon'
import {
  ManageKeyType,
  UploadContentType,
  UploadMetadataType,
  VWBL,
  VWBLApi,
  VWBLNFT,
} from '../../../src/vwbl'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { polygonMumbai } from 'viem/chains'
dotenv.config()

const vwblApiStub = {
  setKey: sinon.stub(VWBLApi.prototype, 'setKey'),
}

// preparation for Viem
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' //Hardhat Network Account(https://hardhat.org/hardhat-network/docs/overview). No problem to disclose.
const account = privateKeyToAccount(privateKey)
const signer = createWalletClient({
  account,
  chain: polygonMumbai,
  transport: http(),
})
sinon.stub(signer, 'signMessage').returns(Promise.resolve('0x1111111111111111111'))

describe('VWBL with viem', () => {
  const vwblProtocolStub = {
    mintToken: sinon.stub(VWBLNFT.prototype, 'mintToken'),
  }

  const vwbl = new VWBL({
    ipfsNftStorageKey: 'set nftstorage api key',
    awsConfig: undefined,
    contractAddress: '0x2c7e967093d7fe0eeb5440bf49e5D148417B0412',
    manageKeyType: ManageKeyType.VWBL_NETWORK_SERVER,
    uploadContentType: UploadContentType.CUSTOM,
    uploadMetadataType: UploadMetadataType.CUSTOM,
    vwblNetworkUrl: 'http://example.com',
    signer,
  })

  const testFunctions = {
    uploadEncryptedFile: () => {
      return Promise.resolve('https://example.com')
    },
    uploadThumbnail: () => {
      return Promise.resolve('https://example.com')
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    uploadMetadata: async () => {},
  }
  const uploadEncryptedFileStub = sinon
    .stub(testFunctions, 'uploadEncryptedFile')
    .returns(Promise.resolve('https://example.com'))
  const uploadFileStub = sinon
    .stub(testFunctions, 'uploadThumbnail')
    .returns(Promise.resolve('https://example.com'))
  const uploadMetadataStub = sinon.stub(testFunctions, 'uploadMetadata')

  beforeAll(async () => {
    await vwbl.sign()
  })

  it('mint token without gas settings', async () => {
    vwblProtocolStub.mintToken.returns(Promise.resolve(1))
    const tokenId = await vwbl.managedCreateToken(
      'test token',
      'test',
      'test/asset/thumbnail.png',
      'test/asset/plain.png',
      10,
      'base64',
      testFunctions.uploadEncryptedFile,
      testFunctions.uploadThumbnail,
      testFunctions.uploadMetadata,
    )

    expect(vwblProtocolStub.mintToken.callCount).equal(1)
    expect(vwblProtocolStub.mintToken.getCall(0).args[3]).equal(undefined)
    expect(vwblApiStub.setKey.callCount).equal(1)
    expect(uploadEncryptedFileStub.callCount).equal(1)
    expect(uploadFileStub.callCount).equal(1)
    expect(uploadMetadataStub.callCount).equal(1)
    expect(tokenId).equal(1)
  })

  it('mint token with maxPriorityFee and maxFee', async () => {
    vwblProtocolStub.mintToken.returns(Promise.resolve(2))
    const testSubscriber = {
      kickStep: () => {},
    }
    const tokenId = await vwbl.managedCreateToken(
      'test token',
      'test',
      'test/asset/thumbnail.png',
      'test/asset/plain.png',
      10,
      'base64',
      testFunctions.uploadEncryptedFile,
      testFunctions.uploadThumbnail,
      testFunctions.uploadMetadata,
      testSubscriber,
      { maxPriorityFeePerGas: 40000000000, maxFeePerGas: 41000000000 },
    )

    expect(vwblProtocolStub.mintToken.callCount).equal(2)
    expect(vwblProtocolStub.mintToken.getCall(1).args[3]).deep.equal({
      maxPriorityFeePerGas: 40000000000,
      maxFeePerGas: 41000000000,
    })
    expect(vwblApiStub.setKey.callCount).equal(2)
    expect(uploadEncryptedFileStub.callCount).equal(2)
    expect(uploadFileStub.callCount).equal(2)
    expect(uploadMetadataStub.callCount).equal(2)
    expect(tokenId).equal(2)
  })

  it('mint token with gasPrice', async () => {
    vwblProtocolStub.mintToken.returns(Promise.resolve(3))
    const testSubscriber = {
      kickStep: () => {},
    }
    const tokenId = await vwbl.managedCreateToken(
      'test token',
      'test',
      'test/asset/thumbnail.png',
      'test/asset/plain.png',
      10,
      'base64',
      testFunctions.uploadEncryptedFile,
      testFunctions.uploadThumbnail,
      testFunctions.uploadMetadata,
      testSubscriber,
      { gasPrice: 1000 },
    )

    expect(vwblProtocolStub.mintToken.callCount).equal(3)
    expect(vwblProtocolStub.mintToken.getCall(2).args[3]).deep.equal({ gasPrice: 1000 })
    expect(vwblApiStub.setKey.callCount).equal(3)
    expect(uploadEncryptedFileStub.callCount).equal(3)
    expect(uploadFileStub.callCount).equal(3)
    expect(uploadMetadataStub.callCount).equal(3)
    expect(tokenId).equal(3)
  })
})
