export class VWBLApi {
  private baseUrl: string
  constructor(endpointUrl: string) {
    this.baseUrl = endpointUrl
  }

  async setKey(
    documentId: string,
    chainId: number,
    key: string,
    signature: string,
    address?: string,
    hasNonce?: boolean,
    autoMigration?: boolean,
  ) {
    const res = await fetch(`${this.baseUrl}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        chain_id: chainId,
        key,
        signature,
        address,
        has_nonce: hasNonce,
        auto_migration: autoMigration,
      }),
    })

    const data = await res.json()
    return data
  }

  async getKey(
    documentId: string,
    chainId: number,
    signature: string,
    address?: string,
  ): Promise<string> {
    const res = await fetch(
      `${this.baseUrl}/keys/${documentId}/${chainId}?signature=${signature}&address=${address}`,
    )
    const data = await res.json()
    return data.documentKey.key
  }

  async getSignMessage(
    contractAddress: string,
    chainId: number,
    address?: string,
  ): Promise<string> {
    const res = await fetch(
      `${this.baseUrl}/signature/${contractAddress}/${chainId}?address=${address}`,
    )
    const data = await res.json()
    return data.signMessage
  }
}
