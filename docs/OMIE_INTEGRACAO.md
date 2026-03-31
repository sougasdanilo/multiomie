# Integração com API Omie - Exemplos e Pseudocódigo

## Configuração Base

### 1. Cliente HTTP Configurável

```typescript
// src/integrations/OmieClient.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Empresa } from '../entities/Empresa';

export interface OmieCredentials {
  appKey: string;
  appSecret: string;
}

export interface OmieRequest {
  call: string;
  app_key: string;
  app_secret: string;
  param: any[];
}

export class OmieClient {
  private httpClient: AxiosInstance;
  private credentials: OmieCredentials;
  private baseURL = 'https://app.omie.com.br/api/v1';

  // Rate limiting
  private lastRequestTime: number = 0;
  private minInterval: number = 100; // 100ms entre requisições

  constructor(credentials: OmieCredentials) {
    this.credentials = credentials;
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para logging
    this.httpClient.interceptors.request.use(
      (config) => {
        config.headers['X-Request-ID'] = this.generateRequestId();
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Chamada genérica para API Omie
   */
  async call<T>(
    endpoint: string,
    method: string,
    params: any = {}
  ): Promise<T> {
    // Rate limiting
    await this.respeitarRateLimit();

    const payload: OmieRequest = {
      call: method,
      app_key: this.credentials.appKey,
      app_secret: this.credentials.appSecret,
      param: [params]
    };

    const url = `/${endpoint}/`;

    try {
      const response = await this.httpClient.post(url, payload);
      
      // Omie retorna 200 mesmo com erro, verifica corpo
      if (response.data.faultcode) {
        throw new OmieApiError(
          response.data.faultstring,
          response.data.faultcode,
          response.data
        );
      }

      return response.data;

    } catch (error) {
      if (error instanceof OmieApiError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new OmieApiError(
          axiosError.message,
          axiosError.code || 'NETWORK_ERROR',
          { originalError: axiosError }
        );
      }

      throw error;
    }
  }

  private async respeitarRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Factory para criar clients por empresa
export class OmieClientFactory {
  constructor(
    private encryptionService: IEncryptionService
  ) {}

  create(empresa: Empresa): OmieClient {
    // Descriptografa app_secret
    const appSecret = this.encryptionService.decrypt(empresa.appSecret);
    
    return new OmieClient({
      appKey: empresa.appKey,
      appSecret
    });
  }
}

// Exceção customizada
export class OmieApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public data?: any
  ) {
    super(message);
    this.name = 'OmieApiError';
  }

  isRetryable(): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'ETIMEOUT',
      'ECONNRESET',
      'OMIE_ERROR_500',
      'RATE_LIMIT'
    ];
    return retryableCodes.includes(this.code);
  }
}
```

## 2. Serviço de Integração (CRUDs Principais)

### Clientes

