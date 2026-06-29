import { SetMetadata } from '@nestjs/common'

export const REQUIRES_SUPER_ADMIN_KEY = 'requiresSuperAdmin'
export const RequiresSuperAdmin = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRES_SUPER_ADMIN_KEY, true)
