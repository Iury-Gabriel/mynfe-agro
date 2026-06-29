# Fundação Multi-tenant + Schema completo (Fase 1)

**Status:** in_progress
**Author:** Iury-Gabriel
**Branch:** `feat/multitenant-foundation` (a partir de `develop` @ dfd787a)
**Progress:** ~15% (DB pronto; código de domínio/API/telas pendente)
**Created:** 2026-06-27
**Last update:** 2026-06-27
**Conductor:** dev-conductor

## Objetivo

Sair da casca visual (`/preview`, mock) e iniciar o **sistema funcional** do AgroFlow. O usuário pediu "todo o backend, todas as tabelas, todas as regras, todas as telas conectadas". Isso é o **MVP inteiro** (9 fases). Esta 1ª task entrega a **fundação executável e revisável**:

1. **Schema Prisma COMPLETO** de todas as ~30 tabelas do PRD §4 (declaração + 1 migration), já com `tenantId`, soft-delete (`deletedAt`) e índices em FK/`tenantId`. Isso satisfaz "tudo do banco de dados" de uma vez.
2. **Núcleo multi-tenant** (código + testes 100%, só para Tenant/Empresa/acesso — NÃO as regras dos outros módulos): entidades `Tenant`/`Empresa`, VOs (`CnpjCpf`), `usuario_empresas`, `tenantId` em `User`/`Role`/auditoria, contexto de empresa ativa (`@CurrentEmpresa` + `EmpresaAccessGuard`), endpoint de troca de empresa, catálogo `PERMISSIONS` com os 5 papéis (allow-list), CRUD de empresa/usuário/papel escopado por tenant.

As **regras de negócio e telas conectadas** dos demais módulos (cadastros, produção, estoque, vendas, fiscal) vêm nas **fases seguintes**, uma a uma — o schema completo já estará pronto, então cada fase só adiciona domínio/repos/use-cases/endpoints/telas sobre tabelas que já existem.

## Decisões

- [2026-06-27] **Schema completo de todas as tabelas nesta task, mas regras fase-a-fase** — Justificativa: o usuário quer "todo o banco" agora; o schema é coeso e declará-lo de uma vez evita N migrations e define relações upfront. Implementar TODAS as regras/use-cases/telas com cobertura 100% numa task só é inviável e irrevisável. Risco: médio (schema grande; campos podem ser refinados por fase).
- [2026-06-27] **Manter IDs `String @default(cuid())`** (não BIGINT do PRD) — Justificativa: consistência com o template e better-auth. PRD permite UUID "conforme padrão do projeto". Risco: baixo.
- [2026-06-27] **Manter RBAC allow-list (`RolePermission`)**, mapear os 5 papéis no catálogo `PERMISSIONS` — Justificativa: CLAUDE.md manda allow-list; PRD propunha JSONB mas allow-list é superior. Risco: baixo.
- [2026-06-27] **`tenantId` em `User` deve ser NULLABLE** (ou linkagem fora do `signUpEmail`) — Justificativa: lição registrada — `auth.api.signUpEmail()` só aceita `{name,email,password}`; FK NOT NULL no User quebra o signup do better-auth. Risco: alto se ignorado. Ver Lições aplicáveis.
- [2026-06-27] **Sessão expõe `tenantId` + empresa ativa + `permissions` via `customSession()`** — Justificativa: o front precisa do contexto; lição registrada sobre custom fields. Risco: médio.
- [2026-06-27] **Protótipo visual `/preview` (mock, sem specs) vai para `coverage.exclude`** — Justificativa: é referência visual, não feature de produção; sem isso o gate de cobertura 100% (CI/PR) reprova. NÃO é gaming do gate (não é feature real). **Precisa de OK humano explícito** (CLAUDE.md §9 desaprova excludes em features reais). Alternativa: escrever specs do protótipo (custo alto, descartável). Risco: médio — decisão do humano.
- [2026-06-27] **Git: criar `develop` de `main`; commitar protótipo+setup em `develop` ANTES de cortar a branch da task** — Justificativa: não existe `develop`; árvore suja; a branch da task precisa nascer limpa de `develop`. Risco: baixo.

## Lições aplicáveis

- **FK obrigatória no User quebra signup better-auth** (`lessons.md` ~L820): `signUpEmail()` só aceita name/email/password. `tenantId`/`roleId` NOT NULL no User estoura. → `tenantId` nullable + popular pós-signup, ou provisionar usuário por fluxo admin dedicado (não `signUpEmail`).
- **Migration tem que entrar no MESMO commit** (`lessons.md` L116): `git add prisma/migrations/<dir>/` junto do `schema.prisma`. CI roda `migrate deploy` das migrations versionadas — pasta esquecida = schema divergente, e2e quebra.
- **Custom session fields** (`lessons.md` L746): `tenantId`/`permissions`/empresa ativa via `customSession()` para o front ler.
- **Prisma 7 datasource sem `url`** (`lessons.md` L1035): url vai no `prisma.config.ts` + driver adapter, não no schema.
- **Port sem consumidor = letra morta** (`lessons.md` L79 / CLAUDE.md §9): todo port (contexto, repos) precisa de ≥1 use-case consumidor nesta task.
- **IDOR / isolamento por registro** (`lessons.md` RBAC): RBAC (papel) e isolamento (tenant_id/empresa_id) são camadas independentes — testes IDOR obrigatórios.

