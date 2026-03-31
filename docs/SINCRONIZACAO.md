# Estratégia de Sincronização de Dados entre CNPJs

## Visão Geral

O sistema precisa manter consistência de dados entre múltiplas empresas no Omie. A estratégia varia por tipo de dado:

| Tipo de Dado | Estratégia | Frequência |
|--------------|------------|------------|
| Clientes | **Master-Slave (ERP é master)** | Síncrono (on-demand) |
| Produtos | **Read-Only Sync** | A cada 1 hora |
| Estoque | **Real-time Cache** | Consulta sob demanda + cache 5min |
| Pedidos | **Event-Driven** | Síncrono (processamento imediato) |
| NF-es | **Pull + Webhook** | Webhook + consulta diária |

## 1. Sincronização de Clientes (Master-Slave)

### Conceito
- ERP é a fonte única da verdade para clientes
- Cliente cadastrado uma vez no ERP
- Distribuição automática para todas as empresas
- Mapeamento de códigos por empresa

### Fluxo de Cadastro

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CADASTRO DE CLIENTE                            │
└─────────────────────────────────────────────────────────────────────┘

ERP (Usuário)
    │
    ├── Cadastra Cliente João Silva (CPF: 123.456.789-00)
    │   ├── Validações de dados
    │   └── Persiste na tabela 'clientes'
    │
    ├── Inicia Transação Distribuída
    │   │
    │   ├──► Empresa A (CNPJ: 11.111.111/0001-11)
    │   │      │
    │   │      ├── Chama API Omie: IncluirCliente
    │   │      │   ├── Envia dados completos
    │   │      │   └── Recebe código_omie: 12345
    │   │      │
    │   │      └── Salva em 'cliente_empresa'
    │   │          { cliente_id: X, empresa_id: A, codigo_omie: 12345 }
    │   │
    │   ├──► Empresa B (CNPJ: 22.222.222/0001-22)
    │   │      │
    │   │      ├── Chama API Omie: IncluirCliente
    │   │      │   └── Recebe código_omie: 67890
    │   │      │
    │   │      └── Salva em 'cliente_empresa'
    │   │          { cliente_id: X, empresa_id: B, codigo_omie: 67890 }
    │   │
    │   └──► Empresa C (CNPJ: 33.333.333/0001-33)
    │          │
    │          ├── Chama API Omie: IncluirCliente
    │          │   └── Recebe código_omie: 11121
    │          │
    │          └── Salva em 'cliente_empresa'
    │              { cliente_id: X, empresa_id: C, codigo_omie: 11121 }
    │
    └── Confirma Transação
        └── Cliente está disponível em todas as empresas
```

### Código: Serviço de Sincronização

```typescript
// src/services/SincronizacaoClienteService.ts
export class SincronizacaoClienteService {
  constructor(
    private clienteRepository: IClienteRepository,
    private clienteEmpresaRepository: IClienteEmpresaRepository,
    private empresaRepository: IEmpresaRepository,
    private omieClientFactory: IOmieClientFactory,
    private filaSync: IFilaSync,
    private logger: ILogger
  ) {}

