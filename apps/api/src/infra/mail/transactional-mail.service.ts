import { Injectable } from '@nestjs/common'
import { createElement } from 'react'

import type {
  PasswordResetMailInput,
  WelcomeMailInput,
} from '@/domain/application/providers/transactional-mail-provider'

import { MailProvider } from '@/domain/application/providers/mail-provider'
import { TransactionalMailProvider } from '@/domain/application/providers/transactional-mail-provider'
import { EnvService } from '@/infra/env/env.service'
import { renderEmail } from '@/infra/mail/render-email'
import { ResetPasswordEmail, WelcomeEmail } from '@/infra/mail/templates'

@Injectable()
export class TransactionalMailService implements TransactionalMailProvider {
  constructor(
    private readonly mail: MailProvider,
    private readonly env: EnvService,
  ) {}

  async sendWelcome(input: WelcomeMailInput): Promise<void> {
    const html = await renderEmail(
      createElement(WelcomeEmail, { name: input.name, loginUrl: this.env.get('AUTH_BASE_URL') }),
    )

    await this.mail.send({
      to: input.to,
      subject: 'Bem-vindo ao AgroFlow',
      html,
      tag: 'welcome',
    })
  }

  async sendPasswordReset(input: PasswordResetMailInput): Promise<void> {
    const html = await renderEmail(
      createElement(ResetPasswordEmail, {
        name: input.name,
        resetUrl: input.resetUrl,
        expiresInMinutes: input.expiresInMinutes,
      }),
    )

    await this.mail.send({
      to: input.to,
      subject: 'Redefinição de senha',
      html,
      tag: 'reset-password',
    })
  }
}
