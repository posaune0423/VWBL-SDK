import { WalletClient } from 'viem'

export const signToProtocol = async (signer: WalletClient, signMessage: string) => {
  if (!signer.account) throw new Error('Account is not defined')
  return await signer.signMessage({ account: signer.account, message: signMessage })
}
