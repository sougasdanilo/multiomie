-- Schema Multiomie ERP para Supabase

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    nome_fantasia VARCHAR(255),
    app_key VARCHAR(255) NOT NULL,
    app_secret VARCHAR(255) NOT NULL,
    ativa BOOLEAN DEFAULT true,
    configuracoes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    endereco JSONB,
    ie VARCHAR(15),
    im VARCHAR(15),
    tipo_contribuinte VARCHAR(2) DEFAULT '9',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    descricao_complementar TEXT,
    ncm VARCHAR(8) NOT NULL,
    cest VARCHAR(7),
    cfop VARCHAR(4),
    unidade VARCHAR(5) NOT NULL,
    preco_base DECIMAL(15,2),
    tipo VARCHAR(20) DEFAULT 'PRODUTO',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    status VARCHAR(50) DEFAULT 'RASCUNHO',
    substatus VARCHAR(50),
    valor_produtos DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_frete DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL,
    endereco_entrega JSONB,
    data_previsao TIMESTAMP WITH TIME ZONE,
    forma_pagamento VARCHAR(100),
    condicao_pagamento VARCHAR(100),
    observacoes TEXT,
    observacao_interna TEXT,
    usuario_id VARCHAR(255),
    processado_at TIMESTAMP WITH TIME ZONE,
    faturado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Relacionamento Cliente-Empresa
CREATE TABLE IF NOT EXISTS cliente_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo_omie VARCHAR(50) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'PENDING',
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    dados_customizados JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cliente_id, empresa_id)
);

-- Tabela de Relacionamento Produto-Empresa
CREATE TABLE IF NOT EXISTS produto_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo_omie VARCHAR(50) NOT NULL,
    estoque_minimo INTEGER DEFAULT 0,
    estoque_atual INTEGER DEFAULT 0,
    estoque_reservado INTEGER DEFAULT 0,
    ultima_consulta TIMESTAMP WITH TIME ZONE,
    preco_venda DECIMAL(15,2),
    config_fiscal JSONB,
    dados_omie JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produto_id, empresa_id)
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
    empresa_id UUID NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    preco_unitario DECIMAL(15,4) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    percentual_desconto DECIMAL(5,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    sequencia INTEGER NOT NULL,
    ncm VARCHAR(8),
    cfop VARCHAR(4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (produto_id, empresa_id) REFERENCES produto_empresa(produto_id, empresa_id)
);

-- Tabela de Relacionamento Pedido-Empresa
CREATE TABLE IF NOT EXISTS pedido_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    codigo_pedido_omie VARCHAR(50),
    numero_pedido_omie VARCHAR(50),
    status_omie VARCHAR(50),
    valor_itens DECIMAL(15,2),
    valor_total DECIMAL(15,2),
    resposta_omie JSONB,
    tentativas INTEGER DEFAULT 0,
    ultimo_erro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pedido_id, empresa_id)
);

-- Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(3) DEFAULT '1',
    chave_acesso VARCHAR(44) UNIQUE NOT NULL,
    protocolo VARCHAR(50),
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_saida TIMESTAMP WITH TIME ZONE,
    valor_produtos DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    xml_url TEXT,
    pdf_url TEXT,
    status VARCHAR(20) DEFAULT 'EMITIDA',
    motivo_cancelamento TEXT,
    dados_omie JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sincronizações
CREATE TABLE IF NOT EXISTS sincronizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL,
    entidade_id UUID NOT NULL,
    empresa_id UUID,
    acao VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    payload JSONB,
    resposta JSONB,
    erro TEXT,
    tentativas INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade VARCHAR(50) NOT NULL,
    entidade_id UUID NOT NULL,
    acao VARCHAR(50) NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    usuario_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    origem VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_ativa ON empresas(ativa);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id ON pedido_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_empresa_id ON pedido_itens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cliente_empresa_cliente_id ON cliente_empresa(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_empresa_empresa_id ON cliente_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produto_empresa_produto_id ON produto_empresa(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_empresa_empresa_id ON produto_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedido_empresa_pedido_id ON pedido_empresa(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_empresa_empresa_id ON pedido_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_pedido_id ON notas_fiscais(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_id ON notas_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave_acesso ON notas_fiscais(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_sincronizacoes_status ON sincronizacoes(status);
CREATE INDEX IF NOT EXISTS idx_sincronizacoes_tipo ON sincronizacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_sincronizacoes_empresa_id ON sincronizacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sincronizacoes_scheduled_at ON sincronizacoes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria(entidade);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade_id ON auditoria(entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas que têm updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cliente_empresa_updated_at BEFORE UPDATE ON cliente_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produto_empresa_updated_at BEFORE UPDATE ON produto_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedido_itens_updated_at BEFORE UPDATE ON pedido_itens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedido_empresa_updated_at BEFORE UPDATE ON pedido_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_fiscais_updated_at BEFORE UPDATE ON notas_fiscais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança (RLS) - Habilitar RLS nas tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sincronizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessidade de segurança)
-- Por enquanto, permitir acesso total para desenvolvimento
CREATE POLICY "Enable all operations for authenticated users" ON empresas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON produtos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON pedidos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON cliente_empresa FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON produto_empresa FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON pedido_itens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON pedido_empresa FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON notas_fiscais FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON sincronizacoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON auditoria FOR ALL USING (auth.role() = 'authenticated');
