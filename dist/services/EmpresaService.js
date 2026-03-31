import { prisma } from '../config/database.js';
import { encrypt } from '../utils/encryption.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
export class EmpresaService {
    omieIntegration;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
    }
    async criar(dados) {
        const existente = await prisma.empresa.findUnique({
            where: { cnpj: dados.cnpj }
        });
        if (existente) {
            throw new Error(`Empresa com CNPJ ${dados.cnpj} já existe`);
        }
        const appKeyExistente = await prisma.empresa.findFirst({
            where: { app_key: dados.appKey }
        });
        if (appKeyExistente) {
            throw new Error('App Key já está em uso por outra empresa');
        }
        const appSecretCriptografado = encrypt(dados.appSecret);
        const empresa = await prisma.empresa.create({
            data: {
                nome: dados.nome,
                cnpj: dados.cnpj,
                nome_fantasia: dados.nomeFantasia,
                app_key: dados.appKey,
                app_secret: appSecretCriptografado,
                configuracoes: dados.configuracoes,
                ativa: true
            }
        });
        return this.mapToEntity(empresa);
    }
    async atualizar(id, dados) {
        const empresa = await prisma.empresa.findUnique({ where: { id } });
        if (!empresa) {
            throw new Error('Empresa não encontrada');
        }
        const updateData = {};
        if (dados.nome)
            updateData.nome = dados.nome;
        if (dados.nomeFantasia !== undefined)
            updateData.nome_fantasia = dados.nomeFantasia;
        if (dados.ativa !== undefined)
            updateData.ativa = dados.ativa;
        if (dados.configuracoes)
            updateData.configuracoes = dados.configuracoes;
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
    async listar(ativo) {
        const where = {};
        if (ativo !== undefined) {
            where.ativa = ativo;
        }
        const empresas = await prisma.empresa.findMany({
            where,
            orderBy: { nome: 'asc' }
        });
        return empresas.map(e => this.mapToEntity(e));
    }
    async obterPorId(id) {
        const empresa = await prisma.empresa.findUnique({ where: { id } });
        if (!empresa)
            return null;
        return this.mapToEntity(empresa);
    }
    async obterPorCnpj(cnpj) {
        const empresa = await prisma.empresa.findUnique({ where: { cnpj } });
        if (!empresa)
            return null;
        return this.mapToEntity(empresa);
    }
    async obterPorAppKey(appKey) {
        const empresa = await prisma.empresa.findFirst({ where: { app_key: appKey } });
        if (!empresa)
            return null;
        return this.mapToEntity(empresa);
    }
    async desativar(id) {
        const empresa = await prisma.empresa.findUnique({ where: { id } });
        if (!empresa) {
            throw new Error('Empresa não encontrada');
        }
        await prisma.empresa.update({
            where: { id },
            data: { ativa: false }
        });
    }
    async testarConexao(id) {
        const empresa = await this.obterPorId(id);
        if (!empresa) {
            throw new Error('Empresa não encontrada');
        }
        try {
            const clienteService = this.omieIntegration.getClienteService(empresa);
            await clienteService.listar(1, 1);
            return {
                sucesso: true,
                mensagem: 'Conexão com Omie API estabelecida com sucesso'
            };
        }
        catch (error) {
            return {
                sucesso: false,
                mensagem: `Falha na conexão: ${error.message}`
            };
        }
    }
    async obterEstatisticas(id) {
        const empresa = await prisma.empresa.findUnique({ where: { id } });
        if (!empresa) {
            throw new Error('Empresa não encontrada');
        }
        const [totalClientes, totalProdutos, totalPedidos, totalNotasFiscais] = await Promise.all([
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
    mapToEntity(empresa) {
        return {
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
        };
    }
}
//# sourceMappingURL=EmpresaService.js.map