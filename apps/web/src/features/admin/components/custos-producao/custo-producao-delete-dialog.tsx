import type { CustoProducao } from '@/features/admin/api/custos-producao-api'
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

interface CustoProducaoDeleteDialogProps {
  custo: CustoProducao
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function CustoProducaoDeleteDialog({
  custo,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CustoProducaoDeleteDialogProps): ReactElement {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir custo</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja excluir <strong className="text-foreground">{custo.descricao}</strong>? Esta ação
            não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 w-full sm:w-auto" disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 w-full sm:w-auto"
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isPending}
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