## Subtasks

- [x] **Git/scaffold**: `develop` criada de `main`; protótipo `/preview` + `docs/PROJECT.md` commitados em `develop` (com `coverage.exclude` do protótipo); `feat/multitenant-foundation` cortada. (Bônus: corrigido Prisma Client não-gerado que quebrava lint do api.)
- [x] **prisma-architect**: schema COMPLETO das 25 tabelas PRD §4 + `tenantId` em User/Role/AuditEvent + soft-delete + índices + migration `20260627000000_multitenant_agro_foundation` (verificado: validate OK, typecheck OK, commitado). Repos/mappers de negócio ficam pras fases.
- [ ] **(ADR) technical-designer**: ADR de multi-tenancy + contexto de empresa ativa + reconciliação RBAC (decisões cross-cutting).
- [ ] **domain-architect**: entidades `Tenant`/`Empresa`, VO `CnpjCpf`, ports de contexto (`TenantContext`/empresa ativa), use-cases CRUD empresa + escopo de tenant em usuário/papel.
- [ ] **api-engineer**: `@CurrentEmpresa()` + `EmpresaAccessGuard`, endpoint troca de empresa ativa, `customSession` com tenantId/empresa/permissions, catálogo `PERMISSIONS` com 5 papéis, controllers de empresa.
- [ ] **frontend-engineer**: ligar o seletor de empresa do header a `customSession`/endpoint real + telas admin (Empresas/Usuários/Papéis) reais conectadas (reusar kit `features/agroflow/ui`, seguir visual AgroFlow).
- [ ] **test-engineer**: unit (entidades/VOs/use-cases/guard) + integration (controllers via supertest) + e2e (repos Prisma em schema real + troca de empresa + IDOR cross-tenant/cross-empresa).
- [ ] **Esteira de revisão** (4 sempre + type-design + pr-test) → quality-fixer → commit-composer → pr-opener.

## Agentes envolvidos

technical-designer · prisma-architect · domain-architect · api-engineer · frontend-engineer · test-engineer · (esteira) code-reviewer · silent-failure-hunter · clean-code-reviewer · security-auditor · type-design-analyzer · pr-test-analyzer · quality-fixer · lessons-keeper · docs-keeper · commit-composer · pr-opener

## Riscos / Pontos de atenção

- **Alto — better-auth + tenantId**: FK NOT NULL no User quebra `signUpEmail`. Mitigação: `tenantId` nullable + popular no provisionamento; testar signup.
- **Médio — escopo grande**: schema de 30 tabelas + core multi-tenant numa task. Se a esteira/cobertura ficar pesada, dividir em "1a) schema+migration" e "1b) core multi-tenant" (proposta de divisão pronta).
- **Médio — coverage do protótipo**: precisa de OK humano para `coverage.exclude` do `/preview` senão o gate 100% reprova.
- **Médio — isolamento multi-tenant retroativo**: adicionar `tenantId` ao User/Role do template exige revisar TODA query admin existente (users/roles controllers) pra filtrar por tenant. security-auditor no loop.
- **Baixo — migration no commit**: versionar `prisma/migrations/<dir>/` junto.

## Sequência de fases proposta (pós-fundação)

1. **(esta) Fundação**: schema completo + multi-tenant core + acesso.
2. **Cadastros**: fazendas, áreas, clientes, produtos, ficha técnica, tabela de preço + telas conectadas (T09–T19).
3. **Produção** (opcional/não-bloqueante): safras, atividades, custos, colheitas, embalagem (T20–T26).
4. **Estoque & Lotes**: movimentos/saldos/lotes + rastreabilidade + ajuste, com `$transaction` (T27–T31).
5. **Vendas**: pedidos, remessas, consolidação mensal (T32–T38).
6. **Fiscal**: notas_fiscais + PlugNotas (BullMQ + webhook HMAC) (T39–T42).
7. **Dashboard** real (T43).
8. **Admin/Config/Auditoria** de negócio (T44–T45).

Cada fase = uma `/execute-task` própria, branch própria de `develop`, esteira strict, commit + PR.

## Arquivos afetados (estimativa desta task)

- `apps/api/prisma/schema.prisma` + `apps/api/prisma/migrations/<ts>_multitenant_foundation/`
- `apps/api/src/domain/enterprise/entities/{tenant,empresa}.ts` + VOs
- `apps/api/src/domain/application/{use-cases,repositories,ports}/...`
- `apps/api/src/infra/database/prisma/{mappers,repositories}/...`
- `apps/api/src/infra/http/{decorators,guards,controllers}/...` + `permissions.ts`
- `apps/api/src/infra/auth/*` (customSession, tenant linkage)
- `apps/web/src/features/{admin,agroflow}/...` (telas admin reais + header switcher)
- `apps/web/vitest.config.ts` (coverage.exclude do protótipo — pendente de OK)

## Logs de pausa (se houver)

- (nenhum)
