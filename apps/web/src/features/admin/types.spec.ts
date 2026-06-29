import { describe, expect, it } from 'vitest'

import { ADMIN_PERMISSIONS, PERMISSION_CATEGORIES } from './types'


describe('types — constantes de permissao', () => {
  it('ADMIN_PERMISSIONS contém as 57 permissoes do catálogo', () => {
    expect(ADMIN_PERMISSIONS).toHaveLength(57)
    expect(ADMIN_PERMISSIONS).toContain('view:dashboard')
    expect(ADMIN_PERMISSIONS).toContain('admin:users')
    expect(ADMIN_PERMISSIONS).toContain('admin:roles')
    expect(ADMIN_PERMISSIONS).toContain('auditoria:read')
    expect(ADMIN_PERMISSIONS).toContain('empresa:status')
    expect(ADMIN_PERMISSIONS).toContain('nota:cancelar')
    expect(ADMIN_PERMISSIONS).toContain('consolidacao:create')
  })

  it('não tem permissoes duplicadas em ADMIN_PERMISSIONS', () => {
    expect(new Set(ADMIN_PERMISSIONS).size).toBe(ADMIN_PERMISSIONS.length)
  })

  it('PERMISSION_CATEGORIES tem 14 categorias', () => {
    expect(PERMISSION_CATEGORIES).toHaveLength(14)
  })

  it('a primeira categoria é Dashboard', () => {
    expect(PERMISSION_CATEGORIES[0]?.label).toBe('Dashboard')
  })

  it('categoria Administração contém as permissoes administrativas', () => {
    const cat = PERMISSION_CATEGORIES.find((c) => c.label === 'Administração')
    expect(cat).toBeDefined()
    expect(cat?.permissions).toEqual([
      'admin:users',
      'admin:roles',
      'view:settings',
      'manage:settings',
      'auditoria:read',
    ])
  })

  it('categoria Vendas agrupa pedidos, remessas e consolidação', () => {
    const cat = PERMISSION_CATEGORIES.find((c) => c.label === 'Vendas')
    expect(cat).toBeDefined()
    expect(cat?.permissions).toContain('pedido:confirm')
    expect(cat?.permissions).toContain('remessa:cancel')
    expect(cat?.permissions).toContain('consolidacao:create')
  })

  it('categoria Fiscal contém as permissoes de nota', () => {
    const cat = PERMISSION_CATEGORIES.find((c) => c.label === 'Fiscal')
    expect(cat?.permissions).toEqual(['nota:read', 'nota:emitir', 'nota:cancelar'])
  })

  it('todas as permissoes de todas as categorias estao em ADMIN_PERMISSIONS', () => {
    const allPerms = PERMISSION_CATEGORIES.flatMap((c) => c.permissions)
    for (const perm of allPerms) {
      expect(ADMIN_PERMISSIONS).toContain(perm)
    }
  })

  it('a uniao de todas as categorias cobre ADMIN_PERMISSIONS completo, sem sobra', () => {
    const allPerms = PERMISSION_CATEGORIES.flatMap((c) => c.permissions)
    expect(allPerms).toHaveLength(ADMIN_PERMISSIONS.length)
    for (const perm of ADMIN_PERMISSIONS) {
      expect(allPerms).toContain(perm)
    }
  })

  it('nenhuma permissao aparece em duas categorias', () => {
    const allPerms = PERMISSION_CATEGORIES.flatMap((c) => c.permissions)
    expect(new Set(allPerms).size).toBe(allPerms.length)
  })
})
