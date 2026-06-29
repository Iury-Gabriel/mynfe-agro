import { describe, expect, it } from 'vitest'

import {
  PERMISSIONS,
  ROLE_NAMES,
  ROLE_PERMISSIONS,
  hasAnyPermission,
  type Permission,
} from './permissions'

describe('PERMISSIONS', () => {
  it('contém todas as permissões esperadas', () => {
    expect(PERMISSIONS).toContain('admin:users')
    expect(PERMISSIONS).toContain('admin:roles')
    expect(PERMISSIONS).toContain('view:dashboard')
    expect(PERMISSIONS).toContain('view:settings')
    expect(PERMISSIONS).toContain('manage:settings')
  })

  it('contém as permissões de empresa', () => {
    expect(PERMISSIONS).toContain('empresa:read')
    expect(PERMISSIONS).toContain('empresa:create')
    expect(PERMISSIONS).toContain('empresa:update')
    expect(PERMISSIONS).toContain('empresa:status')
  })

  it('contém as permissões de cadastros', () => {
    expect(PERMISSIONS).toContain('fazenda:read')
    expect(PERMISSIONS).toContain('area:create')
    expect(PERMISSIONS).toContain('cliente:update')
    expect(PERMISSIONS).toContain('produto:status')
    expect(PERMISSIONS).toContain('preco:create')
  })

  it('contém as permissões de cultivo & safra', () => {
    expect(PERMISSIONS).toContain('safra:read')
    expect(PERMISSIONS).toContain('safra:create')
    expect(PERMISSIONS).toContain('safra:update')
    expect(PERMISSIONS).toContain('safra:delete')
    expect(PERMISSIONS).toContain('atividade:read')
    expect(PERMISSIONS).toContain('atividade:create')
    expect(PERMISSIONS).toContain('atividade:delete')
    expect(PERMISSIONS).toContain('custo:read')
    expect(PERMISSIONS).toContain('custo:create')
    expect(PERMISSIONS).toContain('custo:delete')
  })

  it('contém as permissões de estoque, lotes & colheita', () => {
    expect(PERMISSIONS).toContain('colheita:read')
    expect(PERMISSIONS).toContain('colheita:create')
    expect(PERMISSIONS).toContain('lote:read')
    expect(PERMISSIONS).toContain('estoque:read')
    expect(PERMISSIONS).toContain('estoque:ajuste')
    expect(PERMISSIONS).toContain('embalagem:create')
  })

  it('contém as permissões de vendas (pedido, remessa & consolidação)', () => {
    expect(PERMISSIONS).toContain('pedido:read')
    expect(PERMISSIONS).toContain('pedido:create')
    expect(PERMISSIONS).toContain('pedido:confirm')
    expect(PERMISSIONS).toContain('pedido:cancel')
    expect(PERMISSIONS).toContain('remessa:read')
    expect(PERMISSIONS).toContain('remessa:create')
    expect(PERMISSIONS).toContain('remessa:update')
    expect(PERMISSIONS).toContain('remessa:cancel')
    expect(PERMISSIONS).toContain('consolidacao:create')
  })

  it('contém as permissões de nota fiscal', () => {
    expect(PERMISSIONS).toContain('nota:read')
    expect(PERMISSIONS).toContain('nota:emitir')
    expect(PERMISSIONS).toContain('nota:cancelar')
  })

  it('contém a permissão de auditoria', () => {
    expect(PERMISSIONS).toContain('auditoria:read')
  })

  it('tem exatamente 57 permissões', () => {
    expect(PERMISSIONS).toHaveLength(57)
  })
})

const NOTA_PERMISSIONS = ['nota:read', 'nota:emitir', 'nota:cancelar'] as const

const VENDAS_PERMISSIONS = [
  'pedido:read',
  'pedido:create',
  'pedido:confirm',
  'pedido:cancel',
  'remessa:read',
  'remessa:create',
  'remessa:update',
  'remessa:cancel',
  'consolidacao:create',
] as const

