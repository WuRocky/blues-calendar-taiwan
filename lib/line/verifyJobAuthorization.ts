export interface VerifyJobAuthorizationParams {
  authorization: string | undefined
  lineJobSecret: string
}

export function verifyJobAuthorization({
  authorization,
  lineJobSecret
}: VerifyJobAuthorizationParams) {
  if (!authorization || !lineJobSecret) {
    return false
  }

  return authorization === `Bearer ${lineJobSecret}`
}
