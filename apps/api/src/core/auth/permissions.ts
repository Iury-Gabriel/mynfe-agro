export const PERMISSIONS = [
  'admin:users',
  'admin:roles',
  'view:dashboard',
  'view:settings',
  'manage:settings',
  'empresa:read',
  'empresa:create',
  'empresa:update',
  'empresa:status',
  'fazenda:read',
  'fazenda:create',
  'fazenda:update',
  'fazenda:delete',
  'area:read',
  'area:create',
  'area:update',
  'area:delete',
  'cliente:read',
  'cliente:create',
  'cliente:update',
  'cliente:delete',
  'produto:read',
  'produto:create',
  'produto:update',
  'produto:status',
  'preco:read',
  'preco:create',
  'preco:delete',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ADMIN_PERMISSIONS = ['admin:users', 'admin:roles'] as const satisfies readonly Permission[]

export const ROLE_NAMES = [
  'Administrador',
  'Gestor',
  'Operador de Campo',
  'Vendedor',
  'Faturista',
] as const

export type RoleName = (typeof ROLE_NAMES)[number]

export const ROLE_PERMISSIONS = {
  Administrador: [...PERMISSIONS],
  Gestor: [
    'view:dashboard',
    'view:settings',
    'empresa:read',
    'empresa:create',
    'empresa:update',
    'empresa:status',
    'fazenda:read',
    'fazenda:create',
    'fazenda:update',
    'fazenda:delete',
    'area:read',
    'area:create',
    'area:update',
    'area:delete',
    'cliente:read',
    'cliente:create',
    'cliente:update',
    'cliente:delete',
    'produto:read',
    'produto:create',
    'produto:update',
    'produto:status',
    'preco:read',
    'preco:create',
    'preco:delete',
  ],
  'Operador de Campo': [
    'view:dashboard',
    'empresa:read',
    'fazenda:read',
    'area:read',
    'produto:read',
  ],
  Vendedor: [
    'view:dashboard',
    'empresa:read',
    'cliente:read',
    'cliente:create',
    'cliente:update',
    'produto:read',
    'preco:read',
    'preco:create',
    'preco:delete',
  ],
  Faturista: ['view:dashboard', 'empresa:read', 'cliente:read', 'produto:read'],
} as const satisfies Record<RoleName, readonly Permission[]>

export function hasAnyPermission(
  userPerms: readonly string[],
  required: readonly Permission[],
): boolean {
  if (required.length === 0) return true
  return required.some((p) => userPerms.includes(p))
}
