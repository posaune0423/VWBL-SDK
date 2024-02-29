/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type PublicClient,
  type TransactionReceipt,
  type WalletClient,
  createPublicClient,
  decodeEventLog,
  http,
} from 'viem'
import { mainnet } from 'viem/chains'
import vwblABI from '../../../contract/VWBLERC721ERC2981'
import vwblIPFSABI from '../../../contract/VWBLERC721ERC2981ForMetadata'
import { getFeeSettingsBasedOnEnvironment } from '../../../util/transactionHelper'
import { type GasSettings } from '../../types'

export class VWBLNFT {
  private signer: WalletClient
  private client: PublicClient
  private contractAddress: `0x${string}`

  constructor(address: `0x${string}`, isIpfs: boolean, walletClient: WalletClient) {
    this.contractAddress = address
    this.signer = walletClient
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(),
    })
  }

  async mintToken(
    decryptUrl: string,
    feeNumerator: number,
    documentId: string,
    gasSettings?: GasSettings,
  ) {
    const fee = await this.getFee()
    let txSettings: GasSettings
    if (gasSettings?.gasPrice) {
      txSettings = {
        gasPrice: gasSettings?.gasPrice,
      }
    } else {
      const { maxPriorityFeePerGas: _maxPriorityFeePerGas, maxFeePerGas: _maxFeePerGas } =
        getFeeSettingsBasedOnEnvironment(
          gasSettings?.maxPriorityFeePerGas,
          gasSettings?.maxFeePerGas,
        )
      txSettings = {
        maxPriorityFeePerGas: _maxPriorityFeePerGas,
        maxFeePerGas: _maxFeePerGas,
      }
    }
    console.log('transaction start')
    const hash = await this.signer.writeContract({
      chain: this.signer.chain,
      address: this.contractAddress,
      abi: vwblABI,
      functionName: 'mint',
      account: this.signer.account!.address,
      args: [decryptUrl, BigInt(feeNumerator), documentId as `0x${string}`],
      value: fee,
    })
    const receipt = await this.client.waitForTransactionReceipt({ hash })

    console.log('transaction end')
    const tokenId = parseToTokenId(receipt)
    return tokenId
  }

  async mintTokenForIPFS(
    metadataUrl: string,
    decryptUrl: string,
    feeNumerator: number,
    documentId: string,
    gasSettings?: GasSettings,
  ) {
    const fee = await this.getFee()
    let txSettings: GasSettings
    if (gasSettings?.gasPrice) {
      txSettings = {
        gasPrice: gasSettings?.gasPrice,
      }
    } else {
      const { maxPriorityFeePerGas: _maxPriorityFeePerGas, maxFeePerGas: _maxFeePerGas } =
        getFeeSettingsBasedOnEnvironment(
          gasSettings?.maxPriorityFeePerGas,
          gasSettings?.maxFeePerGas,
        )
      txSettings = {
        maxPriorityFeePerGas: _maxPriorityFeePerGas,
        maxFeePerGas: _maxFeePerGas,
      }
    }
    console.log('transaction start')
    const hash = await this.signer.writeContract({
      chain: this.signer.chain,
      address: this.contractAddress,
      abi: vwblIPFSABI,
      functionName: 'mint',
      account: this.signer.account!.address,
      args: [metadataUrl, decryptUrl, BigInt(feeNumerator), documentId as `0x${string}`],
      value: fee,
    })
    const receipt = await this.client.waitForTransactionReceipt({ hash })

    console.log('transaction end')
    const tokenId = parseToTokenId(receipt)
    return tokenId
  }

  async getOwnTokenIds() {
    const myAddress = this.signer.account!.address
    const balance = await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'balanceOf',
      args: [myAddress],
    })
    return await Promise.all(
      range(Number(balance)).map(async (i) => {
        const ownTokenId = await this.client.readContract({
          abi: vwblABI,
          address: this.contractAddress,
          functionName: 'tokenOfOwnerByIndex',
          args: [myAddress, BigInt(i)],
        })
        return Number(ownTokenId)
      }),
    )
  }

  async getTokenByMinter(address: `0x${string}`) {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'getTokenByMinter',
      args: [address],
    })
  }

  async getMetadataUrl(tokenId: number) {
    return await this.client.readContract({
      abi: vwblIPFSABI,
      address: this.contractAddress,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })
  }

  async getOwner(tokenId: number) {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    })
  }

  async getMinter(tokenId: number) {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'getMinter',
      args: [BigInt(tokenId)],
    })
  }

  async isOwnerOf(tokenId: number) {
    const myAddress = this.signer.account!.address
    const owner = await this.getOwner(tokenId)
    return myAddress === owner
  }

  async isMinterOf(tokenId: number) {
    const myAddress = this.signer.account!.address
    const minter = await this.getMinter(tokenId)
    return myAddress === minter
  }

  async getFee() {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'getFee',
    })
  }

  async getTokenInfo(tokenId: number) {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'tokenIdToTokenInfo',
      args: [BigInt(tokenId)],
    })
  }

  async approve(
    operator: `0x${string}`,
    tokenId: number,
    gasSettings?: GasSettings,
  ): Promise<void> {
    let txSettings: GasSettings
    if (gasSettings?.gasPrice) {
      txSettings = {
        gasPrice: gasSettings.gasPrice,
      }
    } else {
      const { maxPriorityFeePerGas: _maxPriorityFeePerGas, maxFeePerGas: _maxFeePerGas } =
        getFeeSettingsBasedOnEnvironment(
          gasSettings?.maxPriorityFeePerGas,
          gasSettings?.maxFeePerGas,
        )
      txSettings = {
        maxPriorityFeePerGas: _maxPriorityFeePerGas,
        maxFeePerGas: _maxFeePerGas,
      }
    }
    const hash = await this.signer.writeContract({
      chain: this.signer.chain,
      address: this.contractAddress,
      abi: vwblABI,
      functionName: 'approve',
      account: this.signer.account!.address,
      args: [operator, BigInt(tokenId)],
      value: undefined,
    })
    await this.client.waitForTransactionReceipt({ hash })
  }

  async getApproved(tokenId: number): Promise<string> {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'getApproved',
      args: [BigInt(tokenId)],
    })
  }

  async setApprovalForAll(operator: `0x${string}`, gasSettings?: GasSettings): Promise<void> {
    let txSettings: GasSettings
    if (gasSettings?.gasPrice) {
      txSettings = {
        gasPrice: gasSettings?.gasPrice,
      }
    } else {
      const { maxPriorityFeePerGas: _maxPriorityFeePerGas, maxFeePerGas: _maxFeePerGas } =
        getFeeSettingsBasedOnEnvironment(
          gasSettings?.maxPriorityFeePerGas,
          gasSettings?.maxFeePerGas,
        )
      txSettings = {
        maxPriorityFeePerGas: _maxPriorityFeePerGas,
        maxFeePerGas: _maxFeePerGas,
      }
    }
    const hash = await this.signer.writeContract({
      chain: this.signer.chain,
      address: this.contractAddress,
      abi: vwblABI,
      functionName: 'setApprovalForAll',
      account: this.signer.account!.address,
      args: [operator, true],
      value: undefined,
    })
    await this.client.waitForTransactionReceipt({ hash })
  }

  async isApprovedForAll(owner: `0x${string}`, operator: `0x${string}`): Promise<boolean> {
    return await this.client.readContract({
      abi: vwblABI,
      address: this.contractAddress,
      functionName: 'isApprovedForAll',
      args: [owner, operator],
    })
  }

  async safeTransfer(to: `0x${string}`, tokenId: number, gasSettings?: GasSettings): Promise<void> {
    const myAddress = this.signer.account!.address
    let txSettings: GasSettings
    if (gasSettings?.gasPrice) {
      txSettings = {
        gasPrice: gasSettings?.gasPrice,
      }
    } else {
      const { maxPriorityFeePerGas: _maxPriorityFeePerGas, maxFeePerGas: _maxFeePerGas } =
        getFeeSettingsBasedOnEnvironment(
          gasSettings?.maxPriorityFeePerGas,
          gasSettings?.maxFeePerGas,
        )
      txSettings = {
        maxPriorityFeePerGas: _maxPriorityFeePerGas,
        maxFeePerGas: _maxFeePerGas,
      }
    }
    const hash = await this.signer.writeContract({
      chain: this.signer.chain,
      address: this.contractAddress,
      abi: vwblABI,
      functionName: 'safeTransferFrom',
      account: this.signer.account!.address,
      args: [myAddress, to, BigInt(tokenId)],
      value: undefined,
    })
    await this.client.waitForTransactionReceipt({ hash })
  }
}

const range = (length: number) => {
  return Array.from(Array(length).keys())
}

const parseToTokenId = (receipt: TransactionReceipt): number => {
  let tokenId = 0
  receipt.logs.forEach((log) => {
    // check whether topic is nftDataRegistered(address contractAddress, uint256 tokenId)
    if (log.topics[0] === '0x957e0e652e4d598197f2c5b25940237e404f3899238efb6f64df2377e9aaf36c') {
      const event = decodeEventLog({ abi: vwblABI, topics: log.topics, data: log.data })
      if ('tokenId' in event.args) {
        tokenId = Number(event.args.tokenId)
      }
    }
  })
  return tokenId
}
