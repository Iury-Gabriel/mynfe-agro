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

  it('tem exatamente 28 permissões', () => {
    expect(PERMISSIONS).toHaveLength(28)
  })
})

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

  it('papéis operacionais têm apenas leitura de empresa', () => {
    for (const role of ['Operador de Campo', 'Vendedor', 'Faturista'] as const) {
      expect(ROLE_PERMISSIONS[role]).toContain('empresa:read')
      expect(ROLE_PERMISSIONS[role]).not.toContain('empresa:create')
      expect(ROLE_PERMISSIONS[role]).not.toContain('empresa:status')
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