```typescript
// src/integrations/services/OmieClienteService.ts
export class OmieClienteService {
  constructor(private omieClient: OmieClient) {}

  /**
   * Incluir cliente no Omie
   */
  async incluir(cliente: ClienteOmiePayload): Promise<IncluirClienteResponse> {
    const response = await this.omieClient.call<IncluirClienteResponse>(
      'geral/clientes',
      'IncluirCliente',
      cliente
    );

    return {
      codigoClienteOmie: response.codigo_cliente_omie,
      codigoClienteIntegracao: response.codigo_cliente_integracao,
      cnpjCpf: response.cnpj_cpf
    };
  }

  /**
   * Alterar cliente no Omie
   */
  async alterar(cliente: AlterarClientePayload): Promise<AlterarClienteResponse> {
    return await this.omieClient.call(
      'geral/clientes',
      'AlterarCliente',
      cliente
    );
  }

  /**
   * Consultar cliente por CNPJ
   */
  async consultar(cnpjCpf: string): Promise<ClienteOmie | null> {
    try {
      const response = await this.omieClient.call<{ cliente_cadastro: ClienteOmie }>(
        'geral/clientes',
        'ConsultarCliente',
        {
          cnpj_cpf: cnpjCpf.replace(/[^0-9]/g, '')
        }
      );

      return response.cliente_cadastro;
    } catch (error) {
      if (error instanceof OmieApiError && error.code === 'SOAP-ENV:Client-113') {
        // Cliente não encontrado
        return null;
      }
      throw error;
    }
  }

  /**
   * Listar clientes com paginação
   */
  async listar(
    pagina: number = 1,
    registrosPorPagina: number = 50,
    filtros?: ListarClientesFiltros
  ): Promise<ListarClientesResponse> {
    const params: any = {
      pagina,
      registros_por_pagina: registrosPorPagina,
      apenas_importado_api: 'N',
      ordenar_por: 'CODIGO',
      ordem_decrescente: 'N'
    };

    if (filtros?.codigoClienteOmie) {
      params.clientes_por_codigo = [{
        codigo_cliente_omie: filtros.codigoClienteOmie
      }];
    }

    return await this.omieClient.call(
      'geral/clientes',
      'ListarClientes',
      params
    );
  }

  /**
   * Excluir cliente
   */
  async excluir(codigoClienteOmie: string): Promise<void> {
    await this.omieClient.call(
      'geral/clientes',
      'ExcluirCliente',
      {
        codigo_cliente_omie: codigoClienteOmie
      }
    );
  }
}

// Tipos de Payload
export interface ClienteOmiePayload {
  codigo_cliente_integracao: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj_cpf: string;
  email?: string;
  telefone1_numero?: string;
  telefone2_numero?: string;
  endereco?: string;
  endereco_numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  codigo_pais?: string;
  contribuinte?: '1' | '2' | '9';
  ie?: string;
  im?: string;
  tags?: Array<{ tag: string }>;
}

export interface IncluirClienteResponse {
  codigo_cliente_omie: number;
  codigo_cliente_integracao: string;
  cnpj_cpf: string;
}
```

### Produtos

```typescript
// src/integrations/services/OmieProdutoService.ts
export class OmieProdutoService {
  constructor(private omieClient: OmieClient) {}

  /**
   * Incluir produto
   */
  async incluir(produto: ProdutoOmiePayload): Promise<IncluirProdutoResponse> {
    return await this.omieClient.call(
      'geral/produtos',
      'IncluirProduto',
      produto
    );
  }

  /**
   * Consultar produto
   */
  async consultar(codigoProduto: string): Promise<ProdutoOmie> {
    const response = await this.omieClient.call<{ produto_servico_cadastro: ProdutoOmie }>(
      'geral/produtos',
      'ConsultarProduto',
      {
        codigo: codigoProduto
      }
    );

    return response.produto_servico_cadastro;
  }

  /**
   * Listar produtos
   */
  async listar(
    pagina: number = 1,
    registrosPorPagina: number = 50
  ): Promise<ListarProdutosResponse> {
    return await this.omieClient.call(
      'geral/produtos',
      'ListarProdutos',
      {
        pagina,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        filtrar_apenas_ativo: 'S'
      }
    );
  }

  /**
   * Consultar estoque
   */
  async consultarEstoque(codigoProduto: string): Promise<EstoqueOmie> {
    const response = await this.omieClient.call<{ saldo: number; reservado?: number }>(
      'estoque/consulta',
      'ConsultarEstoque',
      {
        codigo_produto: codigoProduto
      }
    );

    return {
      saldo: response.saldo,
      reservado: response.reservado || 0,
      disponivel: response.saldo - (response.reservado || 0)
    };
  }
}

export interface ProdutoOmiePayload {
  codigo: string;
  codigo_produto_integracao?: string;
  descricao: string;
  descr_detalhada?: string;
  unidade: string;
  ncm: string;
  cest?: string;
  valor_unitario: number;
  tipoItem?: '00' | '01' | '02' | '03' | '04' | '05';
  // Campos fiscais
  codigo_tipo_operacao_st?: string;
  deduzir_iss_total_nota?: 'S' | 'N';
  // ... outros campos
}
```

### Pedidos de Venda

