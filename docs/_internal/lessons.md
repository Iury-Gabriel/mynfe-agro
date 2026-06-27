# Lessons Learned — uso interno dos agentes

> **Este arquivo é INTERNO.** Não aparece no onboarding (`onboarding-guide` o ignora). É consultado e mantido pelo agente `lessons-keeper` no fluxo dos conductors.

## Como funciona

- **Leitura:** `lessons-keeper` é chamado pelos conductors (`dev-conductor`, `backend-conductor`, `frontend-conductor`) **no início de toda task**, antes do planejamento, pra filtrar lições relevantes ao escopo.
- **Escrita:** `lessons-keeper` é chamado **depois do `code-reviewer`** quando houve correção não-trivial, e adiciona uma entrada nova **no topo** deste arquivo.
- **Apagar:** lições obsoletas não são removidas — são marcadas com `**Status: obsoleta — <motivo>**` no topo da entrada.

## Formato canônico (cópia do agent doc)

```markdown
## YYYY-MM-DD — Título curto e específico

**Área:** <ex: webhooks, prisma migration, RBAC, frontend forms, BullMQ, cache>
**Stack tocado:** <ex: BullMQ + Redis, Prisma, better-auth, React Hook Form>

### Sintoma
<O que se observa quando o erro aparece.>

### Causa raiz
<Por que aconteceu.>

### Correção
<O que foi feito pra resolver. Caminho:linha se ajuda. Não copie diff inteiro.>

### Onde aparece tipicamente
<Padrão de código ou cenário que dispara o erro.>

### Referências
- Task: `.claude/tasks/DONE/<arquivo>.md`
- Commit: `<sha>`
- Código relacionado: `<caminho:linha>`
```

---

## Lições registradas

> Lições marcadas com `[importada]` vieram de projetos derivados do template (analise-credito-douglas-marangoni). Reusáveis em qualquer projeto novo.

## 2026-06-19 — Rate-limit chaveado só por IP colapsa em contador global atrás de proxy-chain/NAT

**Área:** rate-limit, ThrottlerGuard, deploy atrás de proxy
**Stack tocado:** `@nestjs/throttler` (6.5.0), Redis storage, Cloudflare/nginx/BFF, trust proxy

### Sintoma
Em produção atrás de `Cloudflare → nginx → BFF → API`, o `ThrottlerGuard` default (`getTracker = req.ip`) vira um **contador global da plataforma**: todo request chega com o mesmo IP (servidor do BFF ou `127.0.0.1`), então o limite de N/min soma entre TODOS os usuários → `429` em massa deslogando geral. Mesmo sem BFF, usuários atrás de NAT corporativo/CGNAT compartilham IP e um abusivo dispara `429` pra todos do mesmo IP.

### Causa raiz
Chave de rate-limit por IP pressupõe que o IP identifica o cliente. Atrás de proxy-chain o IP visível é de infra, não do cliente. Hop-counting com `trust proxy: N` é frágil (orange vs DNS-only no Cloudflare) e spoofável.

### Correção
Dois throttlers nomeados no mesmo guard (`@nestjs/throttler` aceita `getTracker` por-throttler):
- `default` → `identityTracker`: `sess:<sha256(cookie *session_token)>` quando há sessão, senão `ip:<req.ip>`. Balde por usuário, à prova de BFF, sem repassar IP em N handlers. O guard roda ANTES do AuthGuard → lê o cookie do header (não `req.user`).
- `ip` → `ipTracker`: sempre `ip:<req.ip>`, teto mais alto (`THROTTLE_IP_LIMIT`). Backstop que fecha o bypass de quem rotaciona um cookie `*session_token` forjado pra ganhar balde novo a cada request.
- Token de sessão NUNCA logado — só o hash vira chave. Fallback `ip:unknown` garante que a chave nunca é vazia (chave vazia = contador global de novo).
- Lockout de sign-in continua por email (já imune); não foi tocado.

`infra/http/throttler/throttler-trackers.ts` (funções puras, testáveis) + `http.module.ts`.

### Onde aparece tipicamente
Qualquer API atrás de CDN/reverse-proxy/BFF onde o browser não fala direto com a API. O `req.ip` "certo" em dev (1 hop) esconde o problema; só aparece em produção.

### Limitação consciente
Atrás de IP compartilhado (BFF sem repassar IP real), o backstop `ip` vira teto **global de volume**, não por-cliente — só vira por-cliente quando o IP real é visível. Hardening opcional (não aplicado no template, é específico de deploy): firewall da origem liberando só ranges do CDN + repassar `CF-Connecting-IP` (valor único sobrescrito pelo CDN, não appendável como XFF) pro throttler.

### Referências
- Task: `.claude/tasks/DONE/2026-06-19-throttle-session-key.md`
- Código: `apps/api/src/infra/http/throttler/throttler-trackers.ts`, `apps/api/src/infra/http/http.module.ts`

## 2026-06-19 — Centralizar audit dentro do `$transaction` órfaniza o port `AuditEventRepository`

**Área:** prisma transaction, audit log, layering
**Stack tocado:** Prisma `$transaction`, ports (abstract class), NestJS

### Sintoma
Ao tornar `set-password` atômico (audit + `account.update` no mesmo `$transaction` do adapter), o `code-reviewer` reprova: o port `AuditEventRepository.create()` e sua impl `PrismaAuditEventRepository` ficaram **sem consumidor** — letra morta (CLAUDE.md §9: "port abstract sem use-case consumidor").

### Causa raiz
Corrigir um finding (atomicidade) cria outro (port morto). Quando o audit passa a ser escrito inline no `$transaction` do adapter, ninguém mais chama o método do port pass-through. Sutil porque o **tipo** continua vivo e usado (`AuditEventInput`) — só a classe abstrata + impl morrem. O reviewer vê o type referenciado e pode achar que o port está vivo.

### Correção
Ao centralizar audit inline-no-tx, **remover** o port `AuditEventRepository` e a impl `PrismaAuditEventRepository`, mantendo só os tipos compartilhados (`AuditEventInput`). Não deixar abstract class pass-through sem chamador "pra caso precise depois".

### Onde aparece tipicamente
- Refator que move uma escrita pra dentro de `$transaction` de outro agregado e deixa o repo antigo órfão.
- Qualquer port cujo único call site foi absorvido por uma operação atômica maior.

### Referências
- Branch: `fix/audit-hardening`
- Descoberto por: `code-reviewer`

## 2026-06-19 — `$transaction` mockado como passthrough esconde falha de rollback

**Área:** testes, prisma transaction, atomicidade
**Stack tocado:** Vitest (unit), Prisma `$transaction`, Postgres (e2e)

### Sintoma
Unit do adapter mocka `$transaction` como `cb(tx)` (passthrough), então a semântica de rollback nunca é exercitada. Happy-path e2e só checa status 200. Resultado: atomicidade "coberta" mas nunca verificada — se o 2º statement falhar em produção, o 1º não reverte e ninguém percebeu.

### Causa raiz
Mock de `$transaction` que só invoca o callback com um `tx` fake não tem transação real por baixo — não há BEGIN/ROLLBACK. O teste passa porque o callback roda; mas a garantia que o `$transaction` existe pra dar (reverter o 1º statement quando o 2º falha) é justamente a parte não testada. Falsa confiança.

### Correção
Atomicidade de `$transaction` só é verificável em **e2e contra Postgres real**: forçar a falha do 2º statement (ex: CHECK constraint em runtime no schema e2e, ou FK inválida) e asserir que o efeito do 1º **reverteu** (re-query confirma estado original). Mock de `$transaction` no unit serve só pra fluxo lógico, nunca pra provar rollback.

### Onde aparece tipicamente
- Adapter/repo que escreve em ≥2 statements dentro de `$transaction` (audit + mutação, outbox + update).
- Unit que mocka `prisma.$transaction` como `(cb) => cb(txMock)` e e2e que só checa 200.

### Referências
- Branch: `fix/audit-hardening`

