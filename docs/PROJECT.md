# Configuração do Projeto

> Gerado pelo /setup. Atualize conforme o projeto evolui.
> Lido automaticamente pelos condutores antes de cada task.

## Contexto

- **Domínio:** Gestão (ERP / CRM / RH) — ERP agro (AgroFlow): cultivo → colheita → estoque/lotes → vendas → fiscal (DANFE)
- **Tipo:** SaaS / produto — multi-tenant, usuários externos (produtor rural / grupo empresarial)

## Funcionalidades habilitadas

### Auth UI

| Fluxo | Habilitado |
|---|---|
| Página de login | Sim |
| Esqueci minha senha | Sim |
| Reset de senha (link por email) | Sim |
| Cadastro público (sign-up) | Não |

> Usuários são provisionados pelo tenant/admin (PRD T07 — "Cadastro/Edição de Usuário"), não há auto-cadastro público. Login com email/senha + recuperação/reset por email habilitados (PRD T01/T02). Seleção de tenant/empresa ativa faz parte do fluxo de login (T01/T03).

### Email transacional

| Tipo de email | Habilitado |
|---|---|
| Boas-vindas ao criar conta | Sim |
| Reset de senha | Sim |
| Notificações do sistema | Não |

> Email de reset (T02) é necessário. Boas-vindas ao provisionar usuário. Notificações do sistema ficam fora do MVP.

### Outras funcionalidades

| Funcionalidade | Habilitado |
|---|---|
| Upload de arquivos | Não |
| Frontend (`apps/web/`) | Sim |

> Certificado digital é referência (`certificado_ref`); XML/DANFE são URLs retornadas pelo PlugNotas (`xml_url`/`danfe_url`). Nenhum upload de arquivo pelo usuário no escopo do MVP.

## Integração ClickUp (gerência de tasks)

| Config | Valor |
|---|---|
| Habilitado | Não |
| List ID | — |
| Nome da list | — |
| Prefixo de task | — |

> ClickUp não habilitado. Usar o workflow local de tasks (`.claude/tasks/` + `/execute-task`).

## Guia para condutores

SaaS multi-tenant agro (AgroFlow) para produtor rural e grupos empresariais (1+ CNPJs por tenant). Escopo completo do PRD: Autenticação & Multi-tenant, Cadastros Gerais, Cultivo & Safra (opcional), Colheita & Pós-colheita, Estoque & Lotes com rastreabilidade, Marketplace/Vendas (pedidos/remessas/consolidação mensal), Faturamento & Fiscal (DANFE via PlugNotas/TecnoSpeed), Dashboard e Administração. Multi-tenancy (`tenant_id` em toda tabela) e escopo por empresa/CNPJ (`empresa_id` em estoque/catálogo/numeração fiscal) são fundação obrigatória — ver roadmap em 9 fases. RBAC allow-list (papéis: Administrador, Gestor, Operador de Campo, Vendedor, Faturista). Login + esqueci-senha + reset habilitados; **sem** cadastro público (usuários provisionados pelo tenant). Email de boas-vindas e reset habilitados; sem notificações no MVP. Sem upload de arquivos. Identidade visual: tema dark verde "AgroFlow" (protótipo em `/preview`) — toda tela deve seguir esse visual. Integração fiscal externa (PlugNotas) é o módulo mais complexo, fica por último.

## Arquivos de template não utilizados neste projeto

Nenhum. O projeto usa auth UI (login/esqueci/reset), email transacional (boas-vindas/reset) e mantém o frontend. Storage (`disk-storage`/`s3-storage`) permanece pois pode ser necessário em evolução pós-MVP (anexos/certificado). Nada a remover.
