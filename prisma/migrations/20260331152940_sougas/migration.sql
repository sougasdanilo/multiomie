-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "app_key" TEXT NOT NULL,
    "app_secret" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "configuracoes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "endereco" JSONB,
    "ie" TEXT,
    "im" TEXT,
    "tipo_contribuinte" TEXT DEFAULT '9',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_empresa" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo_omie" TEXT NOT NULL,
    "sync_status" TEXT NOT NULL DEFAULT 'PENDING',
    "last_sync" TIMESTAMP(3),
    "sync_error" TEXT,
    "dados_customizados" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "descricao_complementar" TEXT,
    "ncm" TEXT NOT NULL,
    "cest" TEXT,
    "cfop" TEXT,
    "unidade" TEXT NOT NULL,
    "preco_base" DECIMAL(15,2),
    "tipo" TEXT NOT NULL DEFAULT 'PRODUTO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_empresa" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo_omie" TEXT NOT NULL,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 0,
    "estoque_atual" INTEGER NOT NULL DEFAULT 0,
    "estoque_reservado" INTEGER NOT NULL DEFAULT 0,
    "ultima_consulta" TIMESTAMP(3),
    "preco_venda" DECIMAL(15,2),
    "config_fiscal" JSONB,
    "dados_omie" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "substatus" TEXT,
    "valor_produtos" DECIMAL(15,2) NOT NULL,
    "valor_desconto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valor_frete" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(15,2) NOT NULL,
    "endereco_entrega" JSONB,
    "data_previsao" TIMESTAMP(3),
    "forma_pagamento" TEXT,
    "condicao_pagamento" TEXT,
    "observacoes" TEXT,
    "observacao_interna" TEXT,
    "usuario_id" TEXT,
    "processado_at" TIMESTAMP(3),
    "faturado_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_itens" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "quantidade" DECIMAL(15,3) NOT NULL,
    "preco_unitario" DECIMAL(15,4) NOT NULL,
    "valor_total" DECIMAL(15,2) NOT NULL,
    "percentual_desconto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "valor_desconto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sequencia" INTEGER NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_empresa" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo_pedido_omie" TEXT,
    "numero_pedido_omie" TEXT,
    "status_omie" TEXT,
    "valor_itens" DECIMAL(15,2),
    "valor_total" DECIMAL(15,2),
    "resposta_omie" JSONB,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimo_erro" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedido_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT NOT NULL DEFAULT '1',
    "chave_acesso" TEXT NOT NULL,
    "protocolo" TEXT,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_saida" TIMESTAMP(3),
    "valor_produtos" DECIMAL(15,2) NOT NULL,
    "valor_desconto" DECIMAL(15,2) NOT NULL,
    "valor_total" DECIMAL(15,2) NOT NULL,
    "xml_url" TEXT,
    "pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EMITIDA',
    "motivo_cancelamento" TEXT,
    "dados_omie" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sincronizacoes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "empresa_id" TEXT,
    "acao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "resposta" JSONB,
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sincronizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "usuario_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "origem" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_cnpj_key" ON "clientes"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_empresa_cliente_id_empresa_id_key" ON "cliente_empresa"("cliente_id", "empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "produto_empresa_produto_id_empresa_id_key" ON "produto_empresa"("produto_id", "empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_empresa_pedido_id_empresa_id_key" ON "pedido_empresa"("pedido_id", "empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_chave_acesso_key" ON "notas_fiscais"("chave_acesso");

-- CreateIndex
CREATE INDEX "auditoria_entidade_entidade_id_idx" ON "auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "auditoria_created_at_idx" ON "auditoria"("created_at");

-- AddForeignKey
ALTER TABLE "cliente_empresa" ADD CONSTRAINT "cliente_empresa_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_empresa" ADD CONSTRAINT "cliente_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_empresa" ADD CONSTRAINT "produto_empresa_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_empresa" ADD CONSTRAINT "produto_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produto_id_empresa_id_fkey" FOREIGN KEY ("produto_id", "empresa_id") REFERENCES "produto_empresa"("produto_id", "empresa_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_empresa" ADD CONSTRAINT "pedido_empresa_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_empresa" ADD CONSTRAINT "pedido_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
