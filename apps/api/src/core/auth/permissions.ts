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
  ],
  'Operador de Campo': ['view:dashboard', 'empresa:read'],
  Vendedor: ['view:dashboard', 'empresa:read'],
  Faturista: ['view:dashboard', 'empresa:read'],
} as const satisfies Record<RoleName, readonly Permission[]>

export function hasAnyPermission(
  userPerms: readonly string[],
  required: readonly Permission[],
): boolean {
  if (required.length === 0) return true
  return required.some((p) => userPerms.includes(p))
}
