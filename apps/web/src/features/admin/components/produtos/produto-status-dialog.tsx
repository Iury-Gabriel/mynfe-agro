import type { Produto } from '@/features/admin/api/produtos-api'
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

interface ProdutoStatusDialogProps {
  produto: Produto
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function ProdutoStatusDialog({
  produto,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ProdutoStatusDialogProps): ReactElement {
  const willActivate = produto.status === 'inativo'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{willActivate ? 'Ativar produto' : 'Inativar produto'}</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja {willActivate ? 'ativar' : 'inativar'}{' '}
            <strong className="text-foreground">{produto.descricao}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 w-full sm:w-auto" disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 w-full sm:w-auto"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : willActivate ? 'Ativar' : 'Inativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
