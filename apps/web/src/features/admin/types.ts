export interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: string[]
  assignedUserCount: number
  createdAt: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  roleIds: string[]
  createdAt: string
  isActive: boolean
  isProtected: boolean
}

// TODO(@rafaolegario): sem shared package de tipos entre apps/api e apps/web, este
// array é cópia manual de PERMISSIONS em apps/api/src/core/auth/permissions.ts.
// Ao adicionar permissão no backend, atualizar também aqui.
export const ADMIN_PERMISSIONS = [
  'view:dashboard',
  'admin:users',
  'admin:roles',
  'view:settings',
  'manage:settings',
  'auditoria:read',
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
  'safra:read',
  'safra:create',
  'safra:update',
  'safra:delete',
  'atividade:read',
  'atividade:create',
  'atividade:delete',
  'custo:read',
  'custo:create',
  'custo:delete',
  'colheita:read',
  'colheita:create',
  'lote:read',
  'estoque:read',
  'estoque:ajuste',
  'embalagem:create',
  'pedido:read',
  'pedido:create',
  'pedido:confirm',
  'pedido:cancel',
  'remessa:read',
  'remessa:create',
  'remessa:update',
  'remessa:cancel',
  'consolidacao:create',
  'nota:read',
  'nota:emitir',
  'nota:cancelar',
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export interface PermissionCategory {
  label: string
  permissions: AdminPermission[]
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  { label: 'Dashboard', permissions: ['view:dashboard'] },
  {
    label: 'Administração',
    permissions: ['admin:users', 'admin:roles', 'view:settings', 'manage:settings', 'auditoria:read'],
  },
  {
    label: 'Empresas',
    permissions: ['empresa:read', 'empresa:create', 'empresa:update', 'empresa:status'],
  },
  {
    label: 'Fazendas',
    permissions: ['fazenda:read', 'fazenda:create', 'fazenda:update', 'fazenda:delete'],
  },
  { label: 'Áreas', permissions: ['area:read', 'area:create', 'area:update', 'area:delete'] },
  {
    label: 'Clientes',
    permissions: ['cliente:read', 'cliente:create', 'cliente:update', 'cliente:delete'],
  },
  {
    label: 'Produtos',
    permissions: ['produto:read', 'produto:create', 'produto:update', 'produto:status'],
  },
  { label: 'Preços', permissions: ['preco:read', 'preco:create', 'preco:delete'] },
  { label: 'Safras', permissions: ['safra:read', 'safra:create', 'safra:update', 'safra:delete'] },
  {
    label: 'Atividades de campo',
    permissions: ['atividade:read', 'atividade:create', 'atividade:delete'],
  },
  { label: 'Custos', permissions: ['custo:read', 'custo:create', 'custo:delete'] },
  {
    label: 'Colheita & Estoque',
    permissions: [
      'colheita:read',
      'colheita:create',
      'lote:read',
      'estoque:read',
      'estoque:ajuste',
      'embalagem:create',
    ],
  },
  {
    label: 'Vendas',
    permissions: [
      'pedido:read',
      'pedido:create',
      'pedido:confirm',
      'pedido:cancel',
      'remessa:read',
      'remessa:create',
      'remessa:update',
      'remessa:cancel',
      'consolidacao:create',
    ],
  },
  { label: 'Fiscal', permissions: ['nota:read', 'nota:emitir', 'nota:cancelar'] },
]