## 2026-06-19 — Migration `git add`-ada faltando: passa no gate local, quebra o e2e de CI

**Área:** prisma migration, CI, gate de cobertura
**Stack tocado:** Prisma migrate (`dev` vs `deploy`), git, GitHub Actions

### Sintoma
`pnpm test:cov` e `test:e2e` ficam verdes no working tree local, mas o e2e quebra na CI com "relation/column does not exist" ou schema divergente. O `schema.prisma` foi editado e a migration existe localmente, mas a pasta `prisma/migrations/<ts>_<nome>/` não entrou no commit.

### Causa raiz
`prisma migrate dev` aplica a migration no banco **local** (working tree) na hora — por isso o gate local passa. Mas a CI roda `migrate deploy` das migrations **versionadas no git**. Se a pasta da migration não foi `git add`-ada, o diff committado não tem o SQL → o schema da CI diverge do que os specs esperam. Local e CI usam fontes de verdade diferentes (banco já-migrado vs migrations versionadas).

### Correção
Ao alterar `schema.prisma`, versionar a migration **junto** no mesmo commit (`git add prisma/migrations/<dir>/`). Conferir `git status` antes de commitar — pasta de migration nova aparece como untracked e é fácil esquecer.

### Onde aparece tipicamente
- Qualquer task que toca `schema.prisma` + gera migration via `migrate dev`.
- PR onde os specs assumem coluna/tabela nova mas a CI não tem a migration versionada.

### Referências
- Branch: `fix/audit-hardening`

## 2026-06-18 — Gate de cobertura do front: `typecheck` é no-op, `coverage.all` é inválido, runs concorrentes corrompem o número

**Área:** test tooling, coverage gate, frontend
**Stack tocado:** Vitest 4, @vitest/coverage-v8, tsc project references, apps/web

### Sintoma
Três armadilhas ao ativar o gate 100% no `apps/web`:
1. `pnpm --filter @apps/web typecheck` (`tsc --noEmit`) passa verde, mas `pnpm --filter @apps/web build` (`tsc -b`) falha com TS errors em arquivos de **spec** (ex: `HTMLElement | undefined` em `getAllByRole(...)[0]`, comparação de overload de `watch`). O erro fica latente — o pre-commit roda `typecheck`, não `build`.
2. `coverage.all: true` em `vitest.config.ts` dá `error TS2769: 'all' does not exist in type 'CoverageOptions'` no `tsc -b` (build), mesmo "funcionando" em runtime.
3. Vários agentes de review rodando `vitest run --coverage` **ao mesmo tempo** reportam números divergentes e falsos (90%/0% em arquivos com spec), enquanto um run isolado dá 100% determinístico.

### Causa raiz
1. `apps/web/tsconfig.json` é um solution file (`{ "files": [], "references": [...] }`). `tsc --noEmit` nele checa o conjunto **vazio** de `files` → não checa nada. O typecheck real é `tsc -b`, que constrói `tsconfig.app.json` (inclui specs) + `tsconfig.node.json`. Só o `build` pega type error de spec.
2. Vitest 4 ignora `coverage.all` em runtime (não é chave válida do tipo), mas o `tsc -b` valida o objeto literal e reprova. A medição de arquivos não-importados vem de `coverage.include: ['src/**/*.{ts,tsx}']` sozinho — `all` é redundante e quebra o build.
3. v8 coverage com workers paralelos compartilha o dir `coverage/` e CPU; runs simultâneos se atropelam → arquivos sem atribuição de cobertura aparecem 0%, total despenca. Não é flakiness do diff.

### Correção
1. Rodar `build` (não só `typecheck`) antes de fechar PR do front — é o único type-check que pega spec. Para `noUncheckedIndexedAccess`, narrar acesso de índice em spec com guard explícito (`const [x] = getAllByRole(...); if (!x) throw new Error(...)`), não `!`.
2. Remover `coverage.all`; manter só `include: ['src/**/*.{ts,tsx}']` para medir arquivos sem spec.
3. Gate verde = **um** run isolado (`pnpm --filter @apps/web test:cov`, exit 0). Se um número vier estranho durante review paralela, re-rodar sozinho antes de culpar o diff (mesma lição do advisory-lock E2E). Proibir vitest concorrente nos agentes de re-review.

### Onde aparece tipicamente
- Toda PR que ativa/edita o gate de cobertura do `apps/web`.
- `apps/web/vitest.config.ts`, `apps/web/tsconfig*.json`, esteira de review com múltiplos agentes.

### Referências
- Task: `.claude/tasks/DONE/2026-06-18-web-coverage-gate.md`
- CI: `.github/workflows/ci.yml` (step "Unit tests + coverage" agora roda api **e** web `test:cov`)

## 2026-06-18 — commit-msg hook do template: subject minúsculo + scope obrigatório; e o erro real fica escondido no fim do output

**Área:** git hooks, husky, commit workflow
**Stack tocado:** `.husky/commit-msg`, `.husky/pre-commit`, RTK/terminal truncation

### Sintoma
Numa leva de commits em cadeia (`git add … && git commit … && …`), o commit falhava com exit 1
e o output mostrava só o `pre-commit` rodando `pnpm test` (que **passava**). Parecia flake de
teste concorrente — re-tentar não resolvia, falhava sempre no mesmo commit. Dois bloqueios
distintos apareceram:
1. `✗ commit-msg inválido: subject deve estar todo em minúsculas` — mensagem com `App`/`PR`
   maiúsculos (`test(web): specs de App…`, `…task PR 4b`).
2. `✗ commit-msg inválido: scope é obrigatório` — `docs: …` sem escopo.

### Causa raiz
- O `commit-msg` hook do template exige **subject 100% minúsculo** E **scope presente**
  (`<type>(<scope>): <subject>`). `feat: x`, `docs: x` ou `test(web): specs de App` reprovam.
- O `pre-commit` roda `lint + typecheck + pnpm test` (suíte inteira, sem coverage) **a cada
  commit** — lento, e o output é enorme. O RTK / o buffer do terminal **truncam o meio**,
  escondendo a linha real do `commit-msg` que vem **no fim**. Isso mascara o bloqueio como se
  fosse falha de teste.

### Correção
- Mensagem: `type(scope): subject` com subject todo minúsculo. Acentos OK (`licoes`/`lições`
  tudo bem); só não pode maiúscula. Nomes próprios viram minúsculo (`App` → `app`, `PR` → `pr`).
- Quando um commit com hook falha e o output vem truncado, **redirecionar pra arquivo**
  (`git commit -m … > /tmp/c.log 2>&1`) e `grep` o arquivo — o erro real está nas últimas linhas.
- Commits em cadeia disparam a suíte N vezes (uma por commit) — caro. Menos commits = menos
  execuções. `.claude/tasks/DONE/*` é gitignored (não tentar `git add` no arquivo de arquivo).

### Onde aparece tipicamente
- Qualquer leva de commits via `commit-composer` neste template.
- `.husky/commit-msg`, `.husky/pre-commit`.

### Referências
- Task: `.claude/tasks/DONE/2026-06-18-web-coverage-gate.md`

## 2026-06-18 — CSP `style-src 'self'` estrito quebra Radix/shadcn e Bull Board (inline styles)

**Área:** segurança, headers, CSP, helmet
**Stack tocado:** Helmet, React/Radix (shadcn), Bull Board

### Sintoma
Endurecer a CSP com `style-src 'self'` (sem `'unsafe-inline'`) quebra componentes Radix/shadcn (Popover, Dialog, Tooltip usam inline styles de posicionamento via Popper) e a UI do Bull Board.

### Causa raiz
Radix UI aplica `style="..."` inline para posicionamento dinâmico; Bull Board também usa inline styles. `style-src 'self'` bloqueia tudo que é inline. A sugestão ingênua ("declare style-src 'self' explícito") quebra a UI.

### Correção
Para apps Radix/shadcn: `style-src 'self' 'unsafe-inline'` (injeção de CSS é risco muito menor que de script). Manter `script-src 'self'` ESTRITO. Ganhos reais de hardening numa CSP de API: `frame-ancestors 'none'` (anti-clickjacking) e `form-action 'self'`, que não quebram nada.