  /**
   * Cadastra cliente no ERP e sincroniza com todas as empresas Omie
   */
  async cadastrarCliente(dados: CadastroClienteDTO): Promise<ClienteSyncResult> {
    // 1. Valida se já existe
    const existente = await this.clienteRepository.findByCpfCnpj(dados.cpfCnpj);
    if (existente) {
      throw new ClienteJaExisteError(dados.cpfCnpj);
    }

    // 2. Cria cliente no ERP (master)
    const cliente = await this.clienteRepository.create({
      nome: dados.nome,
      cpfCnpj: dados.cpfCnpj,
      email: dados.email,
      telefone: dados.telefone,
      celular: dados.celular,
      endereco: dados.endereco,
      dadosFiscais: dados.dadosFiscais
    });

    this.logger.info(`Cliente ${cliente.id} criado no ERP`);

    // 3. Busca todas as empresas ativas
    const empresas = await this.empresaRepository.findAtivas();

    // 4. Sincroniza com cada empresa
    const resultados = await Promise.allSettled(
      empresas.map(empresa => 
        this.sincronizarComEmpresa(cliente, empresa)
      )
    );

    // 5. Processa resultados
    const syncResults = resultados.map((result, index) => ({
      empresa: empresas[index],
      sucesso: result.status === 'fulfilled',
      codigoOmie: result.status === 'fulfilled' 
        ? result.value.codigoOmie 
        : null,
      erro: result.status === 'rejected' 
        ? result.reason.message 
        : null
    }));

    // 6. Agenda retry para falhas
    const falhas = syncResults.filter(r => !r.sucesso);
    if (falhas.length > 0) {
      await this.filaSync.add('retry-cliente', {
        clienteId: cliente.id,
        empresasFalhas: falhas.map(f => f.empresa.id)
      }, {
        delay: 5000, // Retry em 5 segundos
        attempts: 5
      });
    }

    return {
      cliente,
      sincronizacoes: syncResults
    };
  }

  /**
   * Sincroniza cliente específico com uma empresa
   */
  private async sincronizarComEmpresa(
    cliente: Cliente, 
    empresa: Empresa
  ): Promise<SincronizacaoEmpresaResult> {
    // Verifica se já existe vínculo
    const existente = await this.clienteEmpresaRepository
      .findByClienteAndEmpresa(cliente.id, empresa.id);
    
    if (existente && existente.syncStatus === 'SYNCED') {
      return { codigoOmie: existente.codigoOmie, jaExistente: true };
    }

    // Prepara payload Omie
    const payload = this.montarPayloadOmie(cliente);

    try {
      // Chama API Omie
      const omieClient = this.omieClientFactory.create(empresa);
      
      let resultado: OmieClienteResponse;
      
      if (existente?.codigoOmie) {
        // Atualiza existente
        resultado = await omieClient.call('GeralClientes', 'AlterarCliente', {
          ...payload,
          codigo_cliente_integracao: existente.codigoOmie
        });
      } else {
        // Cria novo
        resultado = await omieClient.call('GeralClientes', 'IncluirCliente', {
          ...payload,
          codigo_cliente_integracao: `ERP_${cliente.id}`
        });
      }

      // Salva/Atualiza vínculo
      await this.clienteEmpresaRepository.upsert({
        clienteId: cliente.id,
        empresaId: empresa.id,
        codigoOmie: resultado.codigo_cliente_omie,
        syncStatus: 'SYNCED',
        lastSync: new Date(),
        dadosCustomizados: payload
      });

      this.logger.info(
        `Cliente ${cliente.id} sincronizado com empresa ${empresa.nome} ` +
        `(código: ${resultado.codigo_cliente_omie})`
      );

      return {
        codigoOmie: resultado.codigo_cliente_omie,
        jaExistente: false
      };

    } catch (error) {
      // Registra falha
      await this.clienteEmpresaRepository.upsert({
        clienteId: cliente.id,
        empresaId: empresa.id,
        codigoOmie: existente?.codigoOmie,
        syncStatus: 'ERROR',
        syncError: error.message,
        lastSync: new Date()
      });

      throw new SyncError(
        `Falha ao sincronizar cliente ${cliente.id} com empresa ${empresa.nome}`,
        { cause: error }
      );
    }
  }

