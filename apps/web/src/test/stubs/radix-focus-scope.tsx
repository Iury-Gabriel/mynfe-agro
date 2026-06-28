import { Slot } from '@radix-ui/react-slot'
import { forwardRef } from 'react'

import type { ComponentPropsWithoutRef, ReactElement, Ref } from 'react'

// Passthrough do @radix-ui/react-focus-scope só no ambiente de teste (alias em
// vitest.config). O FocusScope real instala listeners de focusin/focusout no
// `document` que chamam focus() de volta no último elemento; sob jsdom isso vira
// ping-pong reentrante e, como o focusScopesStack é singleton de módulo limpo
// apenas num setTimeout(0) deferido, scopes acumulam entre os `it`/arquivos do
// mesmo worker até estourar a pilha (RangeError) e derrubar o worker inteiro.
// O trap de foco não é alvo de nenhuma spec; renderizar os filhos sem trap
// (respeitando asChild via Slot, igual ao componente real) mantém o conteúdo do
// diálogo acessível e elimina a recursão na raiz.

type FocusScopeProps = ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean
  loop?: boolean
  trapped?: boolean
  onMountAutoFocus?: (event: Event) => void
  onUnmountAutoFocus?: (event: Event) => void
}

export const FocusScope = forwardRef(function FocusScope(
  {
    asChild,
    loop: _loop,
    trapped: _trapped,
    onMountAutoFocus: _onMountAutoFocus,
    onUnmountAutoFocus: _onUnmountAutoFocus,
    ...props
  }: FocusScopeProps,
  ref: Ref<HTMLDivElement>,
): ReactElement {
  const Comp = asChild ? Slot : 'div'
  return <Comp tabIndex={-1} {...props} ref={ref} />
})
FocusScope.displayName = 'FocusScope'

export const Root = FocusScope
