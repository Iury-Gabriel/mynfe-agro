import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TransactionalMailService } from './transactional-mail.service'

import type { MailMessage, MailProvider } from '@/domain/application/providers/mail-provider'
import type { EnvService } from '@/infra/env/env.service'

function makeMail() {
  const send = vi.fn<(message: MailMessage) => Promise<void>>().mockResolvedValue(undefined)
  return { send } as unknown as MailProvider & { send: typeof send }
}

function makeEnv(): EnvService {
  return { get: () => 'https://app.example.com' } as unknown as EnvService
}

describe(TransactionalMailService.name, () => {
  let mail: ReturnType<typeof makeMail>
  let sut: TransactionalMailService

  beforeEach(() => {
    mail = makeMail()
    sut = new TransactionalMailService(mail, makeEnv())
  })

  it('renderiza e envia o email de boas-vindas com o loginUrl do AUTH_BASE_URL', async () => {
    await sut.sendWelcome({ to: 'ada@example.com', name: 'Ada' })

    expect(mail.send).toHaveBeenCalledOnce()
    const msg = mail.send.mock.calls[0][0]
    expect(msg.to).toBe('ada@example.com')
    expect(msg.subject).toContain('Bem-vindo')
    expect(msg.tag).toBe('welcome')
    expect(msg.html).toContain('Ada')
    expect(msg.html).toContain('https://app.example.com')
  })

  it('renderiza e envia o email de reset de senha com o resetUrl e expiração', async () => {
    await sut.sendPasswordReset({
      to: 'ada@example.com',
      name: 'Ada',
      resetUrl: 'https://app.example.com/reset?token=abc',
      expiresInMinutes: 60,
    })

    expect(mail.send).toHaveBeenCalledOnce()
    const msg = mail.send.mock.calls[0][0]
    expect(msg.subject).toContain('Redefinição de senha')
    expect(msg.tag).toBe('reset-password')
    expect(msg.html).toContain('https://app.example.com/reset?token=abc')
    expect(msg.html).toContain('60')
  })
})