  /**
   * Monta payload para API Omie
   */
  private montarPayloadOmie(cliente: Cliente): OmieClientePayload {
    return {
      codigo_cliente_integracao: `ERP_${cliente.id}`,
      razao_social: cliente.nome,
      nome_fantasia: cliente.nome,
      cnpj_cpf: cliente.cpfCnpj.replace(/[^0-9]/g, ''),
      email: cliente.email,
      telefone1_numero: cliente.telefone?.replace(/[^0-9]/g, ''),
      telefone2_numero: cliente.celular?.replace(/[^0-9]/g, ''),
      
      // Endereço
      endereco: cliente.endereco?.logradouro,
      endereco_numero: cliente.endereco?.numero,
      bairro: cliente.endereco?.bairro,
      cidade: cliente.endereco?.cidade,
      estado: cliente.endereco?.estado,
      cep: cliente.endereco?.cep?.replace(/[^0-9]/g, ''),
      codigo_pais: cliente.endereco?.codigoPais || '1058',
      
      // Dados fiscais
      contribuinte: cliente.dadosFiscais?.tipoContribuinte || '9',
      
      // Tags para identificação
      tags: [
        { tag: 'ERP' },
        { tag: 'SINCRONIZADO' }
      ]
    };
  }

  /**
   * Obtém código do cliente em uma empresa específica
   */
  async obterCodigoOmie(
    clienteId: string, 
    empresaId: string
  ): Promise<string> {
    const vinculo = await this.clienteEmpresaRepository
      .findByClienteAndEmpresa(clienteId, empresaId);

    if (!vinculo || vinculo.syncStatus !== 'SYNCED') {
      // Tenta sincronizar on-demand
      const cliente = await this.clienteRepository.findById(clienteId);
      const empresa = await this.empresaRepository.findById(empresaId);
      
      if (!cliente || !empresa) {
        throw new NotFoundError('Cliente ou empresa não encontrado');
      }

      const resultado = await this.sincronizarComEmpresa(cliente, empresa);
      return resultado.codigoOmie;
    }

    return vinculo.codigoOmie;
  }

  /**
   * Reprocessa sincronizações pendentes
   */
  async reprocessarPendentes(): Promise<SyncBatchResult> {
    const pendentes = await this.clienteEmpresaRepository
      .findBySyncStatus('ERROR');

    const resultados = await Promise.allSettled(
      pendentes.map(async (pendente) => {
        const cliente = await this.clienteRepository
          .findById(pendente.clienteId);
        const empresa = await this.empresaRepository
          .findById(pendente.empresaId);

        if (!cliente || !empresa) {
          throw new NotFoundError('Cliente ou empresa não encontrado');
        }

        return this.sincronizarComEmpresa(cliente, empresa);
      })
    );

    return {
      total: pendentes.length,
      sucessos: resultados.filter(r => r.status === 'fulfilled').length,
      falhas: resultados.filter(r => r.status === 'rejected').length
    };
  }
}
```

## 2. Sincronização de Produtos/Estoque (Read-Only Sync)

### Conceito
- Produtos podem ter cadastros diferentes em cada Omie
- Sistema faz **pull** periódico para manter catálogo atualizado
- Estoque consultado sob demanda com cache

### Fluxo de Sincronização de Produtos

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SINCRONIZAÇÃO DE PRODUTOS                         │
└─────────────────────────────────────────────────────────────────────┘

Cron Job (a cada 1 hora)
    │
    ├── Para cada empresa ativa:
    │   │
    │   ├──► Consulta API Omie: ListarProdutos
    │   │      │
    │   │      ├── Página 1 (registros 1-50)
    │   │      │   └── Processa e atualiza produto_empresa
    │   │      ├── Página 2 (registros 51-100)
    │   │      │   └── Processa e atualiza produto_empresa
    │   │      └── ... até completar
    │   │
    │   └──► Para cada produto recebido:
    │          │
    │          ├── Busca produto no ERP por NCM + descrição
    │          │   ├── Se existe: atualiza vínculo
    │          │   └── Se não existe: cria produto genérico
    │          │
    │          └── Atualiza produto_empresa:
    │              ├── codigo_omie
    │              ├── preco_venda
    │              └── estoque_atual
    │
    └── Registra métricas de sincronização
```

### Código: Sincronização de Produtos

