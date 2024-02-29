import { type WalletClient } from 'viem'
import { type AWSConfig } from '../../storage/aws/types'
import { type BiconomyConfig } from './BiconomyConfigType'
import { type ManageKeyType } from './ManageKeyType'
import { type UploadContentType } from './UploadContentType'
import { type UploadMetadataType } from './UploadMetadataType'

export type BaseConstructorProps = {
  contractAddress: `0x${string}`
  vwblNetworkUrl: string
  uploadContentType?: UploadContentType
  uploadMetadataType?: UploadMetadataType
  awsConfig?: AWSConfig
  ipfsNftStorageKey?: string
}

export type ConstructorProps = BaseConstructorProps & {
  signer: WalletClient
  manageKeyType?: ManageKeyType
  dataCollectorAddress?: string
}

export type VWBLOption = ConstructorProps

export type MetaTxConstructorProps = BaseConstructorProps & {
  bcProvider: WalletClient
  biconomyConfig: BiconomyConfig
  manageKeyType?: ManageKeyType
  dataCollectorAddress?: string
}

export type VWBLMetaTxOption = MetaTxConstructorProps

export type ViewerConstructorProps = {
  dataCollectorAddress: string
}

export type ViewerOption = ViewerConstructorProps
