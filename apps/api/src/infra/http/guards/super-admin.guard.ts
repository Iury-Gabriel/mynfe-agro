import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { REQUIRES_SUPER_ADMIN_KEY } from '../decorators/requires-super-admin.decorator'
import { CustomHttpException } from '../exceptions/custom-http.exception'

import type { SessionUser } from '../decorators/current-user.decorator'
import type { Request } from 'express'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean | undefined>(
      REQUIRES_SUPER_ADMIN_KEY,
      [ctx.getHandler(), ctx.getClass()],
    )
    if (!required) return true

    const req = ctx.switchToHttp().getRequest<Request & { user?: SessionUser }>()
    if (!req.user) throw CustomHttpException.unauthorized()
    if (!req.user.isSuperAdmin) throw CustomHttpException.forbidden()
    return true
  }
}
