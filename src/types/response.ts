export type TokenResponse = {
  token: string
  expires: Date
}

export type AuthTokensResponse = {
  access: TokenResponse
  refresh?: TokenResponse
}