### Onde aparece tipicamente
Task de hardening de CSP em app com design system Radix/Floating-UI ou que sirva HTML de libs (Bull Board, Swagger).

### Referências
- Código: `apps/api/src/infra/main.ts` (helmet contentSecurityPolicy)

## 2026-06-18 — Follow-ups registrados em memória podem já estar resolvidos; verifique o estado real antes de implementar

**Área:** workflow, conductors, hardening
**Stack tocado:** — (processo)

### Sintoma
Task de hardening com 5 follow-ups listados (memória/lessons). Ao implementar às cegas, 3 dos 5 já estavam resolvidos por PRs intermediários: `UnexpectedError` já mapeava 500 (não 400), s3-storage já tinha `assertSafeSegment` + specs, e o "lint projectService" não existia (lint = 0 erros). Implementar os 5 teria duplicado trabalho ou criado churn inútil.

### Causa raiz
Notas de follow-up em memória/lessons refletem o estado de quando foram escritas, não o estado atual do `develop`. PRs subsequentes (ex: PR 3 de hierarquia de erros) fecham itens sem atualizar a nota.

### Correção
Antes de implementar qualquer follow-up, grep/read o código-alvo e confirme que o problema ainda existe. Reportar ao humano quando o escopo real difere do planejado (3 de 5 já feitos → AskUserQuestion pra recalibrar). Padrão de compensação de órfão (better-auth fora da `$transaction` Prisma): `prisma.user.delete` aproveita `onDelete: Cascade` (Session/Account/UserRoleAssignment) — best-effort em try/catch próprio, loga `userId` do órfão se a compensação falhar, preserva o `UnexpectedError` original.

### Onde aparece tipicamente
Início de qualquer task de follow-up/hardening que parte de uma lista pré-escrita de itens.

### Referências
- Task: `.claude/tasks/CURRENT_TASK-rafaolegario.md`
- Código relacionado: `apps/api/src/domain/application/use-cases/users/create-admin-user-use-case.ts:48-61`

## 2026-06-18 — `$queryRaw` com tabela não-qualificada quebra no e2e de schema isolado

**Área:** prisma, testes e2e, performance
**Stack tocado:** Prisma + PrismaPg adapter, Postgres schema-per-run

### Sintoma
Use-case que chama `countUsersWithAnyPermission` retorna 500 só no e2e (passa no unit in-memory). O `$queryRaw` lança "relation does not exist" porque a tabela (`user_role_assignments`) não é encontrada.

### Causa raiz
O setup de e2e cria um schema Postgres único por run (`e2e_<uuid>`) e o adapter `PrismaPg` é instanciado com `{ schema }`. As queries do ORM Prisma são automaticamente schema-qualificadas, mas **SQL cru em `$queryRaw` NÃO é** — depende do `search_path` da conexão, que o adapter não seta para queries raw. A tabela não-qualificada não resolve no schema do teste.

### Correção
Evitar `$queryRaw` quando o ORM resolve. Para "contar entidades distintas que satisfazem um filtro relacional", usar `prisma.<root>.count({ where: { <relação>: { some: ... } } })` — schema-aware, conta o agregado raiz distinto via EXISTS, sem materializar linhas (resolve N+1/materialização sem raw SQL).

### Onde aparece tipicamente
Otimização de `COUNT(DISTINCT)` que parece pedir raw SQL. Antes de cair pro `$queryRaw`, checar se um `count` com filtro relacional do ORM resolve — quase sempre resolve e mantém o isolamento de schema do e2e.

### Referências
- Código: `apps/api/src/infra/database/prisma/repositories/prisma-user-role-assignment-repository.ts` (`countUsersWithAnyPermission`)
- Setup e2e: `apps/api/test/setup-e2e.ts` (schema por run)

## 2026-06-16 — `<button form="id">` (submit fora do `<form>`) passa em jsdom mas quebra em mobile [importada]

**Área:** frontend forms, dialog
**Stack tocado:** React Hook Form, Radix Dialog, jsdom

### Sintoma
Form em dialog "não envia em alguns navegadores" — testado e funcionando no desktop e nos testes (jsdom), mas o submit não dispara no Brave mobile Android (e WebViews). Reportado em projeto derivado com ~10 forms redesenhados.

### Causa raiz
O footer do dialog foi colocado FORA da tag `<form>` e o botão amarrado por `<button form="<form-id>">` (form-associated, HTML5 válido). O jsdom honra esse atributo, então os testes passam. Mas alguns engines mobile não disparam o submit de forma confiável quando o botão vive fora do `<form>`.

### Correção
Botão de submit fica DENTRO da tag `<form>` (incluindo o `DialogFooter`). Se o layout exige o botão fora do form, use `onClick={() => void handleSubmit(onSubmit)()}` em vez de `form="<id>"`. No template, `user-form-dialog.tsx` e `role-editor-dialog.tsx` já seguem o padrão correto (footer dentro do `<form>`).

### Onde aparece tipicamente
Dialog/modal onde o footer é visualmente separado do corpo do form e alguém amarra o submit via `form="<id>"` pra "deixar o markup mais limpo". Teste em jsdom não pega — só reproduz em device real / DevTools mobile.

### Referências
- Regra: `.claude/agents/frontend-engineer.md` (seção Forms + NÃO FAZER)
- Código de referência (correto): `apps/web/src/features/admin/components/users/user-form-dialog.tsx:247`, `apps/web/src/features/admin/components/roles/role-editor-dialog.tsx:291`

## 2026-06-16 — Método de entidade idempotente sem retorno boolean gera audit events duplicados

**Área:** domain entities, audit log
**Stack tocado:** NestJS, Prisma, Either monad

### Sintoma
`reactivate()` é chamado mesmo quando o usuário já está ativo — `auditRepo.create()` é invocado, persistindo evento redundante. Em histórico de auditoria: múltiplos eventos `USER_REACTIVATED` para o mesmo usuário sem ação real entre eles.

### Causa raiz
Método `void` em entidade idempotente (reactivate, deactivate quando já no estado alvo) não sinaliza se houve mudança real. O use-case não tem como distinguir "fez algo" de "estava no estado certo, não fez nada" sem inspecionar o estado antes e depois manualmente.

### Correção
Métodos de mutação idempotente retornam `boolean` (`true` = mudou, `false` = sem-op). Use-case faz early-return `right(null)` se `changed === false`, sem chamar save nem auditRepo.

```ts
// entidade
reactivate(): boolean {
  if (this.isActive) return false
  this.isActive = true
  return true
}

// use-case
const changed = user.reactivate()
if (!changed) return right(null)
await this.userRepo.save(user)
await this.auditRepo.create(...)
return right(null)
```

### Onde aparece tipicamente
- Métodos de toggle/estado em entidades: `activate`, `deactivate`, `reactivate`, `suspend`, `verify`.
- Qualquer use-case que combina mutação de entidade + audit log sem checar se a mutação foi no-op.

### Referências
- Task: `feat/user-admin-hardening` (2026-06-16)

---

## 2026-06-16 — `updateMany` retorna `count: 0` silenciosamente em tabela sem registro correspondente

**Área:** auth admin, better-auth, silent failure
**Stack tocado:** Prisma, better-auth, NestJS

### Sintoma
`PATCH /users/:id/password` retorna 200 OK sem trocar a senha de usuários OAuth-only (sem conta `credential` no banco). Nenhum erro lançado, nenhum log de warning. Em auditoria: senha "trocada" mas login com nova senha falha.

### Causa raiz
`prisma.account.updateMany({ where: { userId, providerId: 'credential' } })` resolve sempre com `{ count: N }`. Se o usuário não tem conta credential (só Google/GitHub), `count = 0` — Prisma não rejeita. O caller não checava o count.

