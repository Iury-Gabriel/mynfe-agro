export interface WelcomeMailInput {
  to: string
  name: string
}

export interface PasswordResetMailInput {
  to: string
  name: string
  resetUrl: string
  expiresInMinutes: number
}

export abstract class TransactionalMailProvider {
  abstract sendWelcome(input: WelcomeMailInput): Promise<void>
  abstract sendPasswordReset(input: PasswordResetMailInput): Promise<void>
}
