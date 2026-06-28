import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EnvService } from '@/infra/env/env.service'

const sendMock = vi.fn()
const resendCtor = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
    constructor(apiKey: string) {
      resendCtor(apiKey)
    }
  },
}))

const { ResendMailProvider } = await import('./resend-mail-provider')

function makeEnv(overrides: Record<string, unknown> = {}): EnvService {
  const values: Record<string, unknown> = {
    RESEND_ENABLED: false,
    RESEND_API_KEY: undefined,
    MAIL_FROM: 'AgroFlow <no-reply@example.com>',
    ...overrides,
  }
  return { get: (key: string) => values[key] } as unknown as EnvService
}

describe('ResendMailProvider', () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    resendCtor.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('simula o envio quando não há API key (loga [mail:simulado] e não chama a SDK)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const sut = new ResendMailProvider(makeEnv())

    await sut.send({ to: 'dest@example.com', subject: 'Oi', html: '<p>oi</p>' })

    expect(resendCtor).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('[mail:simulado]', {
      to: ['dest@example.com'],
      subject: 'Oi',
    })
  })

  it('simula quando RESEND_ENABLED=true mas sem API key', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const sut = new ResendMailProvider(makeEnv({ RESEND_ENABLED: true }))

    await sut.send({ to: ['a@x.com', 'b@x.com'], subject: 'Multi', html: '<p>x</p>' })

    expect(sendMock).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('[mail:simulado]', {
      to: ['a@x.com', 'b@x.com'],
      subject: 'Multi',
    })
  })

  it('nunca loga a API key no modo simulado', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const sut = new ResendMailProvider(makeEnv({ RESEND_API_KEY: 're_secret_key' }))

    await sut.send({ to: 'dest@example.com', subject: 'Oi', html: '<p>oi</p>' })

    const logged = logSpy.mock.calls.flat().map((c) => JSON.stringify(c)).join(' ')
    expect(logged).not.toContain('re_secret_key')
  })

  it('envia via SDK quando habilitado e com key, usando MAIL_FROM como remetente padrão', async () => {
    const sut = new ResendMailProvider(
      makeEnv({ RESEND_ENABLED: true, RESEND_API_KEY: 're_real_key' }),
    )

    await sut.send({
      to: 'dest@example.com',
      subject: 'Bem-vindo',
      html: '<p>oi</p>',
      tag: 'welcome',
    })

    expect(resendCtor).toHaveBeenCalledWith('re_real_key')
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'AgroFlow <no-reply@example.com>',
        to: ['dest@example.com'],
        subject: 'Bem-vindo',
        html: '<p>oi</p>',
        tags: [{ name: 'tag', value: 'welcome' }],
      }),
    )
  })

  it('usa o from da mensagem quando informado e omite tags sem tag', async () => {
    const sut = new ResendMailProvider(
      makeEnv({ RESEND_ENABLED: true, RESEND_API_KEY: 're_real_key' }),
    )

    await sut.send({ to: 'dest@example.com', subject: 'Oi', from: 'custom@example.com' })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'custom@example.com', html: '', tags: undefined }),
    )
  })

  it('lança erro genérico (sem vazar key) quando a SDK retorna error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'invalid recipient' } })
    const sut = new ResendMailProvider(
      makeEnv({ RESEND_ENABLED: true, RESEND_API_KEY: 're_real_key' }),
    )

    await expect(
      sut.send({ to: 'dest@example.com', subject: 'Oi', html: '<p>x</p>' }),
    ).rejects.toThrow('Resend falhou ao enviar email: invalid recipient')
  })
})