### Correção
```ts
const { count } = await prisma.account.updateMany({
  where: { userId, providerId: 'credential' },
  data: { password: hash },
})
if (count === 0) throw new Error('No credential account found for this user')
```

Traduzir o throw no use-case para `left(new CredentialAccountNotFoundError())`.

### Onde aparece tipicamente
- Qualquer `updateMany`/`upsert` em tabela de auth (`account`, `session`, `verification`) onde a existência do registro é uma precondição, não uma certeza.
- Regra: se `updateMany` falhar silenciosamente significa dado corrompido ou estado inválido → sempre verificar `count`.

### Referências
- Task: `feat/user-admin-hardening` (2026-06-16)
- Descoberto por: `silent-failure-hunter`

---

## 2026-06-16 — Desativação de usuário precisa dos mesmos guards de deleção (lockout permanente)

**Área:** RBAC, user admin, security
**Stack tocado:** NestJS, better-auth, Either monad

### Sintoma
Use-case `deactivate-user` criado com guard `isProtected` mas sem guards de self-deactivation e last-admin. Admin pode desativar a si mesmo ou desativar o último admin — ninguém mais consegue logar para reverter. Lockout permanente do sistema.

### Causa raiz
Desativação parece "reversível" e portanto "mais leve" que deleção. O agente omitiu os guards por não perceber que `isActive=false` bloqueia login via middleware — o efeito prático de lockout é idêntico ao de delete para fins de acesso.

### Correção
Espelhar todos os guards de `delete-user-use-case.ts` em `deactivate-user-use-case.ts`:
1. `if (input.targetUserId === input.actorUserId) return left(new CannotDeactivateSelfError())`
2. `if (user.role === 'ADMIN') { const count = await adminCount(); if (count <= 1) return left(new LastAdminError()) }`

Regra: qualquer operação que impeça login (delete, deactivate, role-downgrade) precisa dos guards de self e last-admin.

### Onde aparece tipicamente
- Novos use-cases de mutação de status de usuário (suspend, ban, archive).
- Ao criar use-case "similar mas mais leve" baseado em delete — revisar se o efeito de acesso é o mesmo.

### Referências
- Task: `feat/user-admin-hardening` (2026-06-16)
- Descoberto por: `security-auditor`
- Código espelho: `apps/api/src/domain/application/use-cases/delete-user-use-case.ts`

---

## 2026-06-16 — `throw` em entidade capturado por `try/catch` no use-case mascara outros erros

**Área:** domain entities, Either monad, layering
**Stack tocado:** NestJS, Either, TypeScript

### Sintoma
Use-case envolve chamada a método de entidade em `try/catch` para converter throw em `left(SomeError)`. Parece correto, mas qualquer outro throw inesperado dentro do bloco (ex: NullPointerError, RangeError) também é capturado e retornado como `left(SomeError)` — diagnóstico errado.

### Causa raiz
CLAUDE.md §3 proíbe throw em domain — use-cases não devem precisar de try/catch para converter erros de entidade. O padrão surge quando `domain-architect` implementa guards de negócio via throw na entidade ao invés de retornar um resultado e deixar o use-case decidir.

### Correção
Entidade expõe o estado como propriedade ou método de consulta (`isProtected`, `canDeactivate()`). Use-case consulta o estado antes de chamar o método:
```ts
// ❌ errado
try { user.deactivate() } catch (e) { return left(new ProtectedUserError()) }

// ✅ correto
if (user.isProtected) return left(new ProtectedUserError())
user.deactivate()
```

Método `deactivate()` vira mutação pura sem guard — guarda vive no use-case.

### Onde aparece tipicamente
- Métodos de entidade que lançam quando precondição de negócio não é satisfeita.
- Use-cases com `try/catch` em volta de chamada de método de entidade (fora do `catch` de infra).
- `type-design-analyzer` e `code-reviewer` devem reprovar qualquer `try/catch` que converta erro de entidade.

### Referências
- Task: `feat/user-admin-hardening` (2026-06-16)
- Descoberto por: `code-reviewer` + `type-design-analyzer`

---

## 2026-06-16 — `baseURL: ''` no api-client quebra prod com front/API em domínios separados

**Área:** frontend config, deploy, CORS/cookies
**Stack tocado:** Vite, axios, better-auth

### Sintoma
Em dev tudo funciona; em produção com front e API em **domínios separados** (ex: `app.foo.com` + `api.foo.com`), TODA chamada (inclusive auth) vai pro próprio domínio do front → 404/erro. O `apps/web/src/env.ts` até valida `VITE_API_BASE_URL`, mas o `api-client.ts` ignorava (`baseURL: ''` hardcoded). Completa a lição de 2026-05-13, que só cobria o caso dev (proxy).

### Causa raiz
`baseURL: ''` faz a request ser relativa ao origin do front. Funciona em dev (proxy do Vite resolve `/api`) e em prod mesmo-domínio (reverse proxy), mas **não existe proxy em prod domínios-separados** → a request nunca chega na API. Env validado mas não consumido = falsa sensação de configuração.

### Correção
`api-client.ts`: `baseURL: import.meta.env.DEV ? '' : env.VITE_API_BASE_URL` (origin sem `/api`; o client já prefixa). Dev mantém `''` (proxy + cookie SameSite=Lax mesmo origin). Prod usa o origin da API. **Domínios separados exigem também** cookie `SameSite=None; Secure` + CORS `credentials: true` com origin explícito no backend (o default do template é `lax`, ok só p/ mesmo domínio). Removido `VITE_AUTH_BASE_URL` (env + `.env.example` + Dockerfile + compose): era validado mas nenhum código consumia — auth passa pelo mesmo `api`.

### Onde aparece tipicamente
- `apps/web/src/lib/api-client.ts`, `apps/web/src/env.ts`, `apps/web/.env.example`.

---

## 2026-06-15 — Cobertura 100% trava: branches fantasma do transform de decorators (Vitest 4 + Oxc)

**Área:** test tooling, coverage gate
**Stack tocado:** Vitest 4, @vitest/coverage-v8, unplugin-swc, Oxc, SWC

### Sintoma
`pnpm test:cov` falha em `branches` (~93%) com todos os testes passando. Cada classe `@Injectable()` com deps no construtor reporta 1 branch descoberto na linha do decorator — arquivo sem nenhum `if`/`?:`/`??` no fonte. Trocar `provider` (v8↔istanbul), `experimentalAstAwareRemapping`, `decoratorMetadata` ou `externalHelpers` no `swc.vite()` não muda NADA o número.

### Causa raiz
1. O transform de decorators injeta ternárias não-fonte: helper `_ts_decorate` (`c < 3 ? target : ...`) e `_ts_metadata("design:paramtypes",[typeof X === "undefined" ? Object : X])`. O braço `: Object` é inalcançável → branch fantasma.
2. **Vitest 4 / Vite 6 usa o transform nativo (Oxc) por padrão.** O `unplugin-swc` seta `esbuild: false` mas NÃO desliga o Oxc → o código medido vem do Oxc e qualquer opção do `swc.vite()` é ignorada (por isso o número não mexia).

### Correção
`vitest.config.mts`: `oxc: false` (SWC vira o único transform) + no `jsc`: `externalHelpers: true` (move os helpers p/ `@swc/helpers`, fora de `src/`). Manter `decoratorMetadata: true` (DI dos specs de controller precisa) + devDep `@swc/helpers`. Cobertura cai 656→609 stmts (helpers saem da medição) e branches batem 100% real. NÃO baixar threshold nem espalhar `/* v8 ignore */`. Limpe `node_modules/.vite` ao testar — o cache mascara o efeito.

### Onde aparece tipicamente
- `apps/api/vitest.config.mts`.

---

## 2026-06-15 — Isolamento de schema E2E: PrismaPg ignora `?schema`/`search_path`, use `{ schema }`

**Área:** test e2e, database
**Stack tocado:** Prisma 7, @prisma/adapter-pg, pg

