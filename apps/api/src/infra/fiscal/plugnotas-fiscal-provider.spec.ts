import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlugNotasFiscalProvider } from './plugnotas-fiscal-provider'

import type { FiscalEmitirInput } from '@/domain/application/ports/fiscal-provider'
import type { Env } from '@/infra/env/env'
import type { EnvService } from '@/infra/env/env.service'

function makeEnv(overrides: Partial<Env> = {}): EnvService {
  const values: Partial<Env> = {
    PLUGNOTAS_ENABLED: false,
    PLUGNOTAS_API_KEY: undefined,
    PLUGNOTAS_BASE_URL: 'https://api.sandbox.plugnotas.com.br',
    PLUGNOTAS_TIMEOUT_MS: 30000,
    ...overrides,
  }
  return {
    get<T extends keyof Env>(key: T): Env[T] {
      return values[key] as Env[T]
    },
  } as EnvService
}

function makeInput(overrides: Partial<FiscalEmitirInput> = {}): FiscalEmitirInput {
  return {
    notaFiscalId: 'nota-1',
    empresaEmitenteId: 'empresa-1',
    clienteId: 'cliente-1',
    numero: '1',
    serie: '1',
    modelo: '55',
    naturezaOperacao: 'Venda',
    valorTotal: 1000,
    ambiente: 'homologacao',
    itens: [
      {
        produtoId: 'produto-1',
        descricao: 'Soja',
        ncm: '12019000',
        cfop: '5101',
        cstCsosn: '102',
        quantidade: 100,
        valorUnitario: 10,
        valorTotal: 1000,
        impostos: {},
      },
    ],
    ...overrides,
  }
}

describe(PlugNotasFiscalProvider.name, () => {
  describe('modo simulação (homologação, sem credenciais)', () => {
    it('emite com status autorizada e chave de acesso de 44 dígitos', async () => {
      const sut = new PlugNotasFiscalProvider(makeEnv())

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('autorizada')
      expect(result.chaveAcesso).toHaveLength(44)
      expect(result.chaveAcesso).toMatch(/^\d{44}$/)
      expect(result.protocolo).toBeTruthy()
      expect(result.plugnotasId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
      expect(result.xmlUrl).toContain(result.chaveAcesso)
      expect(result.danfeUrl).toContain('.pdf')
    })

    it('gera a mesma chave de acesso para o mesmo seed (determinístico)', async () => {
      const sut = new PlugNotasFiscalProvider(makeEnv())

      const a = await sut.emitir(makeInput())
      const b = await sut.emitir(makeInput())

      expect(a.chaveAcesso).toBe(b.chaveAcesso)
    })

    it('gera chaves diferentes para números diferentes', async () => {
      const sut = new PlugNotasFiscalProvider(makeEnv())

      const a = await sut.emitir(makeInput({ numero: '1' }))
      const b = await sut.emitir(makeInput({ numero: '2' }))

      expect(a.chaveAcesso).not.toBe(b.chaveAcesso)
    })

    it('cancela retornando status cancelada', async () => {
      const sut = new PlugNotasFiscalProvider(makeEnv())

      const result = await sut.cancelar('plugnotas-1')

      expect(result.status).toBe('cancelada')
    })

    it('consulta retornando status autorizada com chave e protocolo', async () => {
      const sut = new PlugNotasFiscalProvider(makeEnv())

      const result = await sut.consultar('plugnotas-1')

      expect(result.status).toBe('autorizada')
      expect(result.plugnotasId).toBe('plugnotas-1')
      expect(result.chaveAcesso).toHaveLength(44)
      expect(result.protocolo).toBeTruthy()
    })

    it('permanece em simulação quando PLUGNOTAS_ENABLED=true mas sem API key', async () => {
      const sut = new PlugNotasFiscalProvider(makeEnv({ PLUGNOTAS_ENABLED: true }))

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('autorizada')
      expect(result.mensagemRetorno).toContain('simulação')
    })
  })

  describe('modo real (habilitado com API key)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    function enabledEnv(): EnvService {
      return makeEnv({ PLUGNOTAS_ENABLED: true, PLUGNOTAS_API_KEY: 'secret-key' })
    }

    function stubFetch(payload: unknown, status = 200): void {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          status,
          json: async () => payload,
        })),
      )
    }

    it('emitir mapeia a resposta autorizada da API', async () => {
      stubFetch({
        status: 'autorizada',
        chaveAcesso: '1'.repeat(44),
        protocolo: 'prot-9',
        id: 'pn-9',
        xmlUrl: 'https://x/nfe.xml',
        danfeUrl: 'https://x/danfe.pdf',
        mensagem: 'ok',
      })
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('autorizada')
      expect(result.chaveAcesso).toBe('1'.repeat(44))
      expect(result.plugnotasId).toBe('pn-9')
      expect(result.danfeUrl).toBe('https://x/danfe.pdf')
    })

    it('emitir mapeia status concluido para autorizada', async () => {
      stubFetch({ status: 'concluido', chaveAcesso: '2'.repeat(44) })
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('autorizada')
    })

    it('consultar mapeia status concluido para autorizada', async () => {
      stubFetch({ status: 'concluido' })
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      expect((await sut.consultar('pn-1')).status).toBe('autorizada')
    })

    it('emitir mapeia status desconhecido para emitindo e campos ausentes para null', async () => {
      stubFetch({ status: 'processando' })
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('emitindo')
      expect(result.chaveAcesso).toBeNull()
      expect(result.plugnotasId).toBeNull()
    })

    it('emitir mapeia erro da API para rejeitada', async () => {
      stubFetch({ status: 'erro', mensagem: 'NCM inválido' })
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('rejeitada')
      expect(result.mensagemRetorno).toBe('NCM inválido')
    })

    it('emitir trata resposta não-objeto como vazia', async () => {
      stubFetch('texto solto')
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      const result = await sut.emitir(makeInput())

      expect(result.status).toBe('emitindo')
    })

    it('cancelar mapeia cancelada e rejeitada', async () => {
      stubFetch({ status: 'cancelada' })
      const sut = new PlugNotasFiscalProvider(enabledEnv())
      expect((await sut.cancelar('pn-1')).status).toBe('cancelada')

      stubFetch({ status: 'erro', mensagem: 'fora do prazo' })
      const result = await sut.cancelar('pn-1')
      expect(result.status).toBe('rejeitada')
      expect(result.mensagemRetorno).toBe('fora do prazo')
    })

    it('consultar mapeia todos os status conhecidos', async () => {
      const sut = new PlugNotasFiscalProvider(enabledEnv())

      stubFetch({ status: 'autorizada' })
      expect((await sut.consultar('pn-1')).status).toBe('autorizada')

      stubFetch({ status: 'cancelada' })
      expect((await sut.consultar('pn-1')).status).toBe('cancelada')

      stubFetch({ status: 'rejeitada' })
      expect((await sut.consultar('pn-1')).status).toBe('rejeitada')

      stubFetch({ status: 'pendente' })
      expect((await sut.consultar('pn-1')).status).toBe('emitindo')
    })
  })
})
