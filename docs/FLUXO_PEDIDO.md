# Fluxo Completo do Pedido (Input até NF-e)

## Visão Macro

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DO PEDIDO MULTI-CNPJ                           │
└─────────────────────────────────────────────────────────────────────────┘

[1] CRIAÇÃO DO PEDIDO UNIFICADO
    │
    ├─→ Usuário seleciona cliente (único)
    ├─→ Adiciona produtos de diferentes empresas
    ├─→ Sistema identifica empresa por produto
    ├─→ Valida estoque em cada empresa
    └─→ Calcula totais por empresa
                    │
                    ▼
[2] SEPARAÇÃO POR EMPRESA
    │
    ├─→ Agrupa itens por CNPJ de origem
    ├─→ Cria sub-pedidos virtuais
    └─→ Calcula impostos/frete proporcional
                    │
                    ▼
[3] VALIDAÇÃO E PROCESSAMENTO
    │
    ├─→ Validações de negócio
    ├─→ Bloqueio de estoque (reserva)
    └─→ Cria registro mestre do pedido
                    │
                    ▼
[4] CRIAÇÃO NOS OMIES
    │
    ├─→ Para cada empresa envolvida:
    │   ├─→ Cria pedido no Omie da empresa
    │   ├─→ Obtém número do pedido Omie
    │   └─→ Armazena referência cruzada
    │
                    │
                    ▼
[5] FATURAMENTO
    │
    ├─→ Usuário solicita faturamento
    ├─→ Para cada empresa:
    │   ├─→ Fatura pedido no Omie
    │   ├─→ Gera NF-e
    │   └─→ Obtém chave de acesso
    │
                    │
                    ▼
[6] CONSOLIDAÇÃO
    │
    ├─→ Atualiza status geral do pedido
    ├─→ Gera relatório consolidado
    └─→ Notifica cliente


STATUS DO PEDIDO MESTRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    RASCUNHO → VALIDADO → PROCESSANDO → FATURANDO → CONCLUÍDO
                 │           │             │            │
                 │           │             │            └→ Todas NF-es emitidas
                 │           │             └→ NF-es sendo geradas
                 │           └→ Pedidos criados nos Omies
                 └→ Pronto para processar

SUBSTATUS POR EMPRESA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Empresa A: [PEDIDO_CRIADO] → [FATURADO] → [NF_EMITIDA]
Empresa B: [PEDIDO_CRIADO] → [FATURADO] → [NF_EMITIDA]
Empresa C: [ERRO_FATURAMENTO] → [RETRY] → [NF_EMITIDA]
```

## Fluxo Detalhado

### Etapa 1: Criação do Pedido Unificado (Frontend → API)

```typescript
// Requisição do Frontend
POST /api/pedidos
{
  "cliente_id": "cli_123",
  "endereco_entrega": { /* ... */ },
  "observacoes": "Entregar após 14h",
  "itens": [
    {
      "produto_id": "prod_001",     // Produto da Empresa A
      "quantidade": 2,
      "preco_unitario": 100.00
    },
    {
      "produto_id": "prod_015",     // Produto da Empresa B
      "quantidade": 1,
      "preco_unitario": 250.00
    },
    {
      "produto_id": "prod_003",     // Produto da Empresa A
      "quantidade": 5,
      "preco_unitario": 50.00
    }
  ],
  "forma_pagamento": "boleto_30_dd"
}

