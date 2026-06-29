import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  motivo: z.string().max(255),
})

type FormValues = z.infer<typeof schema>

interface CancelarNotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  numero: string | null
  onConfirm: (motivo: string | null) => void
  isPending: boolean
}

export function CancelarNotaDialog({
  open,
  onOpenChange,
  numero,
  onConfirm,
  isPending,
}: CancelarNotaDialogProps): ReactElement {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { motivo: '' },
  })

  useEffect(() => {
    if (open) reset({ motivo: '' })
  }, [open, reset])

  function onValid(values: FormValues): void {
    onConfirm(values.motivo.trim() || null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar nota fiscal</DialogTitle>
          <DialogDescription>
            {numero ? `Cancelar a NF-e ${numero}?` : 'Cancelar esta nota?'} Esta ação é registrada na
            SEFAZ e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onValid)(e)
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cancelar-motivo">Motivo</Label>
            <Input id="cancelar-motivo" placeholder="Opcional" {...register('motivo')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="h-11 w-full sm:w-auto"
              disabled={isPending}
            >
              {isPending ? 'Cancelando...' : 'Cancelar nota'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