```typescript
// src/integrations/services/OmiePedidoService.ts
export class OmiePedidoService {
  constructor(private omieClient: OmieClient) {}

  /**
   * Incluir pedido de venda
   */
  async incluir(pedido: PedidoOmiePayload): Promise<IncluirPedidoResponse> {
    return await this.omieClient.call(
      'produtos/pedido',
      'IncluirPedido',
      pedido
    );
  }

  /**
   * Alterar pedido
   */
  async alterar(pedido: AlterarPedidoPayload): Promise<AlterarPedidoResponse> {
    return await this.omieClient.call(
      'produtos/pedido',
      'AlterarPedido',
      pedido
    );
  }

  /**
   * Consultar pedido
   */
  async consultar(codigoPedido: string): Promise<PedidoOmie> {
    const response = await this.omieClient.call<{ pedido_venda_produto: PedidoOmie }>(
      'produtos/pedido',
      'ConsultarPedido',
      {
        codigo_pedido: codigoPedido
      }
    );

    return response.pedido_venda_produto;
  }

  /**
   * Faturar pedido
   */
  async faturar(codigoPedido: string): Promise<FaturarPedidoResponse> {
    return await this.omieClient.call(
      'produtos/pedidovendafat',
      'FaturarPedidoVenda',
      {
        codigo_pedido: codigoPedido
      }
    );
  }

  /**
   * Cancelar pedido
   */
  async cancelar(
    codigoPedido: string, 
    motivo: string
  ): Promise<CancelarPedidoResponse> {
    return await this.omieClient.call(
      'produtos/pedido',
      'CancelarPedido',
      {
        codigo_pedido: codigoPedido,
        motivo
      }
    );
  }

  /**
   * Listar pedidos
   */
  async listar(
    pagina: number = 1,
    registrosPorPagina: number = 50,
    filtros?: ListarPedidosFiltros
  ): Promise<ListarPedidosResponse> {
    const params: any = {
      pagina,
      registros_por_pagina: registrosPorPagina,
      apenas_importado_api: 'N',
      ordenar_por: 'CODIGO',
      ordem_decrescente: 'S'
    };

    if (filtros?.dataInicial && filtros.dataFinal) {
      params.filtrar_por_data_de = filtros.dataInicial;
      params.filtrar_por_data_ate = filtros.dataFinal;
    }

    if (filtros?.clienteOmieId) {
      params.filtrar_por_cliente = filtros.clienteOmieId;
    }

    return await this.omieClient.call(
      'produtos/pedido',
      'ListarPedidos',
      params
    );
  }
}

export interface PedidoOmiePayload {
  cabecalho: {
    codigo_cliente: number;
    codigo_pedido_integracao?: string;
    data_previsao?: string; // YYYY-MM-DD
    numero_pedido?: string;
    codigo_parcela?: string;
    quantidade_itens: number;
    valor_total: number;
    obs?: string;
  };
  det: Array<{
    ide: {
      codigo_produto: number;
      quantidade: number;
    };
    produto: {
      valor_unitario: number;
      valor_total: number;
      cfop?: string;
      ncm?: string;
    };
  }>;
  
  // Opcional: Informações adicionais
  infoCadastro?: {
    codigo_categoria?: string;
    codigo_projeto?: number;
  };
}

export interface IncluirPedidoResponse {
  codigo_pedido: number;
  codigo_pedido_integracao: string;
  numero_pedido: string;
}
```

### Notas Fiscais (NF-e)