// Processamento pelo PedidoService
async criarPedidoUnificado(dados: CriarPedidoDTO): Promise<Pedido> {
  // 1. Valida cliente
  const cliente = await this.clienteService.obterCliente(dados.cliente_id);
  
  // 2. Para cada item, identifica empresa e valida estoque
  const itensComEmpresa = await Promise.all(
    dados.itens.map(async item => {
      const produtoEmpresa = await this.produtoService
        .obterProdutoEmpresa(item.produto_id);
      
      // Verifica estoque na empresa específica
      const estoque = await this.omieService.consultarEstoque(
        produtoEmpresa.empresa_id,
        produtoEmpresa.codigo_produto_omie
      );
      
      if (estoque.saldo < item.quantidade) {
        throw new ErroEstoqueInsuficiente(produtoEmpresa, estoque);
      }
      
      return {
        ...item,
        empresa_id: produtoEmpresa.empresa_id,
        codigo_produto_omie: produtoEmpresa.codigo_produto_omie
      };
    })
  );
  
  // 3. Agrupa itens por empresa
  const itensPorEmpresa = this.agruparPorEmpresa(itensComEmpresa);
  // Resultado: { 'emp_A': [item1, item3], 'emp_B': [item2] }
  
  // 4. Cria pedido mestre
  const pedido = await this.pedidoRepository.create({
    cliente_id: dados.cliente_id,
    status: 'RASCUNHO',
    valor_total: this.calcularTotal(itensComEmpresa),
    itens: itensComEmpresa,
    empresas_envolvidas: Object.keys(itensPorEmpresa)
  });
  
  // 5. Enfileira processamento
  await this.filaPedidos.add('processar', { 
    pedido_id: pedido.id 
  });
  
  return pedido;
}
```

### Etapa 2: Processamento em Background (Worker)

```typescript
// Worker de processamento de pedidos
class ProcessarPedidoWorker {
  async process(job: Job<{ pedido_id: string }>): Promise<void> {
    const { pedido_id } = job.data;
    
    await this.unitOfWork.execute(async () => {
      // 1. Busca pedido com todos os relacionamentos
      const pedido = await this.pedidoRepository
        .findByIdCompleto(pedido_id);
      
      // 2. Atualiza status
      await this.pedidoRepository.updateStatus(
        pedido_id, 
        'PROCESSANDO'
      );
      
      // 3. Agrupa itens por empresa
      const porEmpresa = this.agruparItensPorEmpresa(pedido.itens);
      
      // 4. Para cada empresa, cria pedido no Omie
      const resultados = await Promise.all(
        Object.entries(porEmpresa).map(async ([empresaId, itens]) => {
          return this.criarPedidoOmie(pedido, empresaId, itens);
        })
      );
      
      // 5. Atualiza pedido mestre com referências
      await this.pedidoRepository.update(pedido_id, {
        status: 'VALIDADO',
        pedidos_omie: resultados.map(r => ({
          empresa_id: r.empresaId,
          numero_pedido_omie: r.numeroPedido,
          codigo_pedido_omie: r.codigoPedido,
          status: 'CRIADO'
        }))
      });
      
      // 6. Notifica usuário
      await this.notificacaoService.notificar(
        pedido.usuario_id,
        `Pedido #${pedido.numero} criado em ${resultados.length} empresas`
      );
    });
  }
  
  private async criarPedidoOmie(
    pedido: Pedido, 
    empresaId: string, 
    itens: ItemPedido[]
  ): Promise<CriacaoResult> {
    // Obtém códigos do cliente na empresa específica
    const codigoClienteOmie = await this.clienteService
      .obterCodigoOmie(pedido.cliente_id, empresaId);
    
    // Monta payload do Omie
    const payload = {
      codigo_cliente: codigoClienteOmie,
      data_previsao: this.calcularDataEntrega(),
      numero_pedido: this.gerarNumeroPedidoERP(pedido, empresaId),
      codigo_parcela: '000', // À vista ou configurável
      quantidade_itens: itens.length,
      valor_total: this.calcularTotalItens(itens),
      observacao: `Pedido ERP: ${pedido.numero}`,
      detalhes: itens.map(item => ({
        codigo_produto: item.codigo_produto_omie,
        quantidade: item.quantidade,
        valor_unitario: item.preco_unitario,
        valor_total: item.quantidade * item.preco_unitario
      }))
    };
    
    // Chama API Omie
    const resultado = await this.omieService.call(
      empresaId,
      'ProdutosPedido',
      'IncluirPedido',
      payload
    );
    
    return {
      empresaId,
      codigoPedido: resultado.codigo_pedido,
      numeroPedido: resultado.numero_pedido
    };
  }
}
```

### Etapa 3: Faturamento e Emissão de NF-e

```typescript
// Endpoint para solicitar faturamento
POST /api/pedidos/:id/faturar

