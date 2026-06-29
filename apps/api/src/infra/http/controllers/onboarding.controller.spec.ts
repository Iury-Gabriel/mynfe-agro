import { Test } from '@nestjs/testing'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { OnboardingController } from './onboarding.controller'

import type { INestApplication } from '@nestjs/common'

import { left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { RegisterTenantUseCase } from '@/domain/application/use-cases/tenants/register-tenant-use-case'
import { User } from '@/domain/enterprise/entities/user'

function makeUser() {
  return User.create(
    {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      emailVerified: true,
      image: null,
      roleIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('user-1'),
  )
}

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'senha-super-segura',
  tenantNome: 'Fazenda Ada',
  empresa: {
    razaoSocial: 'Agro Ada LTDA',
    cnpjCpf: '11222333000181',
    tipoPessoa: 'PJ',
    regimeTributario: 'simples_nacional',
    crt: '1',
  },
}

describe(OnboardingController.name, () => {
  let app: INestApplication
  const registerTenant = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [{ provide: RegisterTenantUseCase, useValue: registerTenant }],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('cria tenant e retorna 201 sem exigir autenticação', async () => {
    registerTenant.execute.mockResolvedValue(right({ user: makeUser() }))

    const res = await request(app.getHttpServer()).post('/onboarding/register').send(validBody)

    expect(res.status).toBe(201)
    expect(res.body.user).toEqual({ id: 'user-1', email: 'ada@example.com' })
    expect(registerTenant.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        tenantNome: 'Fazenda Ada',
        empresa: expect.objectContaining({ razaoSocial: 'Agro Ada LTDA' }),
      }),
    )
  })

  it('retorna 409 quando o email já está em uso', async () => {
    registerTenant.execute.mockResolvedValue(left(new EmailAlreadyInUseError('ada@example.com')))

    const res = await request(app.getHttpServer()).post('/onboarding/register').send(validBody)

    expect(res.status).toBe(409)
    expect(res.body.error.kind).toBe('EmailAlreadyInUse')
  })

  it('retorna 400 quando o CNPJ é inválido', async () => {
    registerTenant.execute.mockResolvedValue(left(new InvalidCnpjCpfError('000')))

    const res = await request(app.getHttpServer()).post('/onboarding/register').send(validBody)

    expect(res.status).toBe(400)
    expect(res.body.error.kind).toBe('InvalidCnpjCpf')
  })

  it('retorna 500 em erro inesperado', async () => {
    registerTenant.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))

    const res = await request(app.getHttpServer()).post('/onboarding/register').send(validBody)

    expect(res.status).toBe(500)
  })

  it('retorna 400 quando o body é inválido (senha curta)', async () => {
    const res = await request(app.getHttpServer())
      .post('/onboarding/register')
      .send({ ...validBody, password: 'curta' })

    expect(res.status).toBe(400)
    expect(registerTenant.execute).not.toHaveBeenCalled()
  })

  it('retorna 400 quando há campo desconhecido (schema strict)', async () => {
    const res = await request(app.getHttpServer())
      .post('/onboarding/register')
      .send({ ...validBody, hacker: true })

    expect(res.status).toBe(400)
    expect(registerTenant.execute).not.toHaveBeenCalled()
  })
})
