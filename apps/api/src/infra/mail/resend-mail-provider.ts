import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'

import { MailProvider, type MailMessage } from '@/domain/application/providers/mail-provider'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class ResendMailProvider implements MailProvider {
  private readonly client: Resend | null
  private readonly defaultFrom: string

  constructor(private readonly env: EnvService) {
    const apiKey = env.get('RESEND_API_KEY')
    this.client = env.get('RESEND_ENABLED') && apiKey ? new Resend(apiKey) : null
    this.defaultFrom = env.get('MAIL_FROM')
  }

  async send(message: MailMessage): Promise<void> {
    const to = Array.isArray(message.to) ? message.to : [message.to]
    const subject = message.subject

    if (!this.client) {
      // eslint-disable-next-line no-console -- modo simulação: registra o "envio" sem segredo
      console.log('[mail:simulado]', { to, subject })
      return
    }

    const { error } = await this.client.emails.send({
      from: message.from ?? this.defaultFrom,
      to,
      subject,
      html: message.html ?? '',
      text: message.text,
      replyTo: message.replyTo,
      tags: message.tag ? [{ name: 'tag', value: message.tag }] : undefined,
    })

    if (error) {
      throw new Error(`Resend falhou ao enviar email: ${error.message}`)
    }
  }
}
