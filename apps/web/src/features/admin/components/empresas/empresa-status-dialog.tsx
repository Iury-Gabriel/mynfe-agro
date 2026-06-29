import { toast } from 'sonner'

import type { Empresa } from '@/features/admin/api/empresas-api'
import type { ReactElement } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSetEmpresaStatus } from '@/features/admin/api/empresas-api'

interface EmpresaStatusDialogProps {
  empresa: Empresa
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmpresaStatusDialog({
  empresa,
  open,
  onOpenChange,
}: EmpresaStatusDialogProps): ReactElement {
  const setStatus = useSetEmpresaStatus()
  const willActivate = empresa.status === 'inativo'
  const nextStatus = willActivate ? 'ativo' : 'inativo'

  function handleConfirm() {
    setStatus.mutate(
      { id: empresa.id, status: nextStatus },
      {
        onSuccess: () => {
          onOpenChange(false)
          toast.success(willActivate ? 'Empresa ativada.' : 'Empresa inativada.')
        },
        onError: () => toast.error('Não foi possível alterar o status.'),
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{willActivate ? 'Ativar empresa' : 'Inativar empresa'}</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja {willActivate ? 'ativar' : 'inativar'}{' '}
            <strong className="text-foreground">{empresa.razaoSocial}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 w-full sm:w-auto" disabled={setStatus.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 w-full sm:w-auto"
            onClick={handleConfirm}
            disabled={setStatus.isPending}
          >
            {setStatus.isPending ? 'Salvando...' : willActivate ? 'Ativar' : 'Inativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
