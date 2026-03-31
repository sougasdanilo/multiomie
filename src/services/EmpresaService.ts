import { prisma } from '../config/database';
import { Empresa } from '../entities';
import { encrypt, decrypt } from '../utils/encryption';
import { OmieIntegrationService } from '../integrations/OmieServices';

export interface CriarEmpresaDTO {
  nome: string;
  cnpj: string;
  nomeFantasia?: string;
  appKey: string;
  appSecret: string;
  configuracoes?: Record<string, unknown>;
}

export interface AtualizarEmpresaDTO {
  nome?: string;
  nomeFantasia?: string;
  appKey?: string;
  appSecret?: string;
  ativa?: boolean;
  configuracoes?: Record<string, unknown>;
}

export class EmpresaService {
  private omieIntegration: OmieIntegrationService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
  }

  /**
   * Cria uma nova empresa com credenciais Omie
   */
  async criar(dados: CriarEmpresaDTO): Promise<Empresa> {
    // Valida CNPJ único
    const existente = await prisma.empresa.findUnique({
      where: { cnpj: dados.cnpj }
    });

    if (existente) {
      throw new Error(`Empresa com CNPJ ${dados.cnpj} já existe`);
    }

    // Valida app_key único
    const appKeyExistente = await prisma.empresa.findFirst({
      where: { app_key: dados.appKey }
    });

    if (appKeyExistente) {
      throw new Error('App Key já está em uso por outra empresa');
    }

    // Criptografa app_secret
    const appSecretCriptografado = encrypt(dados.appSecret);

    // Cria empresa
    const empresa = await prisma.empresa.create({
      data: {
        nome: dados.nome,
        cnpj: dados.cnpj,
        nome_fantasia: dados.nomeFantasia,
        app_key: dados.appKey,
        app_secret: appSecretCriptografado,
        configuracoes: dados.configuracoes as any,
        ativa: true
      }
    });

    return this.mapToEntity(empresa);
  }

  /**
   * Atualiza empresa existente
   */
  async atualizar(id: string, dados: AtualizarEmpresaDTO): Promise<Empresa> {
    const empresa = await prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    const updateData: any = {};

    if (dados.nome) updateData.nome = dados.nome;
    if (dados.nomeFantasia !== undefined) updateData.nome_fantasia = dados.nomeFantasia;
    if (dados.ativa !== undefined) updateData.ativa = dados.ativa;
    if (dados.configuracoes) updateData.configuracoes = dados.configuracoes;
    
    if (dados.appKey) {
      const appKeyExistente = await prisma.empresa.findFirst({
        where: { app_key: dados.appKey, NOT: { id } }
      });
      if (appKeyExistente) {
        throw new Error('App Key já está em uso por outra empresa');
      }
      updateData.app_key = dados.appKey;
    }

    if (dados.appSecret) {
      updateData.app_secret = encrypt(dados.appSecret);
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { id },
      data: updateData
    });

    return this.mapToEntity(empresaAtualizada);
  }

  /**
   * Lista todas as empresas
   */
  async listar(ativo?: boolean): Promise<Empresa[]> {
    const where: any = {};
    if (ativo !== undefined) {
      where.ativa = ativo;
    }

    const empresas = await prisma.empresa.findMany({
      where,
      orderBy: { nome: 'asc' }
    });

    return empresas.map(e => this.mapToEntity(e));
  }

  /**
   * Obtém empresa por ID
   */
  async obterPorId(id: string): Promise<Empresa | null> {
    const empresa = await prisma.empresa.findUnique({ where: { id } });

    if (!empresa) return null;

    return this.mapToEntity(empresa);
  }

  /**
   * Obtém empresa por CNPJ
   */
  async obterPorCnpj(cnpj: string): Promise<Empresa | null> {
    const empresa = await prisma.empresa.findUnique({ where: { cnpj } });

    if (!empresa) return null;

    return this.mapToEntity(empresa);
  }

  /**
   * Obtém empresa por App Key
   */
  async obterPorAppKey(appKey: string): Promise<Empresa | null> {
    const empresa = await prisma.empresa.findFirst({ where: { app_key: appKey } });

    if (!empresa) return null;

    return this.mapToEntity(empresa);
  }

  /**
   * Remove empresa (soft delete via ativa=false)
   */
  async desativar(id: string): Promise<void> {
    const empresa = await prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    await prisma.empresa.update({
      where: { id },
      data: { ativa: false }
    });
  }

  /**
   * Testa conexão com API Omie
   */
  async testarConexao(id: string): Promise<{ sucesso: boolean; mensagem: string }> {
    const empresa = await this.obterPorId(id);

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    try {
      const clienteService = this.omieIntegration.getClienteService(empresa);
      
      // Tenta listar clientes (apenas para testar conexão)
      await clienteService.listar(1, 1);

      return {
        sucesso: true,
        mensagem: 'Conexão com Omie API estabelecida com sucesso'
      };
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: `Falha na conexão: ${error.message}`
      };
    }
  }

  /**
   * Obtém estatísticas da empresa
   */
  async obterEstatisticas(id: string): Promise<{
    totalClientes: number;
    totalProdutos: number;
    totalPedidos: number;
    totalNotasFiscais: number;
  }> {
    const empresa = await prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    const [
      totalClientes,
      totalProdutos,
      totalPedidos,
      totalNotasFiscais
    ] = await Promise.all([
      prisma.clienteEmpresa.count({ where: { empresa_id: id } }),
      prisma.produtoEmpresa.count({ where: { empresa_id: id } }),
      prisma.pedidoEmpresa.count({ where: { empresa_id: id } }),
      prisma.notaFiscal.count({ where: { empresa_id: id } })
    ]);

    return {
      totalClientes,
      totalProdutos,
      totalPedidos,
      totalNotasFiscais
    };
  }

  private mapToEntity(empresa: any): Empresa {
    return {
      id: empresa.id,
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      nomeFantasia: empresa.nome_fantasia || undefined,
      appKey: empresa.app_key,
      appSecret: empresa.app_secret,
      ativa: empresa.ativa,
      configuracoes: empresa.configuracoes as Record<string, unknown> | undefined,
      createdAt: empresa.created_at,
      updatedAt: empresa.updated_at
    };
  }
}