```typescript
// src/services/SincronizacaoProdutoService.ts
export class SincronizacaoProdutoService {
  constructor(
    private produtoRepository: IProdutoRepository,
    private produtoEmpresaRepository: IProdutoEmpresaRepository,
    private empresaRepository: IEmpresaRepository,
    private omieClientFactory: IOmieClientFactory,
    private cache: ICache,
    private logger: ILogger
  ) {}

  /**
   * Sincroniza todos os produtos de uma empresa
   */
  async sincronizarProdutosEmpresa(empresaId: string): Promise<SyncResult> {
    const empresa = await this.empresaRepository.findById(empresaId);
    if (!empresa) {
      throw new NotFoundError('Empresa não encontrada');
    }

    const omieClient = this.omieClientFactory.create(empresa);
    
    let pagina = 1;
    let totalProcessados = 0;
    let totalCriados = 0;
    let totalAtualizados = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await omieClient.call(
        'GeralProdutos', 
        'ListarProdutos', 
        {
          pagina,
          registros_por_pagina: 50,
          apenas_importado_api: 'N',
          filtrar_apenas_ativo: 'S'
        }
      );

      for (const produtoOmie of response.produto_servico_cadastro) {
        const resultado = await this.processarProdutoOmie(
          produtoOmie, 
          empresa
        );

        if (resultado.acao === 'CRIADO') totalCriados++;
        if (resultado.acao === 'ATUALIZADO') totalAtualizados++;
        
        totalProcessados++;
      }

      hasMore = response.pagina < response.total_de_paginas;
      pagina++;

      // Rate limiting - espera 100ms entre páginas
      if (hasMore) {
        await sleep(100);
      }
    }

    this.logger.info(
      `Sincronização produtos empresa ${empresa.nome}: ` +
      `${totalProcessados} processados, ` +
      `${totalCriados} criados, ` +
      `${totalAtualizados} atualizados`
    );

    return {
      empresaId,
      totalProcessados,
      totalCriados,
      totalAtualizados,
      timestamp: new Date()
    };
  }

  /**
   * Processa produto retornado do Omie
   */
  private async processarProdutoOmie(
    produtoOmie: OmieProduto,
    empresa: Empresa
  ): Promise<ProcessamentoResult> {
    // Tenta encontrar produto existente no ERP
    let produto = await this.produtoRepository.findByNcm(
      produtoOmie.ncm?.codigo
    );

    if (!produto) {
      // Cria produto genérico no ERP
      produto = await this.produtoRepository.create({
        codigo: `OMIE_${produtoOmie.codigo}`,
        descricao: produtoOmie.descricao,
        descricaoComplementar: produtoOmie.descr_detalhada,
        ncm: produtoOmie.ncm?.codigo || '00000000',
        cest: produtoOmie.cest?.codigo,
        unidade: produtoOmie.unidade,
        precoBase: parseFloat(produtoOmie.valor_unitario),
        tipo: this.mapearTipoProduto(produtoOmie.tipoItem)
      });
    }

    // Atualiza/cria vínculo com empresa
    const existente = await this.produtoEmpresaRepository
      .findByProdutoAndEmpresa(produto.id, empresa.id);

    await this.produtoEmpresaRepository.upsert({
      produtoId: produto.id,
      empresaId: empresa.id,
      codigoOmie: produtoOmie.codigo,
      precoVenda: parseFloat(produtoOmie.valor_unitario),
      estoqueAtual: parseInt(produtoOmie.quantidade_estoque) || 0,
      dadosOmie: produtoOmie
    });

    return {
      acao: existente ? 'ATUALIZADO' : 'CRIADO',
      produtoId: produto.id
    };
  }

  /**
   * Consulta estoque em tempo real (com cache)
   */
  async consultarEstoque(
    produtoId: string, 
    empresaId: string
  ): Promise<EstoqueInfo> {
    const cacheKey = `estoque:${empresaId}:${produtoId}`;
    
    // Tenta cache primeiro
    const cached = await this.cache.get<EstoqueInfo>(cacheKey);
    if (cached) {
      return cached;
    }

    const produtoEmpresa = await this.produtoEmpresaRepository
      .findByProdutoAndEmpresa(produtoId, empresaId);

    if (!produtoEmpresa) {
      throw new NotFoundError('Produto não encontrado na empresa');
    }

    const empresa = await this.empresaRepository.findById(empresaId);
    const omieClient = this.omieClientFactory.create(empresa);

    // Consulta estoque real no Omie
    const response = await omieClient.call(
      'EstoqueConsulta',
      'ConsultarEstoque',
      {
        codigo_produto: produtoEmpresa.codigoOmie
      }
    );

    const estoque = {
      produtoId,
      empresaId,
      codigoOmie: produtoEmpresa.codigoOmie,
      saldo: response.saldo,
      reservado: response.reservado || 0,
      disponivel: response.saldo - (response.reservado || 0),
      ultimaConsulta: new Date()
    };

    // Salva no cache por 5 minutos
    await this.cache.set(cacheKey, estoque, 300);

    // Atualiza no banco
    await this.produtoEmpresaRepository.update(produtoEmpresa.id, {
      estoqueAtual: response.saldo,
      estoqueReservado: response.reservado || 0,
      ultimaConsulta: new Date()
    });

    return estoque;
  }

  /**
   * Reserva estoque (bloqueio temporário)
   */
  async reservarEstoque(
    produtoId: string,
    empresaId: string,
    quantidade: number,
    reservaId: string
  ): Promise<boolean> {
    const estoque = await this.consultarEstoque(produtoId, empresaId);

    if (estoque.disponivel < quantidade) {
      return false;
    }

    // Registra reserva no cache/redis
    const reservaKey = `reserva:${empresaId}:${produtoId}:${reservaId}`;
    await this.cache.set(reservaKey, {
      quantidade,
      reservaId,
      expiraEm: Date.now() + (30 * 60 * 1000) // 30 minutos
    }, 1800);

    return true;
  }

  /**
   * Libera reserva de estoque
   */
  async liberarReserva(
    produtoId: string,
    empresaId: string,
    reservaId: string
  ): Promise<void> {
    const reservaKey = `reserva:${empresaId}:${produtoId}:${reservaId}`;
    await this.cache.del(reservaKey);
  }
}
```