// Controller
async faturarPedido(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  
  // Validações
  const pedido = await this.pedidoService.obterPedido(id);
  if (pedido.status !== 'VALIDADO') {
    throw new ErroPedidoNaoValidado();
  }
  
  // Enfileira faturamento
  await this.filaFaturamento.add('faturar', { pedido_id: id });
  
  // Atualiza status
  await this.pedidoService.atualizarStatus(id, 'FATURANDO');
  
  res.json({ 
    message: 'Faturamento iniciado',
    pedido_id: id,
    empresas_envolvidas: pedido.empresas_envolvidas.length
  });
}

// Worker de faturamento
class FaturamentoWorker {
  async process(job: Job<{ pedido_id: string }>): Promise<void> {
    const { pedido_id } = job.data;
    const pedido = await this.pedidoRepository.findByIdCompleto(pedido_id);
    
    // Fatura cada sub-pedido
    const resultadosFaturamento = await Promise.all(
      pedido.pedidos_omie.map(async pedidoOmie => {
        try {
          return await this.faturarPedidoOmie(pedidoOmie);
        } catch (error) {
          // Registra erro específico da empresa
          await this.registrarErroFaturamento(pedidoOmie, error);
          throw error; // Requeue para retry
        }
      })
    );
    
    // Atualiza status final
    const todasFaturadas = resultadosFaturamento.every(r => r.sucesso);
    await this.pedidoRepository.update(pedido_id, {
      status: todasFaturadas ? 'CONCLUIDO' : 'FATURAMENTO_PARCIAL',
      notas_fiscais: resultadosFaturamento.map(r => r.notaFiscal)
    });
  }
  
  private async faturarPedidoOmie(pedidoOmie: PedidoOmie): Promise<FaturamentoResult> {
    // 1. Fatura o pedido
    const faturamento = await this.omieService.call(
      pedidoOmie.empresa_id,
      'ProdutosPedidoFaturar',
      'FaturarPedidoVenda',
      {
        codigo_pedido: pedidoOmie.codigo_pedido_omie
      }
    );
    
    // 2. Obtém informações da NF-e emitida
    const notaFiscal = await this.omieService.call(
      pedidoOmie.empresa_id,
      'ConsultarNF',
      'ObterDocumento',
      {
        codigo_pedido: pedidoOmie.codigo_pedido_omie
      }
    );
    
    // 3. Persiste NF-e
    await this.notaFiscalRepository.create({
      pedido_id: pedidoOmie.pedido_id,
      empresa_id: pedidoOmie.empresa_id,
      numero: notaFiscal.numero,
      serie: notaFiscal.serie,
      chave_acesso: notaFiscal.chave_nfe,
      xml_url: notaFiscal.url_xml,
      pdf_url: notaFiscal.url_danfe,
      valor: notaFiscal.valor_total,
      status: 'EMITIDA'
    });
    
    return {
      sucesso: true,
      empresaId: pedidoOmie.empresa_id,
      notaFiscal: {
        numero: notaFiscal.numero,
        chave: notaFiscal.chave_nfe
      }
    };
  }
}
```

## Diagrama de Sequência

```
Usuário    Frontend    API        PedidoService    Queue    OmieClient    OmieAPI
  │           │          │              │             │           │           │
  │──Pedido──>│          │              │             │           │           │
  │           │─────────>│              │             │           │           │
  │           │          │─────────────>│             │           │           │
  │           │          │              │──Valida─────>│           │           │
  │           │          │              │   Estoque     │           │           │
  │           │          │              │<─────────────│           │           │
  │           │          │              │             │           │           │
  │           │          │              │──Enfileira──>│           │           │
  │           │          │<─────────────│             │           │           │
  │           │<─────────│              │             │           │           │
  │           │          │              │             │           │           │
  │           │          │              │             │────Processa──────────>│
  │           │          │              │             │           │         │
  │           │          │              │             │           │──Cria──>│
  │           │          │              │             │           │ Pedido  │
  │           │          │              │             │           │<────────│
  │           │          │              │             │<──────────│           │
  │           │          │              │<────────────│           │           │
  │           │          │              │             │           │           │
  │──Fatura─>│          │              │             │           │           │
  │           │─────────>│              │             │           │           │
  │           │          │              │             │           │           │
  │           │          │              │             │────Fatura────────────>│
  │           │          │              │             │           │         │
  │           │          │              │             │           │──NF-e──>│
  │           │          │              │             │           │<────────│
  │           │          │              │             │<──────────│           │
  │           │          │              │             │           │           │
  │           │          │<─────────────│             │           │           │
  │           │<─────────│              │             │           │           │
  │<─NF-es───│          │              │             │           │           │