### Sintoma
Specs E2E falham com `The table 'public.<x>' does not exist`. `migrate deploy` cria as tabelas no schema por-fork (`e2e_<uuid>`), mas o runtime consulta `public` (vazio). `new Pool({ options: '-c search_path="..."' })` não resolve.

### Causa raiz
O driver adapter `PrismaPg` não herda o `search_path` da sessão do Pool nem lê o `?schema` da connection string pras queries geradas — sem qualificação, cai no default `public`.

### Correção
Passar o schema explícito ao adapter: `new PrismaPg(pool, { schema })` (2º arg `PrismaPgOptions`) — qualifica as queries (`"e2e_x"."tabela"`). Aplicar no `test/setup-e2e.ts` E no `prisma.service.ts` (que extrai `?schema` da `DATABASE_URL`). Dispensa `options: -c search_path` no Pool.

### Onde aparece tipicamente
- `apps/api/test/setup-e2e.ts`, `apps/api/src/infra/database/prisma/prisma.service.ts`.

---

## 2026-06-15 — Guards condicionais aninhados exigem teste com `outer=true, inner=false`

**Área:** testes, cobertura de branches, RBAC
**Stack tocado:** Vitest, c8, Either monad

### Sintoma
`pnpm test:cov` retorna 99.63% branches com LCOV apontando `BRDA:N,3,1,0` — branch false de condição interna com count=0. O teste existente cobre o caminho `outer=false` (guard nem entra no bloco) mas não `outer=true, inner=false` (entra, mas não retorna error).

### Causa raiz
Guard com lógica aninhada `if (outer) { if (inner) return left(Error) }` tem três caminhos de branch efetivos: `outer=false` (skip tudo), `outer=true, inner=true` (error path), `outer=true, inner=false` (success path). Teste que só exercita `outer=false` deixa ambos os branches internos descobertos — e pode parecer "OK" na cobertura de linha se o analisador não inspecionar branches individuais.

### Correção
Para `delete-user-use-case.ts` (guard de último admin): adicionar teste onde o target É admin E há múltiplos admins (`isTargetAdmin=true, adminCount=2 > 1`). Isso cobre o branch `inner=false` (deleção prossegue). O caso `inner=true` (último admin) já existia como teste de erro.

Regra: guards aninhados `if (A) { if (B) return }` precisam de pelo menos 3 casos de teste: `A=false`, `A=true B=true`, `A=true B=false`.

### Onde aparece tipicamente
- Use-cases com guards de negócio compostos (último admin, próprio usuário, permissão condicional).
- Qualquer `if (condicaoExterna) { if (condicaoInterna) return left(...) }` — o bloco interno fica invisível se nenhum teste passa por `condicaoExterna=true`.

### Referências
- Task: `feat/users-roles-rbac` (2026-06-15)
- Código relacionado: `apps/api/src/domain/application/use-cases/delete-user-use-case.ts`

---

## 2026-06-15 — `/* c8 ignore next */` não funciona em if-statement standalone com SWC; usar `start/stop`

**Área:** cobertura de testes, Vitest, SWC
**Stack tocado:** Vitest, c8, SWC transpiler

### Sintoma
`pnpm test:cov` retorna 99.83% statements e 99.63% branches mesmo com `/* c8 ignore next */` aplicado na linha defensiva. O comentário está lá, mas c8 ainda reporta a linha como não coberta.

### Causa raiz
SWC (transpiler usado no Vitest) faz shift de line numbers no output transpilado. `/* c8 ignore next */` é baseado em número de linha do source map — quando SWC gera o mapa, o "próximo" referenciado pode não corresponder ao if-statement. O par `start/stop` é baseado em posição de bloco de fonte, não número de linha, e por isso sobrevive ao shift.

A abordagem `/* c8 ignore next */` inline (ex: dentro de `.catch(/* c8 ignore next */ () => {})`) funciona apenas quando o comentário está DENTRO da expressão, não em linha separada acima de um if.

### Correção
Substituir `/* c8 ignore next */` por delimitadores de bloco:
```typescript
/* c8 ignore start */
if (!updatedUser) return left(new UserNotFoundError())
/* c8 ignore stop */
```

Usar esse padrão somente para branches defensivos genuinamente inalcançáveis (ex: re-fetch após update confirmar existência milissegundos antes).

### Onde aparece tipicamente
- If-statements defensivos após operação que já garantiu a existência do recurso.
- Qualquer `/* c8 ignore next */` em linha separada que não está surtindo efeito com SWC.

### Referências
- Task: `feat/users-roles-rbac` (2026-06-15)
- Código relacionado: `apps/api/src/domain/application/use-cases/update-user-use-case.ts`

---

## 2026-06-15 — Infra de audit log wired mas sem call sites: "pronto" não significa "chamado"

**Área:** RBAC, audit log, silent failure
**Stack tocado:** NestJS, Prisma, Either monad

### Sintoma
`actorUserId` é threadado em todos os inputs dos use-cases de mutação, `AuditEventRepository` existe, tem impl Prisma, está wired no `DatabaseModule` e tem spec e2e passando — mas zero use-cases chamam `.create()`. Em produção, investigação de incidente de privilégio encontra tabela de audit vazia.

### Causa raiz
O padrão "injetar repositório e chamar depois" é fácil de adiar. Binding no módulo + presença do campo no input cria falsa segurança: tudo parece wired mas nenhum evento é persistido. O `silent-failure-hunter` detecta porque `actorUserId` só aparecia no check de auto-delete, nunca em `auditRepo.create()`.

### Correção
Cada use-case de mutação que recebe `actorUserId` deve chamar `await this.auditRepo.create(...)` imediatamente após `right(result)` — dentro do use-case, antes do return. Não delegar ao controller nem a um listener de evento. Infra pronta, adicionar os call sites em cada use-case afetado.

### Onde aparece tipicamente
- Use-cases com `actorUserId` no input que não produzem registro de audit.
- `AuditEventRepository` injetado mas nunca invocado (buscar `auditRepo` sem chamada `.create`).
- Qualquer repositório de compliance/observability: se o construtor existe mas `.create()` não aparece em nenhum use-case, o log está mudo.

### Referências
- Descoberto por: `silent-failure-hunter` na esteira de revisão da feature RBAC (2026-06-15)
- Código relacionado: `apps/api/src/domain/application/use-cases/**/*.ts` (buscar `actorUserId` sem `auditRepo.create`)

---

## 2026-06-15 — Use-case que valida mas não executa: contrato Either `right(null)` não honrado

**Área:** RBAC, use-cases, layering, Either monad
**Stack tocado:** NestJS, Prisma, Either

### Sintoma
`DeleteUserUseCase` retorna `right(null)` após validações passarem, mas o registro permanece no banco. A deleção estava no controller, que injetou `UserRepository` diretamente. Testes do use-case passam (validam o `right`), repositório nunca é chamado dentro do use-case.

### Causa raiz
O padrão "use-case valida, controller executa" pode parecer separação de concerns, mas viola o contrato do Either: quem recebe `right(null)` assume que a operação foi concluída com sucesso. Cria janela TOCTOU entre validação e execução. Controladores injetando repositórios viola o layering (`infra/http` não deve conhecer ports de domínio diretamente). O bug é invisível em testes do use-case que não verificam o estado do repo após `right()`.

### Correção
Mover `await this.userRepo.deleteById(input.userId)` para dentro do use-case, antes do `return right(null)`. Remover `UserRepository` do controller. Regra: se o use-case retorna `right(result)`, a operação de domínio deve ter sido executada dentro do use-case — sem exceções.

### Onde aparece tipicamente
- Use-cases de deleção ou cancelamento onde a mutação fica "fora" por parecer simples.
- Controllers que injetam um `*Repository` além do use-case correspondente — sinal de que algo vazou.
- Testes de use-case que só assertam o `isRight()` sem verificar o estado do in-memory repo depois.

### Referências
- Descoberto por: `code-reviewer` + `type-design-analyzer` na esteira de revisão da feature RBAC (2026-06-15)
- Código relacionado: `apps/api/src/domain/application/use-cases/delete-user-use-case.ts`