```typescript
// src/integrations/services/OmieNfeService.ts
export class OmieNfeService {
  constructor(private omieClient: OmieClient) {}

  /**
   * Consultar NF-e por pedido
   */
  async consultarPorPedido(codigoPedido: string): Promise<NfeOmie | null> {
    try {
      const response = await this.omieClient.call<{ nfCadastro: NfeOmie }>(
        'produtos/nfconsultar',
        'ConsultarNF',
        {
          codigo_pedido: codigoPedido
        }
      );

      return response.nfCadastro;
    } catch (error) {
      if (error instanceof OmieApiError && 
          error.message.includes('não localizada')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Consultar NF-e por número
   */
  async consultarPorNumero(
    numero: string, 
    serie: string
  ): Promise<NfeOmie | null> {
    const response = await this.omieClient.call(
      'produtos/nfconsultar',
      'ConsultarNF',
      {
        nChave: `${numero}|${serie}`
      }
    );

    return response.nfCadastro || null;
  }

  /**
   * Listar NF-es
   */
  async listar(
    pagina: number = 1,
    registrosPorPagina: number = 50,
    filtros?: ListarNfeFiltros
  ): Promise<ListarNfeResponse> {
    const params: any = {
      pagina,
      registros_por_pagina: registrosPorPagina
    };

    if (filtros?.dataInicial && filtros.dataFinal) {
      params.filtrar_por_data_de = filtros.dataInicial;
      params.filtrar_por_data_ate = filtros.dataFinal;
    }

    return await this.omieClient.call(
      'produtos/nfconsultar',
      'ListarNF',
      params
    );
  }

  /**
   * Cancelar NF-e
   */
  async cancelar(
    chaveNFe: string,
    motivo: string,
    protocolo?: string
  ): Promise<CancelarNfeResponse> {
    return await this.omieClient.call(
      'produtos/nfe',
      'CancelarNF',
      {
        chave_nfe: chaveNFe,
        motivo_cancelamento: motivo,
        protocolo_nfe: protocolo
      }
    );
  }

  /**
   * Inutilizar numeração
   */
  async inutilizar(params: InutilizarNfeParams): Promise<InutilizarNfeResponse> {
    return await this.omieClient.call(
      'produtos/nfe',
      'InutilizarNF',
      params
    );
  }
}

export interface NfeOmie {
  cabecalho: {
    numero: string;
    serie: string;
    chave_nfe: string;
    data_emissao: string;
    data_saida: string;
    valor_total: number;
  };
  informacoes: {
    url_xml: string;
    url_danfe: string;
    protocolo: string;
    situacao: string;
  };
  det: Array<{
    produto: {
      codigo: string;
      descricao: string;
      ncm: string;
      quantidade: number;
      valor_unitario: number;
      valor_total: number;
    };
  }>;
}
```

## 3. Retry e Circuit Breaker

```typescript
// src/integrations/OmieServiceWithRetry.ts
import { CircuitBreaker } from 'opossum';

export class OmieServiceWithRetry {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    private omieClientFactory: OmieClientFactory,
    private logger: ILogger
  ) {}

  /**
   * Executa chamada com retry e circuit breaker
   */
  async executar<T>(
    empresaId: string,
    endpoint: string,
    method: string,
    params: any,
    options: RetryOptions = {}
  ): Promise<T> {
    const empresa = await this.empresaRepository.findById(empresaId);
    const omieClient = this.omieClientFactory.create(empresa);
    
    // Obtém ou cria circuit breaker para esta empresa
    const cb = this.getCircuitBreaker(empresaId);

    const operation = async () => {
      return await omieClient.call<T>(endpoint, method, params);
    };

    try {
      return await cb.fire(operation);
    } catch (error) {
      if (error instanceof OmieApiError && error.isRetryable()) {
        // Retry manual com exponential backoff
        return this.retryWithBackoff(operation, options);
      }
      throw error;
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff com jitter
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        
        this.logger.warn(
          `Retry ${attempt}/${maxRetries} após ${delay + jitter}ms`,
          { error: error.message }
        );

        await sleep(delay + jitter);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private getCircuitBreaker(empresaId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(empresaId)) {
      const cb = new CircuitBreaker(
        async (operation: () => Promise<any>) => operation(),
        {
          timeout: 30000, // 30 segundos
          errorThresholdPercentage: 50, // Abre se 50% falhar
          resetTimeout: 30000, // Tenta novamente em 30s
          volumeThreshold: 5 // Mínimo de 5 chamadas
        }
      );

      cb.on('open', () => {
        this.logger.warn(`Circuit breaker ABERTO para empresa ${empresaId}`);
      });

      cb.on('halfOpen', () => {
        this.logger.info(`Circuit breaker MEIO-ABERTO para empresa ${empresaId}`);
      });

      cb.on('close', () => {
        this.logger.info(`Circuit breaker FECHADO para empresa ${empresaId}`);
      });

      this.circuitBreakers.set(empresaId, cb);
    }

    return this.circuitBreakers.get(empresaId);
  }
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
}
```

## 4. Exemplo de Uso Completo