## 3. Sincronização Bidirecional via Webhooks

### Configuração de Webhooks no Omie

O sistema deve se registrar para receber notificações do Omie:

| Evento | Endpoint | Ação |
|--------|----------|------|
| NF-e Emitida | `/webhooks/nfe/emitida` | Atualiza status do pedido |
| Pedido Faturado | `/webhooks/pedido/faturado` | Marca empresa como faturada |
| Cliente Alterado | `/webhooks/cliente/alterado` | Sincroniza alterações |

### Código: Handler de Webhooks

```typescript
// src/controllers/WebhookController.ts
export class WebhookController {
  constructor(
    private pedidoService: IPedidoService,
    private clienteService: IClienteService,
    private logger: ILogger
  ) {}

  /**
   * Webhook: NF-e emitida no Omie
   */
  async handleNfeEmitida(req: Request, res: Response): Promise<void> {
    const { 
      app_key, 
      topic, 
      payload 
    } = req.body as OmieWebhookPayload;

    this.logger.info(`Webhook NF-e: ${topic}`, { app_key });

    // Identifica empresa pelo app_key
    const empresa = await this.empresaRepository.findByAppKey(app_key);
    if (!empresa) {
      this.logger.warn(`Empresa não encontrada para app_key: ${app_key}`);
      res.status(200).json({ message: 'ignored' });
      return;
    }

    const nfeData = payload as NfeEmitidaPayload;

    // Busca pedido pelo número de referência
    const pedidoEmpresa = await this.pedidoEmpresaRepository
      .findByEmpresaAndNumeroOmie(
        empresa.id, 
        nfeData.idPedido
      );

    if (!pedidoEmpresa) {
      this.logger.warn(`Pedido não encontrado: ${nfeData.idPedido}`);
      res.status(200).json({ message: 'ignored' });
      return;
    }

    // Atualiza NF-e
    await this.notaFiscalRepository.create({
      pedidoId: pedidoEmpresa.pedidoId,
      empresaId: empresa.id,
      numero: nfeData.numero,
      serie: nfeData.serie,
      chaveAcesso: nfeData.chaveNFe,
      protocolo: nfeData.protocolo,
      dataEmissao: new Date(nfeData.dataEmissao),
      valorTotal: nfeData.valorTotal,
      xmlUrl: nfeData.urlXML,
      pdfUrl: nfeData.urlDANFE,
      status: 'EMITIDA',
      dadosOmie: nfeData
    });

    // Verifica se todas as empresas faturaram
    await this.pedidoService.verificarConclusaoFaturamento(
      pedidoEmpresa.pedidoId
    );

    res.status(200).json({ message: 'processed' });
  }

  /**
   * Webhook: Pedido faturado
   */
  async handlePedidoFaturado(req: Request, res: Response): Promise<void> {
    const { app_key, payload } = req.body;

    const pedidoData = payload as PedidoFaturadoPayload;

    const pedidoEmpresa = await this.pedidoEmpresaRepository
      .findByEmpresaAndCodigoOmie(
        empresa.id,
        pedidoData.codigoPedido
      );

    if (!pedidoEmpresa) {
      res.status(200).json({ message: 'ignored' });
      return;
    }

    // Atualiza status
    await this.pedidoEmpresaRepository.update(pedidoEmpresa.id, {
      statusOmie: 'FATURADO',
      respostaOmie: pedidoData
    });

    // Verifica conclusão
    await this.pedidoService.verificarConclusaoFaturamento(
      pedidoEmpresa.pedidoId
    );

    res.status(200).json({ message: 'processed' });
  }
}
```

