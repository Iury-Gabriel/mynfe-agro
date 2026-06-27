import { create } from 'zustand'

import { getActiveEmpresaId, persistActiveEmpresaId } from '@/lib/active-empresa'

interface ActiveEmpresaState {
  activeEmpresaId: string | null
  setActiveEmpresaId: (id: string | null) => void
}

export const useActiveEmpresaStore = create<ActiveEmpresaState>((set) => ({
  activeEmpresaId: getActiveEmpresaId(),
  setActiveEmpresaId: (id) => {
    persistActiveEmpresaId(id)
    set({ activeEmpresaId: id })
  },
}))
