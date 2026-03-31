import { prisma } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
export class ClienteService {
    omieIntegration;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
    }
    async cadastrarCliente(dados) {
        const existente = await prisma.cliente.findUnique({
            where: { cpf_cnpj: dados.cpfCnpj }
        });
        if (existente) {
            throw new Error(`Cliente com CPF/CNPJ ${dados.cpfCnpj} já existe`);
        }
        const cliente = await prisma.cliente.create({
            data: {
                nome: dados.nome,
                cpf_cnpj: dados.cpfCnpj,
                email: dados.email,
                telefone: dados.telefone,
                celular: dados.celular,
                endereco: dados.endereco,
                ie: dados.dadosFiscais?.ie,
                im: dados.dadosFiscais?.im,
                tipo_contribuinte: dados.dadosFiscais?.tipoContribuinte
            }
        });
        const empresas = await prisma.empresa.findMany({
            where: { ativa: true }
        });
        const resultados = [];
        for (const empresa of empresas) {
            try {
                const codigoOmie = await this.sincronizarComEmpresa(cliente, empresa);
                resultados.push({
                    empresaId: empresa.id,
                    empresaNome: empresa.nome,
                    sucesso: true,
                    codigoOmie
                });
            }
            catch (error) {
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
    async sincronizarComEmpresa(cliente, empresa) {
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
            configuracoes: empresa.configuracoes,
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
            endereco: cliente.endereco ? cliente.endereco.logradouro : undefined,
            endereco_numero: cliente.endereco ? cliente.endereco.numero : undefined,
            bairro: cliente.endereco ? cliente.endereco.bairro : undefined,
            cidade: cliente.endereco ? cliente.endereco.cidade : undefined,
            estado: cliente.endereco ? cliente.endereco.estado : undefined,
            cep: cliente.endereco ? cliente.endereco.cep?.replace(/[^0-9]/g, '') : undefined,
            codigo_pais: cliente.endereco ? (cliente.endereco.codigoPais || '1058') : '1058',
            contribuinte: cliente.tipo_contribuinte || '9',
            tags: [{ tag: 'ERP' }]
        };
        let resultado;
        try {
            if (existente?.codigo_omie) {
                resultado = await omieService.alterar({
                    ...payload,
                    codigo_cliente_omie: parseInt(existente.codigo_omie)
                });
            }
            else {
                resultado = await omieService.incluir(payload);
            }
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
        }
        catch (error) {
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
    async obterCodigoOmie(clienteId, empresaId) {
        const vinculo = await prisma.clienteEmpresa.findUnique({
            where: {
                cliente_id_empresa_id: {
                    cliente_id: clienteId,
                    empresa_id: empresaId
                }
            }
        });
        if (!vinculo || vinculo.sync_status !== 'SYNCED') {
            const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
            const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
            if (!cliente || !empresa) {
                throw new Error('Cliente ou empresa não encontrado');
            }
            return await this.sincronizarComEmpresa(cliente, empresa);
        }
        return vinculo.codigo_omie;
    }
    async listarClientes(skip = 0, take = 50) {
        const clientes = await prisma.cliente.findMany({
            skip,
            take,
            orderBy: { created_at: 'desc' }
        });
        return clientes.map(c => this.mapToEntity(c));
    }
    async obterCliente(id) {
        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: {
                clienteEmpresas: {
                    include: { empresa: true }
                }
            }
        });
        if (!cliente)
            return null;
        return this.mapToEntity(cliente);
    }
    async obterClientePorCpfCnpj(cpfCnpj) {
        const cliente = await prisma.cliente.findUnique({
            where: { cpf_cnpj: cpfCnpj }
        });
        if (!cliente)
            return null;
        return this.mapToEntity(cliente);
    }
    async reprocessarPendentes() {
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
            }
            catch (error) {
                falhas++;
            }
        }
        return {
            total: pendentes.length,
            sucessos,
            falhas
        };
    }
    mapToEntity(cliente) {
        return {
            id: cliente.id,
            nome: cliente.nome,
            cpfCnpj: cliente.cpf_cnpj,
            email: cliente.email || undefined,
            telefone: cliente.telefone || undefined,
            celular: cliente.celular || undefined,
            endereco: cliente.endereco || undefined,
            dadosFiscais: {
                ie: cliente.ie || undefined,
                im: cliente.im || undefined,
                tipoContribuinte: cliente.tipo_contribuinte
            },
            createdAt: cliente.created_at,
            updatedAt: cliente.updated_at
        };
    }
}
//# sourceMappingURL=ClienteService.js.map