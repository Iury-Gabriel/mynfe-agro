-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "audit_events" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "labelArea" TEXT NOT NULL DEFAULT 'Talhão',
    "diaCorteConsolidacao" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpjCpf" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "ieProdutorRural" TEXT,
    "inscricaoMunicipal" TEXT,
    "regimeTributario" TEXT NOT NULL,
    "crt" TEXT NOT NULL,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoComplemento" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCep" TEXT,
    "enderecoMunicipio" TEXT,
    "codMunicipioIbge" TEXT,
    "uf" TEXT,
    "pais" TEXT DEFAULT 'Brasil',
    "emailFiscal" TEXT,
    "telefone" TEXT,
    "ambienteFiscal" TEXT NOT NULL DEFAULT 'homologacao',
    "serieNfe" TEXT,
    "proximaNumeracaoNfe" BIGINT NOT NULL DEFAULT 1,
    "plugnotasConfig" JSONB,
    "certificadoRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_empresas" (
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_empresas_pkey" PRIMARY KEY ("userId","empresaId")
);

-- CreateTable
CREATE TABLE "fazendas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCep" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "car" TEXT,
    "nirfIncra" TEXT,
    "areaTotalHa" DECIMAL(15,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fazendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "tamanho" DECIMAL(15,3),
    "unidadeTamanho" TEXT,
    "rotulo" TEXT,
    "geometria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safras" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "cultura" TEXT NOT NULL,
    "variedade" TEXT,
    "dataPlantio" DATE,
    "dataColheitaPrevista" DATE,
    "dataColheitaRealizada" DATE,
    "estimativaProducao" DECIMAL(15,3),
    "status" TEXT NOT NULL DEFAULT 'planejado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "safras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_campo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "safraId" TEXT,
    "areaId" TEXT,
    "tipo" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "responsavelUsuarioId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "atividades_campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custos_producao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "safraId" TEXT,
    "areaId" TEXT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "data" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "custos_producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "precoPadrao" DECIMAL(15,2),
    "ncm" TEXT,
    "cest" TEXT,
    "cfopPadrao" TEXT,
    "origemMercadoria" TEXT,
    "cstCsosn" TEXT,
    "aliquotas" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_ficha_tecnica" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "descricaoComponente" TEXT NOT NULL,
    "quantidadeReferencia" DECIMAL(15,3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "produto_ficha_tecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "razaoSocialNome" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "indicadorIe" TEXT NOT NULL,
    "contribuinteIcms" BOOLEAN NOT NULL DEFAULT false,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCep" TEXT,
    "municipio" TEXT,
    "codMunicipioIbge" TEXT,
    "uf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "vendedorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_enderecos_entrega" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCep" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cliente_enderecos_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabela_preco_cliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "preco" DECIMAL(15,2) NOT NULL,
    "vigenciaInicio" DATE,
    "vigenciaFim" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tabela_preco_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colheitas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "safraId" TEXT,
    "areaId" TEXT,
    "quantidade" DECIMAL(15,3) NOT NULL,
    "data" DATE NOT NULL,
    "responsavelUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "colheitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "codigoLote" TEXT NOT NULL,
    "origemTipo" TEXT,
    "colheitaId" TEXT,
    "areaId" TEXT,
    "quantidadeInicial" DECIMAL(15,3) NOT NULL,
    "quantidadeAtual" DECIMAL(15,3) NOT NULL,
    "validade" DATE,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_movimentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "loteId" TEXT,
    "tipo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "referenciaId" TEXT,
    "quantidade" DECIMAL(15,3) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "estoque_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_saldos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidadeDisponivel" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "quantidadeReservada" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_saldos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaFaturadoraId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "valorTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "periodoConsolidacao" DATE,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_itens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidade" DECIMAL(15,3) NOT NULL,
    "precoUnitario" DECIMAL(15,2) NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remessas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaFaturadoraId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "pedidoConsolidadoId" TEXT,
    "valorEstimado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "remessas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remessa_itens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "remessaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidade" DECIMAL(15,3) NOT NULL,
    "precoUnitario" DECIMAL(15,2) NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "remessa_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresaEmitenteId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT,
    "serie" TEXT,
    "modelo" TEXT NOT NULL DEFAULT '55',
    "naturezaOperacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "chaveAcesso" TEXT,
    "protocolo" TEXT,
    "valorTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ambiente" TEXT NOT NULL DEFAULT 'homologacao',
    "plugnotasId" TEXT,
    "xmlUrl" TEXT,
    "danfeUrl" TEXT,
    "mensagemRetorno" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_fiscal_itens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT,
    "cstCsosn" TEXT,
    "quantidade" DECIMAL(15,3) NOT NULL,
    "valorUnitario" DECIMAL(15,2) NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "impostos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nota_fiscal_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_fiscal_eventos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_fiscal_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empresas_tenantId_idx" ON "empresas"("tenantId");

-- CreateIndex
CREATE INDEX "empresas_cnpjCpf_idx" ON "empresas"("cnpjCpf");

-- CreateIndex
CREATE INDEX "usuario_empresas_userId_idx" ON "usuario_empresas"("userId");

-- CreateIndex
CREATE INDEX "usuario_empresas_empresaId_idx" ON "usuario_empresas"("empresaId");

-- CreateIndex
CREATE INDEX "fazendas_tenantId_idx" ON "fazendas"("tenantId");

-- CreateIndex
CREATE INDEX "fazendas_empresaId_idx" ON "fazendas"("empresaId");

-- CreateIndex
CREATE INDEX "areas_tenantId_idx" ON "areas"("tenantId");

-- CreateIndex
CREATE INDEX "areas_fazendaId_idx" ON "areas"("fazendaId");

-- CreateIndex
CREATE INDEX "safras_tenantId_idx" ON "safras"("tenantId");

-- CreateIndex
CREATE INDEX "safras_areaId_idx" ON "safras"("areaId");

-- CreateIndex
CREATE INDEX "atividades_campo_tenantId_idx" ON "atividades_campo"("tenantId");

-- CreateIndex
CREATE INDEX "atividades_campo_safraId_idx" ON "atividades_campo"("safraId");

-- CreateIndex
CREATE INDEX "atividades_campo_areaId_idx" ON "atividades_campo"("areaId");

-- CreateIndex
CREATE INDEX "custos_producao_tenantId_idx" ON "custos_producao"("tenantId");

-- CreateIndex
CREATE INDEX "custos_producao_safraId_idx" ON "custos_producao"("safraId");

-- CreateIndex
CREATE INDEX "custos_producao_areaId_idx" ON "custos_producao"("areaId");

-- CreateIndex
CREATE INDEX "produtos_tenantId_idx" ON "produtos"("tenantId");

-- CreateIndex
CREATE INDEX "produtos_empresaId_idx" ON "produtos"("empresaId");

-- CreateIndex
CREATE INDEX "produto_ficha_tecnica_tenantId_idx" ON "produto_ficha_tecnica"("tenantId");

-- CreateIndex
CREATE INDEX "produto_ficha_tecnica_produtoId_idx" ON "produto_ficha_tecnica"("produtoId");

-- CreateIndex
CREATE INDEX "clientes_tenantId_idx" ON "clientes"("tenantId");

-- CreateIndex
CREATE INDEX "clientes_cnpjCpf_idx" ON "clientes"("cnpjCpf");

-- CreateIndex
CREATE INDEX "clientes_vendedorUsuarioId_idx" ON "clientes"("vendedorUsuarioId");

-- CreateIndex
CREATE INDEX "cliente_enderecos_entrega_tenantId_idx" ON "cliente_enderecos_entrega"("tenantId");

-- CreateIndex
CREATE INDEX "cliente_enderecos_entrega_clienteId_idx" ON "cliente_enderecos_entrega"("clienteId");

-- CreateIndex
CREATE INDEX "tabela_preco_cliente_tenantId_idx" ON "tabela_preco_cliente"("tenantId");

-- CreateIndex
CREATE INDEX "tabela_preco_cliente_clienteId_idx" ON "tabela_preco_cliente"("clienteId");

-- CreateIndex
CREATE INDEX "tabela_preco_cliente_produtoId_idx" ON "tabela_preco_cliente"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "tabela_preco_cliente_clienteId_produtoId_vigenciaInicio_key" ON "tabela_preco_cliente"("clienteId", "produtoId", "vigenciaInicio");

-- CreateIndex
CREATE INDEX "colheitas_tenantId_idx" ON "colheitas"("tenantId");

-- CreateIndex
CREATE INDEX "colheitas_empresaId_idx" ON "colheitas"("empresaId");

-- CreateIndex
CREATE INDEX "colheitas_produtoId_idx" ON "colheitas"("produtoId");

-- CreateIndex
CREATE INDEX "colheitas_safraId_idx" ON "colheitas"("safraId");

-- CreateIndex
CREATE INDEX "colheitas_areaId_idx" ON "colheitas"("areaId");

-- CreateIndex
CREATE INDEX "lotes_tenantId_idx" ON "lotes"("tenantId");

-- CreateIndex
CREATE INDEX "lotes_empresaId_idx" ON "lotes"("empresaId");

-- CreateIndex
CREATE INDEX "lotes_produtoId_idx" ON "lotes"("produtoId");

-- CreateIndex
CREATE INDEX "lotes_colheitaId_idx" ON "lotes"("colheitaId");

-- CreateIndex
CREATE INDEX "lotes_areaId_idx" ON "lotes"("areaId");

-- CreateIndex
CREATE INDEX "estoque_movimentos_tenantId_idx" ON "estoque_movimentos"("tenantId");

-- CreateIndex
CREATE INDEX "estoque_movimentos_empresaId_idx" ON "estoque_movimentos"("empresaId");

-- CreateIndex
CREATE INDEX "estoque_movimentos_produtoId_idx" ON "estoque_movimentos"("produtoId");

-- CreateIndex
CREATE INDEX "estoque_movimentos_loteId_idx" ON "estoque_movimentos"("loteId");

-- CreateIndex
CREATE INDEX "estoque_saldos_tenantId_idx" ON "estoque_saldos"("tenantId");

-- CreateIndex
CREATE INDEX "estoque_saldos_empresaId_idx" ON "estoque_saldos"("empresaId");

-- CreateIndex
CREATE INDEX "estoque_saldos_produtoId_idx" ON "estoque_saldos"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_saldos_empresaId_produtoId_loteId_key" ON "estoque_saldos"("empresaId", "produtoId", "loteId");

-- CreateIndex
CREATE INDEX "pedidos_tenantId_idx" ON "pedidos"("tenantId");

-- CreateIndex
CREATE INDEX "pedidos_empresaFaturadoraId_idx" ON "pedidos"("empresaFaturadoraId");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedido_itens_tenantId_idx" ON "pedido_itens"("tenantId");

-- CreateIndex
CREATE INDEX "pedido_itens_pedidoId_idx" ON "pedido_itens"("pedidoId");

-- CreateIndex
CREATE INDEX "pedido_itens_produtoId_idx" ON "pedido_itens"("produtoId");

-- CreateIndex
CREATE INDEX "pedido_itens_loteId_idx" ON "pedido_itens"("loteId");

-- CreateIndex
CREATE INDEX "remessas_tenantId_idx" ON "remessas"("tenantId");

-- CreateIndex
CREATE INDEX "remessas_empresaFaturadoraId_idx" ON "remessas"("empresaFaturadoraId");

-- CreateIndex
CREATE INDEX "remessas_clienteId_idx" ON "remessas"("clienteId");

-- CreateIndex
CREATE INDEX "remessas_pedidoConsolidadoId_idx" ON "remessas"("pedidoConsolidadoId");

-- CreateIndex
CREATE INDEX "remessa_itens_tenantId_idx" ON "remessa_itens"("tenantId");

-- CreateIndex
CREATE INDEX "remessa_itens_remessaId_idx" ON "remessa_itens"("remessaId");

-- CreateIndex
CREATE INDEX "remessa_itens_produtoId_idx" ON "remessa_itens"("produtoId");

-- CreateIndex
CREATE INDEX "remessa_itens_loteId_idx" ON "remessa_itens"("loteId");

-- CreateIndex
CREATE INDEX "notas_fiscais_tenantId_idx" ON "notas_fiscais"("tenantId");

-- CreateIndex
CREATE INDEX "notas_fiscais_empresaEmitenteId_idx" ON "notas_fiscais"("empresaEmitenteId");

-- CreateIndex
CREATE INDEX "notas_fiscais_pedidoId_idx" ON "notas_fiscais"("pedidoId");

-- CreateIndex
CREATE INDEX "notas_fiscais_clienteId_idx" ON "notas_fiscais"("clienteId");

-- CreateIndex
CREATE INDEX "nota_fiscal_itens_tenantId_idx" ON "nota_fiscal_itens"("tenantId");

-- CreateIndex
CREATE INDEX "nota_fiscal_itens_notaFiscalId_idx" ON "nota_fiscal_itens"("notaFiscalId");

-- CreateIndex
CREATE INDEX "nota_fiscal_itens_produtoId_idx" ON "nota_fiscal_itens"("produtoId");

-- CreateIndex
CREATE INDEX "nota_fiscal_eventos_tenantId_idx" ON "nota_fiscal_eventos"("tenantId");

-- CreateIndex
CREATE INDEX "nota_fiscal_eventos_notaFiscalId_idx" ON "nota_fiscal_eventos"("notaFiscalId");

-- CreateIndex
CREATE INDEX "auditoria_logs_tenantId_data_idx" ON "auditoria_logs"("tenantId", "data");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuarioId_idx" ON "auditoria_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_logs_entidade_entidadeId_idx" ON "auditoria_logs"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE INDEX "audit_events_tenantId_idx" ON "audit_events"("tenantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_empresas" ADD CONSTRAINT "usuario_empresas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_empresas" ADD CONSTRAINT "usuario_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fazendas" ADD CONSTRAINT "fazendas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fazendas" ADD CONSTRAINT "fazendas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safras" ADD CONSTRAINT "safras_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safras" ADD CONSTRAINT "safras_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_campo" ADD CONSTRAINT "atividades_campo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_campo" ADD CONSTRAINT "atividades_campo_safraId_fkey" FOREIGN KEY ("safraId") REFERENCES "safras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_campo" ADD CONSTRAINT "atividades_campo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos_producao" ADD CONSTRAINT "custos_producao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos_producao" ADD CONSTRAINT "custos_producao_safraId_fkey" FOREIGN KEY ("safraId") REFERENCES "safras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos_producao" ADD CONSTRAINT "custos_producao_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_ficha_tecnica" ADD CONSTRAINT "produto_ficha_tecnica_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_ficha_tecnica" ADD CONSTRAINT "produto_ficha_tecnica_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_enderecos_entrega" ADD CONSTRAINT "cliente_enderecos_entrega_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_enderecos_entrega" ADD CONSTRAINT "cliente_enderecos_entrega_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabela_preco_cliente" ADD CONSTRAINT "tabela_preco_cliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabela_preco_cliente" ADD CONSTRAINT "tabela_preco_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabela_preco_cliente" ADD CONSTRAINT "tabela_preco_cliente_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_safraId_fkey" FOREIGN KEY ("safraId") REFERENCES "safras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheitas" ADD CONSTRAINT "colheitas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_colheitaId_fkey" FOREIGN KEY ("colheitaId") REFERENCES "colheitas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_saldos" ADD CONSTRAINT "estoque_saldos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_saldos" ADD CONSTRAINT "estoque_saldos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_saldos" ADD CONSTRAINT "estoque_saldos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_saldos" ADD CONSTRAINT "estoque_saldos_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empresaFaturadoraId_fkey" FOREIGN KEY ("empresaFaturadoraId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_empresaFaturadoraId_fkey" FOREIGN KEY ("empresaFaturadoraId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_pedidoConsolidadoId_fkey" FOREIGN KEY ("pedidoConsolidadoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessa_itens" ADD CONSTRAINT "remessa_itens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessa_itens" ADD CONSTRAINT "remessa_itens_remessaId_fkey" FOREIGN KEY ("remessaId") REFERENCES "remessas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessa_itens" ADD CONSTRAINT "remessa_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessa_itens" ADD CONSTRAINT "remessa_itens_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresaEmitenteId_fkey" FOREIGN KEY ("empresaEmitenteId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_eventos" ADD CONSTRAINT "nota_fiscal_eventos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_eventos" ADD CONSTRAINT "nota_fiscal_eventos_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

