import { AWSConfig } from '../../storage/aws/types'
import { BiconomyConfig } from './BiconomyConfigType'
import { ManageKeyType } from './ManageKeyType'
import { UploadContentType } from './UploadContentType'
import { UploadMetadataType } from './UploadMetadataType'
import { WalletClient } from 'viem'

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