```typescript
// Exemplo: Criar pedido em múltiplas empresas
async function exemploCriarPedidoMultiEmpresa() {
  // 1. Dados do pedido
  const pedidoData = {
    clienteId: 'cli_123',
    itens: [
      { produtoId: 'prod_001', quantidade: 2 }, // Produto da Empresa A
      { produtoId: 'prod_015', quantidade: 1 }, // Produto da Empresa B
      { produtoId: 'prod_003', quantidade: 5 }  // Produto da Empresa A
    ],
    formaPagamento: 'boleto_30_dd',
    observacoes: 'Entregar após 14h'
  };

  // 2. Identifica empresa de cada produto
  const itensComEmpresa = await Promise.all(
    pedidoData.itens.map(async item => {
      const produtoEmpresa = await produtoEmpresaRepository
        .findByProdutoId(item.produtoId);
      
      return {
        ...item,
        empresaId: produtoEmpresa.empresaId,
        codigoOmie: produtoEmpresa.codigoOmie
      };
    })
  );

  // 3. Agrupa por empresa
  const porEmpresa = groupBy(itensComEmpresa, 'empresaId');

  // 4. Para cada empresa, cria pedido no Omie
  const resultados = [];
  
  for (const [empresaId, itens] of Object.entries(porEmpresa)) {
    const empresa = await empresaRepository.findById(empresaId);
    const clienteOmie = await clienteService.obterCodigoOmie(
      pedidoData.clienteId, 
      empresaId
    );

    const omieService = new OmiePedidoService(
      omieClientFactory.create(empresa)
    );

    const pedidoOmie: PedidoOmiePayload = {
      cabecalho: {
        codigo_cliente: parseInt(clienteOmie),
        codigo_pedido_integracao: `ERP_${pedidoERP.id}_${empresaId}`,
        data_previsao: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        quantidade_itens: itens.length,
        valor_total: itens.reduce((sum, item) => 
          sum + (item.quantidade * item.precoUnitario), 0
        ),
        obs: pedidoData.observacoes
      },
      det: itens.map((item, index) => ({
        ide: {
          codigo_produto: parseInt(item.codigoOmie),
          quantidade: item.quantidade
        },
        produto: {
          valor_unitario: item.precoUnitario,
          valor_total: item.quantidade * item.precoUnitario
        }
      }))
    };

    try {
      const resultado = await omieService.incluir(pedidoOmie);
      resultados.push({
        empresaId,
        sucesso: true,
        codigoPedidoOmie: resultado.codigo_pedido,
        numeroPedido: resultado.numero_pedido
      });
    } catch (error) {
      resultados.push({
        empresaId,
        sucesso: false,
        erro: error.message
      });
      
      // Compensa: cancela pedidos já criados
      await compensarPedidos(resultados);
      throw error;
    }
  }

  return resultados;
}
```

## Resumo de Endpoints Utilizados

| Funcionalidade | Endpoint | Método Omie |
|----------------|----------|-------------|
| **Clientes** | | |
| Incluir | `/geral/clientes/` | `IncluirCliente` |
| Alterar | `/geral/clientes/` | `AlterarCliente` |
| Consultar | `/geral/clientes/` | `ConsultarCliente` |
| Listar | `/geral/clientes/` | `ListarClientes` |
| **Produtos** | | |
| Consultar | `/geral/produtos/` | `ConsultarProduto` |
| Listar | `/geral/produtos/` | `ListarProdutos` |
| Estoque | `/estoque/consulta/` | `ConsultarEstoque` |
| **Pedidos** | | |
| Incluir | `/produtos/pedido/` | `IncluirPedido` |
| Alterar | `/produtos/pedido/` | `AlterarPedido` |
| Consultar | `/produtos/pedido/` | `ConsultarPedido` |
| Faturar | `/produtos/pedidovendafat/` | `FaturarPedidoVenda` |
| Cancelar | `/produtos/pedido/` | `CancelarPedido` |
| **NF-e** | | |
| Consultar | `/produtos/nfconsultar/` | `ConsultarNF` |
| Listar | `/produtos/nfconsultar/` | `ListarNF` |
| Cancelar | `/produtos/nfe/` | `CancelarNF` |
