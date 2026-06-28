import { createBrowserRouter, Navigate, redirect } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { api } from '@/lib/api-client'
import { AuthLayout } from '@/routes/_auth/auth-layout'

export async function privateLoader() {
  try {
    const { data } = await api.get<{ user?: unknown } | null>('/api/auth/get-session')
    if (!data?.user) {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      // React Router loaders sinalizam redirect via `throw new Response(...)` — pattern oficial.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect(`/sign-in?next=${next}`)
    }
    return data.user
  } catch (err) {
    if (err instanceof Response) throw err
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect('/sign-in')
  }
}

export async function requirePermission(permission: string) {
  try {
    const { data } = await api.get<{ user?: { id: string }; permissions?: string[] } | null>(
      '/api/auth/get-session',
    )
    if (!data?.user) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect('/sign-in')
    }
    if (!data.permissions?.includes(permission)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect('/app')
    }
    return null
  } catch (err) {
    if (err instanceof Response) throw err
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect('/sign-in')
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, element: <Navigate to="/sign-in" replace /> },
    ],
  },

  {
    // Protótipo visual navegável do AgroFlow (dados mockados, sem auth/backend).
    // Vira o app real (`/app`) ao longo das fases do roadmap.
    path: '/preview',
    lazy: () =>
      import('@/features/agroflow/agroflow-layout').then((m) => ({ Component: m.AgroFlowLayout })),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/dashboard/pages/dashboard-page').then((m) => ({
            Component: m.DashboardPage,
          })),
      },
      {
        path: 'producao',
        lazy: () =>
          import('@/features/agroflow/pages/producao-page').then((m) => ({
            Component: m.ProducaoPage,
          })),
      },
      {
        path: 'estoque',
        lazy: () =>
          import('@/features/agroflow/pages/estoque-page').then((m) => ({ Component: m.EstoquePage })),
      },
      {
        path: 'vendas',
        lazy: () =>
          import('@/features/agroflow/pages/vendas-page').then((m) => ({ Component: m.VendasPage })),
      },
      {
        path: 'fiscal',
        lazy: () =>
          import('@/features/agroflow/pages/fiscal-page').then((m) => ({ Component: m.FiscalPage })),
      },
      {
        path: 'cadastros',
        lazy: () =>
          import('@/features/agroflow/pages/cadastros-page').then((m) => ({
            Component: m.CadastrosPage,
          })),
      },
      {
        path: 'admin',
        lazy: () =>
          import('@/features/agroflow/pages/admin-page').then((m) => ({ Component: m.AdminPage })),
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      {
        path: '/sign-in',
        lazy: () =>
          import('@/features/auth/pages/sign-in-page').then((m) => ({ Component: m.SignInPage })),
      },
      {
        path: '/forgot-password',
        lazy: () =>
          import('@/features/auth/pages/forgot-password-page').then((m) => ({
            Component: m.ForgotPasswordPage,
          })),
      },
      {
        path: '/reset-password',
        lazy: () =>
          import('@/features/auth/pages/reset-password-page').then((m) => ({
            Component: m.ResetPasswordPage,
          })),
      },
    ],
  },

  {
    path: '/app',
    element: <AppShell />,
    loader: privateLoader,
    children: [
      {
        path: 'empresas',
        lazy: () =>
          import('@/features/admin/pages/empresas-page').then((m) => ({
            Component: m.EmpresasPage,
          })),
        loader: () => requirePermission('empresa:read'),
      },
      {
        path: 'fazendas',
        lazy: () =>
          import('@/features/admin/pages/fazendas-page').then((m) => ({
            Component: m.FazendasPage,
          })),
        loader: () => requirePermission('fazenda:read'),
      },
      {
        path: 'areas',
        lazy: () =>
          import('@/features/admin/pages/areas-page').then((m) => ({ Component: m.AreasPage })),
        loader: () => requirePermission('area:read'),
      },
      {
        path: 'clientes',
        lazy: () =>
          import('@/features/admin/pages/clientes-page').then((m) => ({
            Component: m.ClientesPage,
          })),
        loader: () => requirePermission('cliente:read'),
      },
      {
        path: 'produtos',
        lazy: () =>
          import('@/features/admin/pages/produtos-page').then((m) => ({
            Component: m.ProdutosPage,
          })),
        loader: () => requirePermission('produto:read'),
      },
      {
        path: 'tabela-precos',
        lazy: () =>
          import('@/features/admin/pages/tabela-precos-page').then((m) => ({
            Component: m.TabelaPrecosPage,
          })),
        loader: () => requirePermission('preco:read'),
      },
      {
        path: 'safras',
        lazy: () =>
          import('@/features/admin/pages/safras-page').then((m) => ({ Component: m.SafrasPage })),
        loader: () => requirePermission('safra:read'),
      },
      {
        path: 'atividades-campo',
        lazy: () =>
          import('@/features/admin/pages/atividades-campo-page').then((m) => ({
            Component: m.AtividadesCampoPage,
          })),
        loader: () => requirePermission('atividade:read'),
      },
      {
        path: 'custos-producao',
        lazy: () =>
          import('@/features/admin/pages/custos-producao-page').then((m) => ({
            Component: m.CustosProducaoPage,
          })),
        loader: () => requirePermission('custo:read'),
      },
      {
        path: 'estoque',
        lazy: () =>
          import('@/features/estoque/pages/estoque-page').then((m) => ({ Component: m.EstoquePage })),
        loader: () => requirePermission('estoque:read'),
      },
      {
        path: 'lotes',
        lazy: () =>
          import('@/features/estoque/pages/lotes-page').then((m) => ({ Component: m.LotesPage })),
        loader: () => requirePermission('lote:read'),
      },
      {
        path: 'colheitas',
        lazy: () =>
          import('@/features/estoque/pages/colheitas-page').then((m) => ({
            Component: m.ColheitasPage,
          })),
        loader: () => requirePermission('colheita:read'),
      },
      {
        path: 'admin/roles',
        lazy: () =>
          import('@/features/admin/pages/roles-page').then((m) => ({ Component: m.RolesPage })),
        loader: () => requirePermission('admin:roles'),
      },
      {
        path: 'admin/users',
        lazy: () =>
          import('@/features/admin/pages/users-page').then((m) => ({ Component: m.UsersPage })),
        loader: () => requirePermission('admin:users'),
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
