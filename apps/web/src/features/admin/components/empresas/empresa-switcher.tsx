import { Building2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import type { ReactElement } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmpresas, useSetActiveEmpresa } from '@/features/admin/api/empresas-api'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

export function EmpresaSwitcher(): ReactElement | null {
  const { data } = useEmpresas({ perPage: 100 })
  const setActive = useSetActiveEmpresa()
  const activeEmpresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)
  const setActiveEmpresaId = useActiveEmpresaStore((s) => s.setActiveEmpresaId)

  const empresas = useMemo(() => data?.empresas ?? [], [data])

  useEffect(() => {
    if (empresas.length === 0) return
    const stillExists = empresas.some((e) => e.id === activeEmpresaId)
    const first = empresas[0]
    if (first && (!activeEmpresaId || !stillExists)) {
      setActiveEmpresaId(first.id)
    }
  }, [empresas, activeEmpresaId, setActiveEmpresaId])

  if (empresas.length === 0) return null

  function handleChange(empresaId: string) {
    setActive.mutate(empresaId, {
      onSuccess: () => {
        setActiveEmpresaId(empresaId)
        toast.success('Empresa ativa atualizada.')
      },
      onError: () => toast.error('Não foi possível trocar a empresa ativa.'),
    })
  }

  return (
    <Select value={activeEmpresaId ?? undefined} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-[200px]" aria-label="Empresa ativa">
        <span className="flex items-center gap-2 truncate">
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Selecionar empresa" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {empresas.map((empresa) => (
          <SelectItem key={empresa.id} value={empresa.id}>
            {empresa.nomeFantasia ?? empresa.razaoSocial}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
