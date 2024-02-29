import {
  toHex,
  parseAbiParameters,
  encodeAbiParameters,
  keccak256,
  pad,
  toFunctionSelector,
} from 'viem'

const biconomyForwarderDomainData = {
  name: 'Biconomy Forwarder',
  version: '1',
  verifyingContract: '',
  salt: '',
}

const domainType = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
]
const forwardRequestType = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'token', type: 'address' },
  { name: 'txGas', type: 'uint256' },
  { name: 'tokenGasPrice', type: 'uint256' },
  { name: 'batchId', type: 'uint256' },
  { name: 'batchNonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
  { name: 'data', type: 'bytes' },
]

export interface TxParam {
  from: string
  to: string
  token: string
  txGas: number
  tokenGasPrice: string
  batchId: number
  batchNonce: number
  deadline: number
  data: string
}

export const buildForwardTxRequest = (
  account: string,
  toAddress: string,
  gasLimitNum: number,
  batchNonce: string,
  data: string,
) => {
  const req: TxParam = {
    from: account,
    to: toAddress,
    token: '0x0000000000000000000000000000000000000000',
    txGas: gasLimitNum,
    tokenGasPrice: '0',
    batchId: parseInt('0'),
    batchNonce: parseInt(batchNonce),
    deadline: Math.floor(Date.now() / 1000 + 3600),
    data,
  }
  return req
}

export const getDataToSignForEIP712 = (
  request: TxParam,
  forwarderAddress: `0x${string}`,
  chainId: number,
) => {
  const domainData = biconomyForwarderDomainData
  domainData.verifyingContract = forwarderAddress
  domainData.salt = pad(toHex(chainId), { size: 32 })
  const dataToSign = JSON.stringify({
    types: {
      EIP712Domain: domainType,
      ERC20ForwardRequest: forwardRequestType,
    },
    domain: domainData,
    primaryType: 'ERC20ForwardRequest',
    message: request,
  })
  return dataToSign
}

export const getDomainSeparator = (forwarderAddress: `0x${string}`, chainId: number) => {
  const domainSeparator = keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, bytes32, bytes32, address, bytes32'), [
      toFunctionSelector(
        'function EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)',
      ),
      keccak256(toHex(biconomyForwarderDomainData.name)),
      keccak256(toHex(biconomyForwarderDomainData.version)),
      forwarderAddress,
      pad(toHex(chainId), { size: 32 }),
    ]),
  )

  return domainSeparator
}
