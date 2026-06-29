import type {
  PasswordResetMailInput,
  WelcomeMailInput,
} from '@/domain/application/providers/transactional-mail-provider'

import { TransactionalMailProvider } from '@/domain/application/providers/transactional-mail-provider'

export class FakeTransactionalMailProvider extends TransactionalMailProvider {
  welcomeCalls: WelcomeMailInput[] = []
  passwordResetCalls: PasswordResetMailInput[] = []
  shouldFailOnWelcome = false

  async sendWelcome(input: WelcomeMailInput): Promise<void> {
    if (this.shouldFailOnWelcome) {
      throw new Error('mail provider down')
    }
    this.welcomeCalls.push(input)
  }

  async sendPasswordReset(input: PasswordResetMailInput): Promise<void> {
    this.passwordResetCalls.push(input)
  }
}