## 4. Compensação de Falhas (Saga Pattern)

Quando uma operação falha em uma empresa, compensa nas outras:

```typescript
// src/services/SagaPedidoService.ts
export class SagaPedidoService {
  
  /**
   * Compensa criação de pedido (cancela nos Omies já criados)
   */
  async compensarCriacaoPedido(pedidoId: string): Promise<void> {
    const pedido = await this.pedidoRepository.findByIdCompleto(pedidoId);
    
    this.logger.warn(`Iniciando compensação para pedido ${pedidoId}`);

    // Cancela pedidos já criados
    for (const pedidoEmpresa of pedido.pedidosEmpresa) {
      if (pedidoEmpresa.codigoPedidoOmie) {
        try {
          await this.omieService.call(
            pedidoEmpresa.empresaId,
            'ProdutosPedido',
            'CancelarPedido',
            {
              codigo_pedido: pedidoEmpresa.codigoPedidoOmie,
              motivo: 'Cancelado por falha em processamento multi-empresa'
            }
          );

          await this.pedidoEmpresaRepository.update(pedidoEmpresa.id, {
            statusOmie: 'CANCELADO'
          });

        } catch (error) {
          // Alerta para intervenção manual
          await this.alertaService.critical(
            `Falha na compensação: Pedido ${pedidoEmpresa.codigoPedidoOmie} ` +
            `empresa ${pedidoEmpresa.empresaId} - REQUER INTERVENÇÃO MANUAL`
          );
        }
      }
    }

    // Atualiza pedido mestre
    await this.pedidoRepository.update(pedidoId, {
      status: 'CANCELADO',
      observacao: 'Cancelado automaticamente por falha no processamento'
    });
  }
}
```

## Resumo da Estratégia

| Aspecto | Implementação |
|---------|---------------|
| **Consistência** | Eventual + Compensação (Saga) |
| **Concorrência** | Otimista com cache de estoque |
| **Retry** | Exponential backoff, max 5 tentativas |
| **Orquestração** | Filas BullMQ para processamento assíncrono |
| **Observabilidade** | Logs estruturados + Métricas Prometheus |
| **Alertas** | PagerDuty/Opsgenie para falhas críticas |