```

## Estados e Transições

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MÁQUINA DE ESTADOS DO PEDIDO                      │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  RASCUNHO   │◄─────────────────┐
    └──────┬──────┘                  │
           │ salvar                  │
           ▼                         │
    ┌─────────────┐    erro          │
    │  VALIDADO   │───────────────────┘
    └──────┬──────┘
           │ processar
           ▼
    ┌─────────────┐         ┌─────────────┐
    │ PROCESSANDO │────────►│   ERRO      │◄─────┐
    └──────┬──────┘  falha  └─────────────┘      │
           │ sucesso                             │
           ▼                                     │ retry
    ┌─────────────┐                              │
    │  VALIDADO   │──────────────────────────────┘
    └──────┬──────┘  (pedidos criados nos Omies)
           │ faturar
           ▼
    ┌─────────────┐         ┌─────────────────────┐
    │ FATURANDO   │────────►│ FATURAMENTO_PARCIAL│◄─────┐
    └──────┬──────┘  falha  └─────────────────────┘      │
           │ parcial                                      │
           ▼                                              │
    ┌─────────────┐    erro/retry                         │
    │  CONCLUIDO  │───────────────────────────────────────┘
    └─────────────┘  (todas NF-es emitidas)


SUBSTATUS POR EMPRESA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRIADO → FATURANDO → NF_EMITIDA → CONCLUIDO
            │
            └──► ERRO_FATURAMENTO → RETRY → FATURANDO
```

## Compensação e Rollback

```typescript
// Estratégia SAGA para compensação
class PedidoSaga {
  async compensarCriacao(pedidoId: string): Promise<void> {
    const pedido = await this.pedidoRepository.findById(pedidoId);
    
    // Para cada empresa, cancela pedido criado
    for (const pedidoOmie of pedido.pedidos_omie) {
      try {
        await this.omieService.call(
          pedidoOmie.empresa_id,
          'ProdutosPedido',
          'CancelarPedido',
          {
            codigo_pedido: pedidoOmie.codigo_pedido_omie
          }
        );
      } catch (error) {
        // Log para intervenção manual
        await this.alertaService.alertar(
          `Falha ao compensar pedido ${pedidoOmie.codigo_pedido_omie} ` +
          `na empresa ${pedidoOmie.empresa_id}`
        );
      }
    }
    
    // Atualiza status
    await this.pedidoRepository.update(pedidoId, {
      status: 'CANCELADO',
      observacao: 'Cancelado por falha no processamento'
    });
  }
}
```

## Retry e Circuit Breaker

```typescript
// Configuração de retry para Omie
const omieRetryConfig = {
  retries: 5,
  backoff: 'exponential',
  minDelay: 1000,      // 1s
  maxDelay: 60000,     // 60s
  factor: 2,
  jitter: true,
  retryableErrors: [
    'ETIMEOUT',
    'ECONNRESET',
    'RATE_LIMIT',
    'OMIE_ERROR_500'
  ]
};

// Circuit Breaker
const circuitBreakerConfig = {
  failureThreshold: 5,      // Abre após 5 falhas
  resetTimeout: 30000,      // Tenta fechar após 30s
  halfOpenMaxCalls: 3       // 3 chamadas no half-open
};
```
