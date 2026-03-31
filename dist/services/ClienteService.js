import { sql } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
export class ClienteService {
    omieIntegration;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
    }
    async cadastrarCliente(dados) {
        const existente = await sql `
      SELECT * FROM clientes WHERE cpf_cnpj = ${dados.cpfCnpj} LIMIT 1
    `;
        if (existente.length) {
            throw new Error(`Cliente com CPF/CNPJ ${dados.cpfCnpj} já existe`);
        }
        const cliente = await sql `
      INSERT INTO clientes (
        nome, cpf_cnpj, email, telefone, celular, endereco, 
        ie, im, tipo_contribuinte
      ) VALUES (
        ${dados.nome}, ${dados.cpfCnpj}, ${dados.email}, ${dados.telefone}, 
        ${dados.celular}, ${JSON.stringify(dados.endereco)}, ${dados.dadosFiscais?.ie}, 
        ${dados.dadosFiscais?.im}, ${dados.dadosFiscais?.tipoContribuinte}
      ) RETURNING *
    `;
        const empresas = await sql `SELECT * FROM empresas WHERE ativa = true`;
        const resultados = [];
        for (const empresa of empresas) {
            try {
                const codigoOmie = await this.sincronizarComEmpresa(cliente[0], empresa);
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
            cliente: this.mapToEntity(cliente[0]),
            sincronizacoes: resultados
        };
    }
    async sincronizarComEmpresa(cliente, empresa) {
        const existente = await sql `
      SELECT * FROM cliente_empresa 
      WHERE cliente_id = ${cliente.id} AND empresa_id = ${empresa.id}
      LIMIT 1
    `;
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
            if (existente.length && existente[0].codigo_omie) {
                resultado = await omieService.alterar({
                    ...payload,
                    codigo_cliente_omie: parseInt(existente[0].codigo_omie)
                });
            }
            else {
                resultado = await omieService.incluir(payload);
            }
            if (existente.length) {
                await sql `
          UPDATE cliente_empresa 
          SET codigo_omie = ${resultado.codigo_cliente_omie.toString()}, 
              sync_status = 'SYNCED',
              last_sync = NOW()
          WHERE cliente_id = ${cliente.id} AND empresa_id = ${empresa.id}
        `;
            }
            else {
                await sql `
          INSERT INTO cliente_empresa (
            cliente_id, empresa_id, codigo_omie, sync_status, last_sync
          ) VALUES (
            ${cliente.id}, ${empresa.id}, ${resultado.codigo_cliente_omie.toString()}, 
            'SYNCED', NOW()
          )
        `;
            }
            return resultado.codigo_cliente_omie.toString();
        }
        catch (error) {
            if (existente.length) {
                await sql `UPDATE cliente_empresa SET sync_status = 'ERROR', sync_error = ${error.message}, last_sync = NOW() WHERE cliente_id = ${cliente.id} AND empresa_id = ${empresa.id}`;
            }
            else {
                await sql `INSERT INTO cliente_empresa (cliente_id, empresa_id, sync_status, sync_error, last_sync) VALUES (${cliente.id}, ${empresa.id}, 'ERROR', ${error.message}, NOW())`;
            }
            throw error;
        }
    }
    async obterCodigoOmie(clienteId, empresaId) {
        const vinculo = await sql `SELECT * FROM cliente_empresa WHERE cliente_id = ${clienteId} AND empresa_id = ${empresaId} LIMIT 1`;
        if (!vinculo.length || vinculo[0].sync_status !== 'SYNCED') {
            const cliente = await sql `SELECT * FROM clientes WHERE id = ${clienteId} LIMIT 1`;
            const empresa = await sql `SELECT * FROM empresas WHERE id = ${empresaId} LIMIT 1`;
            if (!cliente.length || !empresa.length) {
                throw new Error('Cliente ou empresa não encontrado');
            }
            return await this.sincronizarComEmpresa(cliente[0], empresa[0]);
        }
        return vinculo[0].codigo_omie;
    }
    async listarClientes(skip = 0, take = 50) {
        const clientes = await sql `SELECT * FROM clientes ORDER BY created_at DESC LIMIT ${take} OFFSET ${skip}`;
        return clientes.map((c) => this.mapToEntity(c));
    }
    async obterCliente(id) {
        const cliente = await sql `SELECT * FROM clientes WHERE id = ${id} LIMIT 1`;
        if (!cliente.length)
            return null;
        return this.mapToEntity(cliente[0]);
    }
    async obterClientePorCpfCnpj(cpfCnpj) {
        const cliente = await sql `SELECT * FROM clientes WHERE cpf_cnpj = ${cpfCnpj} LIMIT 1`;
        if (!cliente.length)
            return null;
        return this.mapToEntity(cliente[0]);
    }
    async reprocessarPendentes() {
        const pendentes = await sql `SELECT * FROM cliente_empresa WHERE sync_status IN ('PENDING', 'ERROR')`;
        let sucessos = 0;
        let falhas = 0;
        for (const pendente of pendentes) {
            try {
                const cliente = await sql `SELECT * FROM clientes WHERE id = ${pendente.cliente_id} LIMIT 1`;
                const empresa = await sql `SELECT * FROM empresas WHERE id = ${pendente.empresa_id} LIMIT 1`;
                if (cliente.length && empresa.length) {
                    await this.sincronizarComEmpresa(cliente[0], empresa[0]);
                    sucessos++;
                }
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