---

## 2026-05-30 — `@OnEvent` async precisa de `{ async: true, promisify: true }` e `setImmediate` no teste [importada]

**Área:** webhooks, eventos de domínio, testes de integração
**Stack tocado:** `@nestjs/event-emitter`, `NestEventPublisher`, Vitest

### Sintoma
Listener `@OnEvent(EventClass.name)` roda só "às vezes" no teste de integração — estado pós-evento fica no estado anterior. Em produção sob carga, handler async é silenciosamente engolido.

### Causa raiz
`EventEmitter2.emit()` é síncrono no mesmo tick. Se o listener é `async` mas o decorator é só `@OnEvent(EventClass.name)` (sem opções), o emitter ignora a Promise retornada — não espera, não captura rejeição. No teste, mesmo com pattern correto, o handler termina **depois** do `await useCase.execute()`, e a assertion na linha seguinte falha por timing.

### Correção
1. **No decorator:** `@OnEvent(EventClass.name, { async: true, promisify: true })`. `promisify: true` propaga erros; `async: true` roda em microtask separada.
2. **No teste de integração:** drene o microtask queue após disparar:
   ```ts
   await sut.execute(...)
   await new Promise((r) => setImmediate(r))
   expect(state).toBe(...)
   ```
3. **No `NestEventPublisher`:** `emitter.emit(...)` síncrono — quem espera é quem testa.

### Onde aparece tipicamente
Todo subscriber em `application/subscribers/` que faz I/O async. Spec unit chamando `listener.handle(event)` direto não precisa. Spec via `emitter.emit` ou `eventPublisher.publish` precisa do `setImmediate`.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-26)
- Código esperado: `apps/api/src/domain/application/subscribers/*.listener.ts`

---

## 2026-05-30 — `z.enum(ARRAY)` perde literal types sem `as const` [importada]

**Área:** Zod, TypeScript inference, catálogos de enums
**Stack tocado:** Zod 3.x, TypeScript 5.7+

### Sintoma
Constante usada em `z.enum(...)` resulta em `string` no `z.infer`. Exhaustive checks (`switch` com `never`) acusam falso positivo. Runtime aceita qualquer string.

```ts
export const STATUSES = ['ACTIVE', 'INACTIVE']   // ❌ string[]
const schema = z.object({ status: z.enum(STATUSES) })
// z.infer<typeof schema>['status'] === string
```

### Causa raiz
`z.enum` exige `readonly [T, ...T[]]` (tupla não-vazia + literais). Array sem `as const` é só `string[]`.

### Correção
```ts
export const STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type Status = (typeof STATUSES)[number]   // ✅ 'ACTIVE' | 'INACTIVE'
const schema = z.object({ status: z.enum(STATUSES) })   // ✅ união literal
```

### Onde aparece tipicamente
- Catálogos de status / categoria / plano / role.
- `PERMISSIONS`, eventos de domínio, tipos de notificação.
- Validators Zod consumindo esses catálogos.
- Bug **silencioso** — código compila.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-25)

---

## 2026-05-30 — React 19 removeu o namespace global `JSX` [importada]

**Área:** TypeScript build, React 19
**Stack tocado:** React 19, TypeScript 5.7+, Vite

### Sintoma
`pnpm build` (`tsc`) falha em `.tsx`:
```
error TS2503: Cannot find namespace 'JSX'.
function X(): JSX.Element { ... }
```
`vite dev` (esbuild) ignora tipos — bug **silencioso em dev**, só aparece em build/CI.

### Causa raiz
React 19 (`@types/react@19.x`) removeu `namespace JSX` global. Agora vive em `React.JSX`.

### Correção
Ordem de preferência:
1. **Omitir anotação** — TS infere: `function X() { return <div /> }`
2. **`ReactElement`**: `import type { ReactElement } from 'react'; function X(): ReactElement {...}`
3. **`JSX` explícito**: `import type { JSX } from 'react'; function X(): JSX.Element {...}`

❌ NÃO usar `declare global { namespace JSX { ... } }` — só mascara.

### Onde aparece tipicamente
- Code generators / snippets antigos de React 17/18.
- Migração React 18 → 19.
- IDE auto-imports apontando pro namespace removido.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-25)

---

## 2026-05-30 — `setGlobalPrefix('api')` é obrigatório quando Vite proxy forwarda `/api/*` [importada]

**Área:** Nest bootstrap, Vite dev proxy
**Stack tocado:** NestJS, Vite, axios

### Sintoma
Rota protegida faz a árvore inteira sumir — `Outlet` some. Console: `TypeError: Cannot read properties of undefined`. Requisição retornou **HTTP 200 com HTML do Vite** (index.html fallback), então `response.data.data === undefined` e o consumer crasha.

### Causa raiz
Vite proxy forwarda `/api/*` pro backend. Nest registrou controllers em `/users`, `/roles` (sem prefixo). Axios pede `/api/users` → proxy forwarda pra `:3333/api/users` que não existe (só `/users`). `index.html` fallback do Vite vira 200.

better-auth funciona porque tem handler manual `expressApp.all('/api/auth/*', toNodeHandler(auth))`. Controllers Nest precisam de prefixo.

### Correção
1. `apps/api/src/infra/main.ts`: `app.setGlobalPrefix('api')` antes do `app.listen`.
2. Services do front usam paths começando com `/api/`.
3. Handler manual de better-auth continua antes do `app.use(express.json())` — `setGlobalPrefix` não afeta handlers registrados manualmente no `expressApp`.

### Onde aparece tipicamente
- Primeira feature HTTP após setup do template.
- Migração de mock pra API real.
- Sintoma traiçoeiro: 200 OK na rede, crash no consumer.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)
- Código: `apps/api/src/infra/main.ts`, `apps/web/vite.config.ts`

---

## 2026-05-30 — better-auth `customSession` injeta custom fields no top-level [importada]

**Área:** better-auth, session shape
**Stack tocado:** better-auth 1.6, NestJS guards, TanStack Query

### Sintoma
Login passa, cookie setado, mas sidebar mostra só Dashboard mesmo logado como admin. `@RequiresPermission()` retorna 403. `user.permissions === undefined` em guard e front.

### Causa raiz
`customSession(async (...) => ({ user, session, permissions }))` em better-auth 1.6 NÃO funde campos extras dentro de `user` — retorna **no nível raiz** de `getSession()`:
```json
{ "user": {...}, "session": {...}, "permissions": [...] }
```
Consumers que assumem `session.user.permissions` ficam com `undefined` silencioso.

### Correção
**Todo consumer** merge top-level dentro de `user`:

```ts
// Backend AuthGuard:
req.user = { ...session.user, permissions: session.permissions ?? [] }

// Frontend AuthProvider / loader:
const data = await fetchSession()
return { ...data.user, permissions: data.permissions ?? [] }
```

Manter merge consistente nos 3+ pontos (guard, provider, hooks). Drift reintroduz o bug.

### Onde aparece tipicamente
- Qualquer custom field via `customSession()`: `permissions`, `tenantId`, `organizationId`, `featureFlags`, `roles[]`.
- Bug **silencioso** — TS não pega, comportamento é "tudo proibido" em vez de crash.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)
- Código: `apps/api/src/infra/auth/auth.ts`, `apps/api/src/infra/http/guards/auth.guard.ts`, `apps/web/src/providers/auth-provider.tsx`

---

## 2026-05-30 — `tsx <script>.ts` não carrega `.env` automaticamente [importada]

**Área:** scripts utilitários
**Stack tocado:** tsx, dotenv, Prisma

### Sintoma
`pnpm tsx prisma/seed.ts` ou script standalone quebra com `Error: DATABASE_URL is required` mesmo com `.env` presente.

### Causa raiz
`tsx` é só um runner TS — sem hook dotenv como `nest start` (via `ConfigModule`) ou `prisma migrate` (via `prisma.config.ts`).

### Correção
**Primeira linha** do script:
```ts
import 'dotenv/config'
// resto
```

