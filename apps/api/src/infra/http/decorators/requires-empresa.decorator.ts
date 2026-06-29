import { SetMetadata } from '@nestjs/common'

export const REQUIRES_EMPRESA_KEY = 'requiresEmpresa'
export const RequiresEmpresa = () => SetMetadata(REQUIRES_EMPRESA_KEY, true)
