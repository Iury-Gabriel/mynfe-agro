---
description: Executa uma task fullstack/backend/frontend via dev-conductor (cria CURRENT_TASK.md, pede aprovação humana antes de codar).
---

Você acabou de receber um pedido de task do usuário. Sua tarefa:

1. Identifique se é fullstack, só backend ou só frontend.
   - **Fullstack**: toca em `apps/api/` E `apps/web/`, ou muda contrato HTTP visível pro front.
   - **Só backend**: muda apenas `apps/api/`, `packages/` consumidos pelo backend, schema Prisma, jobs, webhooks.
   - **Só frontend**: muda apenas `apps/web/`, rotas, componentes, estado client-side, sem mudar API.
   - Em caso de dúvida → trate como fullstack.

2. Acione o agente conductor correspondente via Agent tool (em foreground):
   - Fullstack → `dev-conductor`
   - Só backend → `backend-conductor`
   - Só frontend → `frontend-conductor`

3. No prompt do conductor, inclua:
   - O pedido **literal** do usuário (`$ARGUMENTS`).
   - Qualquer contexto que ele tenha mencionado antes nesta conversa (arquivo aberto na IDE, decisão prévia, restrição já discutida).
   - Instrução explícita: "crie `.claude/tasks/CURRENT_TASK.md` com objetivo + decisões + riscos e PARE pra aprovação humana antes de codar".

4. Quando o conductor retornar, mostre ao usuário:
   - Caminho do `CURRENT_TASK.md` criado.
   - Resumo curto (≤5 bullets) do plano proposto.
   - Pergunta direta: "Aprova? (sim / ajustar / cancelar)".

## NÃO FAZER

- ❌ Começar a codar antes da aprovação humana.
- ❌ Pular o conductor e chamar especialistas (`domain-architect`, `api-engineer`, etc.) diretamente.
- ❌ Criar `CURRENT_TASK.md` você mesmo — quem cria é o conductor.
- ❌ Adicionar feature de exemplo "pra ilustrar" — este repo é template, zero negócio (ver `CLAUDE.md` §9).

Pedido do usuário: $ARGUMENTS
