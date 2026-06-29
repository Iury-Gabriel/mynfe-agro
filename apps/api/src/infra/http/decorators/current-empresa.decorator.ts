import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import { CustomHttpException } from '../exceptions/custom-http.exception'

export const ACTIVE_EMPRESA_HEADER = 'x-active-empresa-id'

export const CurrentEmpresa = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>()
    const raw: unknown = req.headers[ACTIVE_EMPRESA_HEADER]
    const value: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw CustomHttpException.badRequest(`Header ${ACTIVE_EMPRESA_HEADER} obrigatório.`)
    }

    return value
  },
)