Mesmo padrão em `apps/api/prisma.config.ts`.

### Onde aparece tipicamente
- Seed Prisma (`prisma/seed.ts`).
- Scripts em `scripts/` (`backfill-x.ts`, `reset-y.ts`).
- Qualquer `pnpm tsx ...` que toque env.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)

---

## 2026-05-30 — Vitest unit precisa de `resolve.alias` explícito pra `@test/*` [importada]

**Área:** vitest config, path alias
**Stack tocado:** Vitest, vite-tsconfig-paths

### Sintoma
Specs em `src/**/*.spec.ts` importando `@test/factories/...` falham com `Failed to load url @test/...`.

### Causa raiz
`tsconfig.json` exclui `test/` (`"exclude": ["test"]`). Plugin `vite-tsconfig-paths` respeita o exclude e não expõe o alias.

### Correção
`apps/api/vitest.config.mts`:
```ts
import { fileURLToPath } from 'node:url'

resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@test': fileURLToPath(new URL('./test', import.meta.url)),
  },
},
```

### Onde aparece tipicamente
- Primeira leva de specs após criar in-memory repos / factories.
- Qualquer template que exclui `test/` do tsconfig de produção.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)

---

## 2026-05-30 — better-auth `signUpEmail` não conhece campos customizados não-input [importada]

**Área:** better-auth, RBAC, schema Prisma
**Stack tocado:** better-auth 1.6, Prisma

### Sintoma
Criar User com FK obrigatória (`roleId`, `tenantId`, `orgId`) — `auth.api.signUpEmail()` só aceita `{ name, email, password }`. FK `NOT NULL` quebra signup.

### Causa raiz
better-auth `additionalFields` com `input: false` impede o campo no body público, mas também não permite setar no signup. Campos opcionais no banco viram NULL no insert.

### Correção
1. Schema Prisma: FK **nullable** (`roleId String?`) + entidade tolera `null`.
2. Use-case valida obrigatoriedade **na entrada** (Zod no controller exige; use-case só executa se passou).
3. Fluxo: `signUp(name, email, password)` cria user com FK NULL → `user.changeRoleId(role.id)` → `users.save(user)` (segundo UPDATE). +1 query, aceitável.
4. Seed segue: cria Role primeiro, `signUpEmail`, `prisma.user.update({ roleId })`.

### Onde aparece tipicamente
- Projetos better-auth com FK obrigatória no User (tenant, organização, cargo).

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)

---

## 2026-05-30 — admin-reset-password via `hashPassword` + `prisma.account.update` [importada]

**Área:** auth admin
**Stack tocado:** better-auth 1.6, Prisma

### Sintoma
Admin precisa trocar senha sem saber a atual. better-auth `auth.api.changePassword` exige `currentPassword`. Sem endpoint público pra admin-set-password.

### Correção
```ts
import { hashPassword } from 'better-auth/crypto'

const hash = await hashPassword(newPassword)
await this.prisma.account.updateMany({
  where: { userId, providerId: 'credential' },
  data: { password: hash, updatedAt: new Date() },
})
```

Mesmo algoritmo do signup/signin. Endpoint dedicado (`PATCH /users/:id/password`) — não usar PATCH genérico (evita leak de senha em log + audit/RBAC específicos).

### Onde aparece tipicamente
Painel admin com reset de senha de outro usuário.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)

---

## 2026-05-30 — Catálogo PERMISSIONS mora em `core/auth/`, não em `infra/http/` [importada]

**Área:** RBAC, layering
**Stack tocado:** NestJS, TS layering

### Sintoma
Use-case de domínio precisa validar contra `PERMISSIONS`. Importar `@/infra/http/permissions` viola `domain → core` (nunca `→ infra`). `code-reviewer` reprova.

### Causa raiz
Catálogo inicialmente em `infra/http/permissions.ts` (consumido pelo decorator/guard). Mas validar permissão é regra de domínio.

### Correção
Mover `PERMISSIONS` + `hasAnyPermission` + tipo `Permission` pra `apps/api/src/core/auth/permissions.ts` (puro TS, framework-agnostic). `infra/http/permissions.ts` vira **re-export** pra não quebrar imports HTTP.

Frontend mantém cópia manual em `apps/web/src/lib/permissions.ts` (drift via cópia consciente — sem `packages/shared` por ~13 strings).

### Onde aparece tipicamente
- Qualquer projeto adicionando RBAC.
- Use-case validando algo do catálogo de auth.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-22)
- Estrutura esperada: `apps/api/src/core/auth/permissions.ts` + re-export em `apps/api/src/infra/http/permissions.ts`

---

## 2026-05-30 — Pattern delete+create pra gateways sem PATCH [importada]

**Área:** integração com gateways imutáveis (pagamento, billing)
**Stack tocado:** gateways HTTP, NestJS

### Sintoma
Mudar preço/nome de produto no gateway. Procura `PATCH /products/:id` — **não existe**. Endpoints: create / list / get / delete. Apenas CRD.

### Causa raiz
Decisão do provedor: produto imutável. Mudança = produto novo. Casos conhecidos: AbacatePay (v2/products), Mercado Pago em alguns recursos.

### Correção
**Pattern delete+create** orquestrado por use-case:
1. Buscar config atual; se tem `productId`, chama `gateway.deleteProduct(productId)` — **graceful** (try/catch + log warn, segue): delete fail não bloqueia save.
2. `gateway.createProduct({ ...campos })` → novo ID.
3. Aplicar update + `attachProduct(newId)` + `repository.save()`.
4. Se `createProduct` falhar → `Left(ProductSyncFailedError)` **sem mutar o banco** — banco mantém o ID antigo, próximos checkouts funcionam com o produto velho até admin re-sincronizar.

Documentar como ADR se virar pattern em outros recursos.

### Onde aparece tipicamente
- Gateway de pagamento sem PATCH.
- Migração de pricing dinâmico a partir de produto fixo em `.env`.

### Referências
- Importada de: analise-credito-douglas-marangoni (2026-05-26)

---

## 2026-05-13 — Não introduzir abstrações sem cliente real (Clock, TransactionRunner, etc)

**Área:** arquitetura, escolha de abstrações
**Stack tocado:** NestJS, Prisma, TypeScript

### Sintoma
IA propondo `class Clock { now(): Date { return new Date() } }`, `abstract class TransactionRunner` envolvendo `prisma.$transaction`, `class IdGenerator` envolvendo `randomUUID`. Cada uma exige port + impl + module wireup. Resultado: 3 arquivos novos pra trocar `new Date()` por `clock.now()`.

### Causa raiz
"Clean Architecture purism" — IA assume que TUDO precisa de port. Os projetos de produção do dono (`confeitaria-erp`, `conversai-api`) não fazem isso. Eles usam `new Date()` direto em entidades e use-cases, `prisma.$transaction` direto em repositórios.

### Correção
Regra: só criar port (abstract class) quando há ≥1 razão concreta:
- Múltiplas impls (S3 + R2 + disk → `StorageUploader`).
- Necessidade de mock em teste de domínio que NÃO seja substituível por in-memory repo (ex: `MailProvider`, `AuthProvider`).
- Inversão para isolar dependência externa pesada (better-auth, AWS SDK).

`Date`, `randomUUID`, `prisma.$transaction` não passam nesse filtro. Usar direto.

### Onde aparece tipicamente
- `domain-architect` ou `prisma-architect` propondo "port pra X" quando X é primitivo Node ou call Prisma.
- Pasta `core/` ou `domain/application/` ganhando abstrações sem impl correspondente em `infra/`.

### Referências
- Task: arrumar bugs e estilo do template (2026-05-13)
- Critério positivo: ports `HashGenerator`, `MailProvider`, `StorageUploader`, `AuthProvider` (têm impl única real em infra).
- Critério negativo: `Clock`, `TransactionRunner`, `IdGenerator` (não criar).

---

## 2026-05-13 — Sem `ValidationPipe` global do Nest (use ZodValidationPipe per-endpoint)

