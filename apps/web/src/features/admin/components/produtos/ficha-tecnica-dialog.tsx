import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { FichaTecnica } from '@/features/admin/api/fichas-tecnicas-api'
import type { Produto } from '@/features/admin/api/produtos-api'
import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateFichaTecnica,
  useDeleteFichaTecnica,
  useFichasTecnicas,
  useUpdateFichaTecnica,
} from '@/features/admin/api/fichas-tecnicas-api'
import { ActionButton } from '@/features/agroflow/ui'

const componenteSchema = z.object({
  descricaoComponente: z.string().min(1, 'Descrição obrigatória').max(200),
  quantidadeReferencia: z.string().max(20),
  observacoes: z.string().max(500),
})

type ComponenteFormValues = z.infer<typeof componenteSchema>

function emptyDefaults(): ComponenteFormValues {
  return { descricaoComponente: '', quantidadeReferencia: '', observacoes: '' }
}

function fromFicha(ficha: FichaTecnica): ComponenteFormValues {
  return {
    descricaoComponente: ficha.descricaoComponente,
    quantidadeReferencia: ficha.quantidadeReferencia != null ? String(ficha.quantidadeReferencia) : '',
    observacoes: ficha.observacoes ?? '',
  }
}

function toPayload(values: ComponenteFormValues) {
  const qtd = values.quantidadeReferencia.trim()
  return {
    descricaoComponente: values.descricaoComponente.trim(),
    quantidadeReferencia: qtd === '' ? null : Number(qtd),
    observacoes: values.observacoes.trim() || null,
  }
}

interface FichaTecnicaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto
  canEdit: boolean
}

export function FichaTecnicaDialog({
  open,
  onOpenChange,
  produto,
  canEdit,
}: FichaTecnicaDialogProps): ReactElement {
  const [editing, setEditing] = useState<FichaTecnica | null>(null)

  const { data, isLoading, isError } = useFichasTecnicas({
    produtoId: open ? produto.id : null,
  })
  const createFicha = useCreateFichaTecnica()
  const updateFicha = useUpdateFichaTecnica()
  const deleteFicha = useDeleteFichaTecnica()

  const fichas = data?.fichasTecnicas ?? []
  const isSubmitting = createFicha.isPending || updateFicha.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComponenteFormValues>({
    resolver: zodResolver(componenteSchema),
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    if (open) {
      reset(editing ? fromFicha(editing) : emptyDefaults())
    }
  }, [open, editing, reset])

  function onSubmit(values: ComponenteFormValues) {
    const payload = toPayload(values)
    if (editing) {
      updateFicha.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            setEditing(null)
            reset(emptyDefaults())
            toast.success('Componente atualizado.')
          },
          onError: () => toast.error('Não foi possível salvar o componente.'),
        },
      )
    } else {
      createFicha.mutate(
        { produtoId: produto.id, ...payload },
        {
          onSuccess: () => {
            reset(emptyDefaults())
            toast.success('Componente adicionado.')
          },
          onError: () => toast.error('Não foi possível salvar o componente.'),
        },
      )
    }
  }

  function handleDelete(ficha: FichaTecnica) {
    deleteFicha.mutate(ficha.id, {
      onSuccess: () => {
        if (editing?.id === ficha.id) setEditing(null)
        toast.success('Componente removido.')
      },
      onError: () => toast.error('Não foi possível remover o componente.'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>Ficha técnica</DialogTitle>
          <DialogDescription>
            Composição e observações de {produto.descricao}. Informativo — não movimenta estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando componentes…</p>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              Erro ao carregar a ficha técnica.
            </p>
          ) : fichas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum componente cadastrado.
            </p>
          ) : (
            <ul className="space-y-2">
              {fichas.map((ficha) => (
                <li
                  key={ficha.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {ficha.descricaoComponente}
                      {ficha.quantidadeReferencia != null && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({ficha.quantidadeReferencia})
                        </span>
                      )}
                    </p>
                    {ficha.observacoes && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{ficha.observacoes}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        aria-label={`Editar ${ficha.descricaoComponente}`}
                        onClick={() => setEditing(ficha)}
                      >
                        <Pencil />
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        aria-label={`Remover ${ficha.descricaoComponente}`}
                        disabled={deleteFicha.isPending}
                        onClick={() => handleDelete(ficha)}
                      >
                        <Trash2 />
                      </ActionButton>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <form
              onSubmit={(e) => {
                void handleSubmit(onSubmit)(e)
              }}
              className="space-y-3 border-t border-border/60 pt-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {editing ? 'Editar componente' : 'Novo componente'}
                </p>
                {editing && (
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setEditing(null)
                      reset(emptyDefaults())
                    }}
                  >
                    <X /> Cancelar edição
                  </ActionButton>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ficha-descricao">Descrição do componente</Label>
                <Input id="ficha-descricao" {...register('descricaoComponente')} />
                {errors.descricaoComponente && (
                  <p className="text-xs text-destructive">{errors.descricaoComponente.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ficha-quantidade">Quantidade de referência</Label>
                <Input
                  id="ficha-quantidade"
                  inputMode="decimal"
                  {...register('quantidadeReferencia')}
                />
                {errors.quantidadeReferencia && (
                  <p className="text-xs text-destructive">{errors.quantidadeReferencia.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ficha-observacoes">Observações</Label>
                <textarea
                  id="ficha-observacoes"
                  rows={2}
                  className="w-full rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  {...register('observacoes')}
                />
                {errors.observacoes && (
                  <p className="text-xs text-destructive">{errors.observacoes.message}</p>
                )}
              </div>

              <Button type="submit" className="h-11 w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Salvando...'
                ) : editing ? (
                  'Salvar componente'
                ) : (
                  <>
                    <Plus /> Adicionar componente
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