const ESTOQUE_PERMISSIONS = [
  'colheita:read',
  'colheita:create',
  'lote:read',
  'estoque:read',
  'estoque:ajuste',
  'embalagem:create',
] as const

describe('ROLE_PERMISSIONS', () => {
  it('define os 5 papéis canônicos', () => {
    expect(ROLE_NAMES).toEqual([
      'Administrador',
      'Gestor',
      'Operador de Campo',
      'Vendedor',
      'Faturista',
    ])
  })

  it('Administrador recebe todas as permissões do catálogo', () => {
    expect([...ROLE_PERMISSIONS.Administrador].sort()).toEqual([...PERMISSIONS].sort())
  })

  it('Gestor gerencia empresas mas não administra usuários/cargos', () => {
    expect(ROLE_PERMISSIONS.Gestor).toContain('empresa:update')
    expect(ROLE_PERMISSIONS.Gestor).not.toContain('admin:users')
    expect(ROLE_PERMISSIONS.Gestor).not.toContain('admin:roles')
  })

  it('Gestor recebe configurações do tenant e auditoria', () => {
    expect(ROLE_PERMISSIONS.Gestor).toContain('view:settings')
    expect(ROLE_PERMISSIONS.Gestor).toContain('manage:settings')
    expect(ROLE_PERMISSIONS.Gestor).toContain('auditoria:read')
  })

  it('papéis operacionais não recebem configurações nem auditoria', () => {
    for (const role of ['Operador de Campo', 'Vendedor', 'Faturista'] as const) {
      expect(ROLE_PERMISSIONS[role]).not.toContain('manage:settings')
      expect(ROLE_PERMISSIONS[role]).not.toContain('auditoria:read')
    }
  })

  it('papéis operacionais têm apenas leitura de empresa', () => {
    for (const role of ['Operador de Campo', 'Vendedor', 'Faturista'] as const) {
      expect(ROLE_PERMISSIONS[role]).toContain('empresa:read')
      expect(ROLE_PERMISSIONS[role]).not.toContain('empresa:create')
      expect(ROLE_PERMISSIONS[role]).not.toContain('empresa:status')
    }
  })

  it('Gestor recebe todas as permissões de cultivo & safra', () => {
    for (const p of [
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
    ] as const) {
      expect(ROLE_PERMISSIONS.Gestor).toContain(p)
    }
  })

  it('Operador de Campo recebe todas as permissões de cultivo & safra', () => {
    for (const p of [
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
    ] as const) {
      expect(ROLE_PERMISSIONS['Operador de Campo']).toContain(p)
    }
  })

  it('Gestor recebe todas as permissões de estoque, lotes & colheita', () => {
    for (const p of ESTOQUE_PERMISSIONS) {
      expect(ROLE_PERMISSIONS.Gestor).toContain(p)
    }
  })

  it('Operador de Campo recebe todas as permissões de estoque, lotes & colheita', () => {
    for (const p of ESTOQUE_PERMISSIONS) {
      expect(ROLE_PERMISSIONS['Operador de Campo']).toContain(p)
    }
  })

  it('Vendedor e Faturista têm apenas consulta de lote e estoque', () => {
    for (const role of ['Vendedor', 'Faturista'] as const) {
      expect(ROLE_PERMISSIONS[role]).toContain('lote:read')
      expect(ROLE_PERMISSIONS[role]).toContain('estoque:read')
      expect(ROLE_PERMISSIONS[role]).not.toContain('estoque:ajuste')
      expect(ROLE_PERMISSIONS[role]).not.toContain('colheita:create')
      expect(ROLE_PERMISSIONS[role]).not.toContain('embalagem:create')
    }
  })

  it('Gestor recebe todas as permissões de vendas', () => {
    for (const p of VENDAS_PERMISSIONS) {
      expect(ROLE_PERMISSIONS.Gestor).toContain(p)
    }
  })

  it('Vendedor recebe todas as permissões de vendas', () => {
    for (const p of VENDAS_PERMISSIONS) {
      expect(ROLE_PERMISSIONS.Vendedor).toContain(p)
    }
  })

  it('Faturista recebe apenas leitura de pedidos e remessas', () => {
    expect(ROLE_PERMISSIONS.Faturista).toContain('pedido:read')
    expect(ROLE_PERMISSIONS.Faturista).toContain('remessa:read')
    expect(ROLE_PERMISSIONS.Faturista).not.toContain('pedido:create')
    expect(ROLE_PERMISSIONS.Faturista).not.toContain('remessa:create')
    expect(ROLE_PERMISSIONS.Faturista).not.toContain('consolidacao:create')
  })

  it('Gestor recebe todas as permissões de nota fiscal', () => {
    for (const p of NOTA_PERMISSIONS) {
      expect(ROLE_PERMISSIONS.Gestor).toContain(p)
    }
  })

  it('Faturista recebe todas as permissões de nota fiscal', () => {
    for (const p of NOTA_PERMISSIONS) {
      expect(ROLE_PERMISSIONS.Faturista).toContain(p)
    }
  })

  it('Vendedor recebe apenas leitura de nota fiscal', () => {
    expect(ROLE_PERMISSIONS.Vendedor).toContain('nota:read')
    expect(ROLE_PERMISSIONS.Vendedor).not.toContain('nota:emitir')
    expect(ROLE_PERMISSIONS.Vendedor).not.toContain('nota:cancelar')
  })

  it('Operador de Campo não recebe nenhuma permissão de nota fiscal', () => {
    for (const p of NOTA_PERMISSIONS) {
      expect(ROLE_PERMISSIONS['Operador de Campo']).not.toContain(p)
    }
  })

  it('Operador de Campo não recebe nenhuma permissão de vendas', () => {
    for (const p of VENDAS_PERMISSIONS) {
      expect(ROLE_PERMISSIONS['Operador de Campo']).not.toContain(p)
    }
  })

  it('Vendedor e Faturista não recebem permissões de cultivo & safra', () => {
    for (const role of ['Vendedor', 'Faturista'] as const) {
      for (const p of ['safra:read', 'atividade:read', 'custo:read'] as const) {
        expect(ROLE_PERMISSIONS[role]).not.toContain(p)
      }
    }
  })

  it('todas as permissões de papel pertencem ao catálogo (allow-list)', () => {
    const catalog = new Set<Permission>(PERMISSIONS)
    for (const perms of Object.values(ROLE_PERMISSIONS)) {
      for (const p of perms) {
        expect(catalog.has(p)).toBe(true)
      }
    }
  })
})