**Área:** validação HTTP, pipes
**Stack tocado:** NestJS, Zod

### Sintoma
`app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` no `main.ts`. Crash de boot por `class-validator` faltando (não está nas deps, regra do CLAUDE.md é Zod).

### Causa raiz
ValidationPipe do Nest depende de `class-validator` e `class-transformer`. Os 2 projetos de referência (`confeitaria-erp`, `conversai-api`) usam Zod via `@Body(new ZodValidationPipe(schema))` per-endpoint. Pipe global é redundante.

### Correção
Remover `useGlobalPipes(ValidationPipe)` do `main.ts`. Validar SEMPRE per-route via `ZodValidationPipe`.

### Onde aparece tipicamente
- `api-engineer` ou IA copiando boilerplate genérico de Nest.
- Bootstrap files (`main.ts`).

---

## 2026-05-13 — `ZodValidationPipe` tipa com `ZodTypeAny`, não `ZodSchema<T>`

**Área:** pipes Zod
**Stack tocado:** Zod, NestJS

### Sintoma
Schemas com `.transform()`, `.default()`, `.pipe()` ou `z.preprocess()` (input ≠ output) quebram a tipagem `ZodSchema<T>`. TS2769 na construção do pipe.

### Causa raiz
`ZodSchema<T>` exige input e output iguais. Schemas reais com defaults/coerções têm shapes diferentes.

### Correção
```ts
export class ZodValidationPipe<S extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: S) {}
  transform(value: unknown): z.infer<S> { ... }
}
```

### Onde aparece tipicamente
- Schemas que coerçam `z.coerce.number()`, `.default()`, `.transform()`.
- `infra/http/pipes/zod-validation.pipe.ts`.

---

## 2026-05-13 — Sem comentários narrativos / "o que o código faz"

**Área:** clean code, comentários
**Stack tocado:** geral

### Sintoma
Arquivos abrem com `// Bootstrap. Mantém-se enxuto — config "decisória" mora em modules; aqui só sequência.` ou `// Pipe genérico — recebe schema Zod e valida o payload. Uso: @Body(new ZodValidationPipe(...))`. Nada disso ajuda — naming + estrutura já dizem.

### Causa raiz
IA tende a "explicar" cada arquivo, fingindo de manual. Os projetos de produção do dono têm praticamente ZERO comentários narrativos — só código + naming.

### Correção
Apagar TODO comentário que descreve "o que o arquivo é" ou "como usar". Manter SÓ:
- Workaround técnico não-óbvio (`// session_token bug: cookieCache omite em 1.6.x`).
- TODO acionável com contexto e dono (`// TODO: proteger Bull Board com auth admin antes de prod`).
- Regra de negócio com referência externa (ex: `// HMAC ±5min replay window, Stripe-style`).

### Onde aparece tipicamente
- Cabeçalho de arquivo (primeiras 5-10 linhas).
- Acima de port abstract class (`// Port (abstract) — bla bla bla`).
- Acima de função pública.

---

## 2026-05-13 — Prisma 7: sem `url` no datasource do schema, com `@prisma/adapter-pg`

**Área:** Prisma 7, datasource
**Stack tocado:** Prisma 7, pg, @prisma/adapter-pg

### Sintoma
`The datasource property 'url' is no longer supported in schema files. Move connection URLs for Migrate to prisma.config.ts...`.

### Causa raiz
Prisma 7 removeu `url` do datasource block. Migration vai pra `prisma.config.ts`; runtime vai via driver adapter no `PrismaClient` constructor.

### Correção
1. `schema.prisma`: `datasource db { provider = "postgresql" }` (sem `url`).
2. `prisma.config.ts`: `import 'dotenv/config'; export default defineConfig({ schema, migrations: { path }, datasource: { url: process.env.DATABASE_URL } })`.
3. `PrismaService`:
   ```ts
   const pool = new Pool({ connectionString: process.env.DATABASE_URL })
   super({ adapter: new PrismaPg(pool) })
   ```
4. Deps: `@prisma/adapter-pg`, `pg`, `@types/pg`, `dotenv`.

### Onde aparece tipicamente
- Upgrade de Prisma 6 → 7.
- Novo projeto a partir do template.

---

## 2026-05-13 — `baseUrl` em tsconfig está deprecated (TS 6+)

**Área:** TypeScript config
**Stack tocado:** TypeScript 5.7+

### Sintoma
`Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.` Aparece no LSP/IDE em qualquer arquivo do projeto.

### Causa raiz
Desde TS 4.1, `paths` resolve relativo ao próprio `tsconfig.json` sem precisar de `baseUrl`. TS 6 emite warning; TS 7 vai remover.

### Correção
Remover `"baseUrl": "."` de TODOS os `tsconfig*.json`. Manter `paths` como está — `paths: { "@/*": ["./src/*"] }` continua funcionando.

### Onde aparece tipicamente
- `apps/*/tsconfig.json`, `apps/web/tsconfig.app.json`, `packages/*/tsconfig.json`.

---

## 2026-05-13 — better-auth `cookieCache` quebra `session_token` (1.6.x)

**Área:** auth, cookies
**Stack tocado:** better-auth 1.6

### Sintoma
Login passa, `Set-Cookie: session_data=...` é emitido, mas `getSession()` retorna null em requests subsequentes. `session_token` cookie nunca aparece.

### Causa raiz
`session: { cookieCache: { enabled: true } }` em better-auth 1.6 omite o `session_token` principal e só seta `session_data` (cache 5min). Bug conhecido na versão.

### Correção
Remover bloco `cookieCache` do `createAuth()`. Aceitar o hit extra de DB-query-por-request (mesmo padrão de confeitaria-erp em produção).

### Onde aparece tipicamente
- `infra/auth/auth.ts` → bloco `session`.

---

## 2026-05-13 — Better-auth handler montado com `toNodeHandler`, não fetch proxy custom

**Área:** auth bootstrap, Express
**Stack tocado:** better-auth, Express, NestJS

### Sintoma
Custom handler `expressApp.all('/api/auth/*', async (req, res) => { ... new Request(...) ... JSON.stringify(req.body) ... })` quebra em edge cases (body parser, header arrays, streaming).

### Causa raiz
Reimplementação manual do bridge Express ↔ fetch. Better-auth já fornece `toNodeHandler` que faz isso corretamente.

### Correção
```ts
import { toNodeHandler } from 'better-auth/node'
const expressApp = app.getHttpAdapter().getInstance()
expressApp.all('/api/auth/*', toNodeHandler(auth))
app.use(express.json())  // DEPOIS do handler — better-auth lê o body raw
```

Ordem importa: `express.json()` precisa vir DEPOIS do `toNodeHandler` pra `/api/auth/*` receber body bruto.

### Onde aparece tipicamente
- `infra/main.ts`.

---

## 2026-05-13 — Vite dev: proxy `/api` + `baseURL` relativa (cookies SameSite=Lax)

**Área:** frontend dev, CORS, cookies
**Stack tocado:** Vite, axios, better-auth

### Sintoma
Login no front (`:5173`) emite `Set-Cookie: SameSite=Lax`, mas requests subsequentes pra `:3333` não enviam o cookie → `get-session` retorna null.

### Causa raiz
`SameSite=Lax` só viaja em mesmo origin. `axios baseURL: env.VITE_API_BASE_URL` faz request cross-origin (`:5173 → :3333`); cookie não vai.

### Correção
- `vite.config.ts`: `server.proxy = { '/api': { target: env.VITE_API_BASE_URL, changeOrigin: true } }`
- `api-client.ts`: `baseURL: ''` (passa pelo proxy, mesmo origin)

### Onde aparece tipicamente
- `apps/web/vite.config.ts`, `apps/web/src/lib/api-client.ts`.

> ⚠️ Complemento (2026-06-16): `baseURL: ''` só serve dev/mesmo-domínio. Para prod com front e API em domínios separados, ver a lição de 2026-06-16 — o client usa `import.meta.env.DEV ? '' : env.VITE_API_BASE_URL`.
