import type { Tenant } from '@/features/platform/api/tenants-api'
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

interface TenantStatusDialogProps {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function TenantStatusDialog({
  tenant,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: TenantStatusDialogProps): ReactElement {
  const willActivate = tenant.status === 'suspenso'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{willActivate ? 'Ativar tenant' : 'Suspender tenant'}</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja {willActivate ? 'ativar' : 'suspender'}{' '}
            <strong className="text-foreground">{tenant.nome}</strong>?
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
            {isPending ? 'Salvando...' : willActivate ? 'Ativar' : 'Suspender'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
