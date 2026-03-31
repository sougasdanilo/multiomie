import { sql } from '../config/database.js';
import { encrypt } from '../utils/encryption.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
export class EmpresaService {
    omieIntegration;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
    }
    async criar(dados) {
        const existente = await sql `SELECT * FROM empresas WHERE cnpj = ${dados.cnpj} LIMIT 1`;
        if (existente.length) {
            throw new Error(`Empresa com CNPJ ${dados.cnpj} já existe`);
        }
        const appKeyExistente = await sql `SELECT * FROM empresas WHERE app_key = ${dados.appKey} LIMIT 1`;
        if (appKeyExistente.length) {
            throw new Error('App Key já está em uso por outra empresa');
        }
        const appSecretCriptografado = encrypt(dados.appSecret);
        const empresa = await sql `
      INSERT INTO empresas (nome, cnpj, nome_fantasia, app_key, app_secret, configuracoes, ativa)
      VALUES (${dados.nome}, ${dados.cnpj}, ${dados.nomeFantasia}, ${dados.appKey}, ${appSecretCriptografado}, ${JSON.stringify(dados.configuracoes)}, ${true})
      RETURNING *
    `;
        return this.mapToEntity(empresa[0]);
    }
    async atualizar(id, dados) {
        const empresa = await sql `SELECT * FROM empresas WHERE id = ${id} LIMIT 1`;
        if (!empresa.length) {
            throw new Error('Empresa não encontrada');
        }
        if (dados.appKey) {
            const appKeyExistente = await sql `SELECT * FROM empresas WHERE app_key = ${dados.appKey} AND id != ${id} LIMIT 1`;
            if (appKeyExistente.length) {
                throw new Error('App Key já está em uso por outra empresa');
            }
        }
        const empresaAtualizada = await sql `
      UPDATE empresas 
      SET 
        nome = COALESCE(${dados.nome}, nome),
        nome_fantasia = COALESCE(${dados.nomeFantasia}, nome_fantasia),
        ativa = COALESCE(${dados.ativa}, ativa),
        configuracoes = COALESCE(${JSON.stringify(dados.configuracoes)}, configuracoes),
        app_key = COALESCE(${dados.appKey}, app_key),
        app_secret = COALESCE(${dados.appSecret ? encrypt(dados.appSecret) : null}, app_secret)
      WHERE id = ${id}
      RETURNING *
    `;
        return this.mapToEntity(empresaAtualizada[0]);
    }
    async listar(ativo) {
        let empresas;
        if (ativo !== undefined) {
            empresas = await sql `SELECT * FROM empresas WHERE ativa = ${ativo} ORDER BY nome ASC`;
        }
        else {
            empresas = await sql `SELECT * FROM empresas ORDER BY nome ASC`;
        }
        return empresas.map((e) => this.mapToEntity(e));
    }
    async obterPorId(id) {
        const empresa = await sql `SELECT * FROM empresas WHERE id = ${id} LIMIT 1`;
        if (!empresa.length)
            return null;
        return this.mapToEntity(empresa[0]);
    }
    async obterPorCnpj(cnpj) {
        const empresa = await sql `SELECT * FROM empresas WHERE cnpj = ${cnpj} LIMIT 1`;
        if (!empresa.length)
            return null;
        return this.mapToEntity(empresa[0]);
    }
    async obterPorAppKey(appKey) {
        const empresa = await sql `SELECT * FROM empresas WHERE app_key = ${appKey} LIMIT 1`;
        if (!empresa.length)
            return null;
        return this.mapToEntity(empresa[0]);
    }
    async desativar(id) {
        const empresa = await sql `SELECT * FROM empresas WHERE id = ${id} LIMIT 1`;
        if (!empresa.length) {
            throw new Error('Empresa não encontrada');
        }
        await sql `UPDATE empresas SET ativa = false WHERE id = ${id}`;
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
        const empresa = await sql `SELECT * FROM empresas WHERE id = ${id} LIMIT 1`;
        if (!empresa.length) {
            throw new Error('Empresa não encontrada');
        }
        const [totalClientes, totalProdutos, totalPedidos, totalNotasFiscais] = await Promise.all([
            sql `SELECT COUNT(*) as count FROM cliente_empresa WHERE empresa_id = ${id}`,
            sql `SELECT COUNT(*) as count FROM produto_empresa WHERE empresa_id = ${id}`,
            sql `SELECT COUNT(*) as count FROM pedido_empresa WHERE empresa_id = ${id}`,
            sql `SELECT COUNT(*) as count FROM notas_fiscais WHERE empresa_id = ${id}`
        ]);
        return {
            totalClientes: parseInt(totalClientes[0].count),
            totalProdutos: parseInt(totalProdutos[0].count),
            totalPedidos: parseInt(totalPedidos[0].count),
            totalNotasFiscais: parseInt(totalNotasFiscais[0].count)
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