describe('hasAnyPermission', () => {
  it('retorna true quando nenhuma permissão é requerida', () => {
    expect(hasAnyPermission([], [])).toBe(true)
  })

  it('retorna true quando o usuário tem ao menos uma das requeridas', () => {
    expect(hasAnyPermission(['admin:users', 'view:dashboard'], ['admin:users'])).toBe(true)
  })

  it('retorna true quando o usuário tem apenas uma das múltiplas requeridas', () => {
    expect(hasAnyPermission(['view:dashboard'], ['admin:users', 'view:dashboard'])).toBe(true)
  })

  it('retorna false quando o usuário não tem nenhuma das requeridas', () => {
    expect(hasAnyPermission(['view:dashboard'], ['admin:users'])).toBe(false)
  })

  it('retorna false quando o usuário não tem permissões', () => {
    expect(hasAnyPermission([], ['admin:users'])).toBe(false)
  })

  it('retorna true para admin:roles', () => {
    expect(hasAnyPermission(['admin:roles'], ['admin:roles'])).toBe(true)
  })

  it('retorna true para manage:settings', () => {
    expect(hasAnyPermission(['manage:settings'], ['manage:settings'])).toBe(true)
  })

  it('retorna true para view:settings', () => {
    expect(hasAnyPermission(['view:settings'], ['view:settings'])).toBe(true)
  })
})
