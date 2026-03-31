import { PrismaClient, Cliente, Empresa } from '@prisma/client';
import { prisma } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
import { Cliente as ClienteEntity, ClienteEmpresa, Endereco, DadosFiscais } from '../entities/index.js';
import { encrypt } from '../utils/encryption.js';

export interface CadastroClienteDTO {
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: Endereco;
  dadosFiscais?: DadosFiscais;
}

export interface SincronizacaoResult {
  empresaId: string;
  empresaNome: string;
  sucesso: boolean;
  codigoOmie?: string;
  erro?: string;
}

export class ClienteService {
  private omieIntegration: OmieIntegrationService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
  }

  /**
   * Cadastra cliente no ERP e sincroniza com todas as empresas Omie
   */
  async cadastrarCliente(dados: CadastroClienteDTO): Promise<{ 
    cliente: ClienteEntity; 
    sincronizacoes: SincronizacaoResult[] 
  }> {
    // Valida se já existe
    const existente = await prisma.cliente.findUnique({
      where: { cpf_cnpj: dados.cpfCnpj }
    });

    if (existente) {
      throw new Error(`Cliente com CPF/CNPJ ${dados.cpfCnpj} já existe`);
    }

    // Cria cliente no ERP (master)
    const cliente = await prisma.cliente.create({
      data: {
        nome: dados.nome,
        cpf_cnpj: dados.cpfCnpj,
        email: dados.email,
        telefone: dados.telefone,
        celular: dados.celular,
        endereco: dados.endereco as any,
        ie: dados.dadosFiscais?.ie,
        im: dados.dadosFiscais?.im,
        tipo_contribuinte: dados.dadosFiscais?.tipoContribuinte
      }
    });

    // Busca todas as empresas ativas
    const empresas = await prisma.empresa.findMany({
      where: { ativa: true }
    });

    // Sincroniza com cada empresa
    const resultados: SincronizacaoResult[] = [];
    
    for (const empresa of empresas) {
      try {
        const codigoOmie = await this.sincronizarComEmpresa(cliente, empresa);
        resultados.push({
          empresaId: empresa.id,
          empresaNome: empresa.nome,
          sucesso: true,
          codigoOmie
        });
      } catch (error: any) {
        resultados.push({
          empresaId: empresa.id,
          empresaNome: empresa.nome,
          sucesso: false,
          erro: error.message
        });
      }
    }

    return {
      cliente: this.mapToEntity(cliente),
      sincronizacoes: resultados
    };
  }

  /**
   * Sincroniza cliente específico com uma empresa
   */
  private async sincronizarComEmpresa(
    cliente: Cliente,
    empresa: Empresa
  ): Promise<string> {
    // Verifica se já existe vínculo
    const existente = await prisma.clienteEmpresa.findUnique({
      where: {
        cliente_id_empresa_id: {
          cliente_id: cliente.id,
          empresa_id: empresa.id
        }
      }
    });

    const omieService = this.omieIntegration.getClienteService({
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
    });

    const payload = {
      codigo_cliente_integracao: `ERP_${cliente.id}`,
      razao_social: cliente.nome,
      nome_fantasia: cliente.nome,
      cnpj_cpf: cliente.cpf_cnpj.replace(/[^0-9]/g, ''),
      email: cliente.email || undefined,
      telefone1_numero: cliente.telefone?.replace(/[^0-9]/g, ''),
      telefone2_numero: cliente.celular?.replace(/[^0-9]/g, ''),
      endereco: cliente.endereco ? (cliente.endereco as any).logradouro : undefined,
      endereco_numero: cliente.endereco ? (cliente.endereco as any).numero : undefined,
      bairro: cliente.endereco ? (cliente.endereco as any).bairro : undefined,
      cidade: cliente.endereco ? (cliente.endereco as any).cidade : undefined,
      estado: cliente.endereco ? (cliente.endereco as any).estado : undefined,
      cep: cliente.endereco ? (cliente.endereco as any).cep?.replace(/[^0-9]/g, '') : undefined,
      codigo_pais: cliente.endereco ? ((cliente.endereco as any).codigoPais || '1058') : '1058',
      contribuinte: (cliente.tipo_contribuinte as any) || '9',
      tags: [{ tag: 'ERP' }]
    };

    let resultado: { codigo_cliente_omie: number };

    try {
      if (existente?.codigo_omie) {
        // Atualiza existente
        resultado = await omieService.alterar({
          ...payload,
          codigo_cliente_omie: parseInt(existente.codigo_omie)
        });
      } else {
        // Cria novo
        resultado = await omieService.incluir(payload);
      }

      // Salva/Atualiza vínculo
      await prisma.clienteEmpresa.upsert({
        where: {
          cliente_id_empresa_id: {
            cliente_id: cliente.id,
            empresa_id: empresa.id
          }
        },
        create: {
          cliente_id: cliente.id,
          empresa_id: empresa.id,
          codigo_omie: resultado.codigo_cliente_omie.toString(),
          sync_status: 'SYNCED',
          last_sync: new Date()
        },
        update: {
          codigo_omie: resultado.codigo_cliente_omie.toString(),
          sync_status: 'SYNCED',
          last_sync: new Date(),
          sync_error: null
        }
      });

      return resultado.codigo_cliente_omie.toString();

    } catch (error: any) {
      // Registra falha
      await prisma.clienteEmpresa.upsert({
        where: {
          cliente_id_empresa_id: {
            cliente_id: cliente.id,
            empresa_id: empresa.id
          }
        },
        create: {
          cliente_id: cliente.id,
          empresa_id: empresa.id,
          codigo_omie: existente?.codigo_omie || '',
          sync_status: 'ERROR',
          sync_error: error.message,
          last_sync: new Date()
        },
        update: {
          sync_status: 'ERROR',
          sync_error: error.message,
          last_sync: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Obtém código do cliente em uma empresa específica
   */
  async obterCodigoOmie(clienteId: string, empresaId: string): Promise<string> {
    const vinculo = await prisma.clienteEmpresa.findUnique({
      where: {
        cliente_id_empresa_id: {
          cliente_id: clienteId,
          empresa_id: empresaId
        }
      }
    });

    if (!vinculo || vinculo.sync_status !== 'SYNCED') {
      // Tenta sincronizar on-demand
      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
      const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });

      if (!cliente || !empresa) {
        throw new Error('Cliente ou empresa não encontrado');
      }

      return await this.sincronizarComEmpresa(cliente, empresa);
    }

    return vinculo.codigo_omie;
  }

  /**
   * Lista todos os clientes
   */
  async listarClientes(skip: number = 0, take: number = 50): Promise<ClienteEntity[]> {
    const clientes = await prisma.cliente.findMany({
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });

    return clientes.map(c => this.mapToEntity(c));
  }

  /**
   * Busca cliente por ID
   */
  async obterCliente(id: string): Promise<ClienteEntity | null> {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        clienteEmpresas: {
          include: { empresa: true }
        }
      }
    });

    if (!cliente) return null;

    return this.mapToEntity(cliente);
  }

  /**
   * Busca cliente por CPF/CNPJ
   */
  async obterClientePorCpfCnpj(cpfCnpj: string): Promise<ClienteEntity | null> {
    const cliente = await prisma.cliente.findUnique({
      where: { cpf_cnpj: cpfCnpj }
    });

    if (!cliente) return null;

    return this.mapToEntity(cliente);
  }

  /**
   * Reprocessa sincronizações pendentes
   */
  async reprocessarPendentes(): Promise<{ total: number; sucessos: number; falhas: number }> {
    const pendentes = await prisma.clienteEmpresa.findMany({
      where: { sync_status: 'ERROR' },
      include: { cliente: true, empresa: true }
    });

    let sucessos = 0;
    let falhas = 0;

    for (const pendente of pendentes) {
      try {
        await this.sincronizarComEmpresa(pendente.cliente, pendente.empresa);
        sucessos++;
      } catch (error) {
        falhas++;
      }
    }

    return {
      total: pendentes.length,
      sucessos,
      falhas
    };
  }

  private mapToEntity(cliente: any): ClienteEntity {
    return {
      id: cliente.id,
      nome: cliente.nome,
      cpfCnpj: cliente.cpf_cnpj,
      email: cliente.email || undefined,
      telefone: cliente.telefone || undefined,
      celular: cliente.celular || undefined,
      endereco: cliente.endereco as Endereco || undefined,
      dadosFiscais: {
        ie: cliente.ie || undefined,
        im: cliente.im || undefined,
        tipoContribuinte: cliente.tipo_contribuinte as any
      },
      createdAt: cliente.created_at,
      updatedAt: cliente.updated_at
    };
  }
}
