import { ClienteService } from '../services/ClienteService.js';
export class ClienteController {
    clienteService;
    constructor() {
        this.clienteService = new ClienteService();
    }
    async criar(req, res) {
        try {
            const resultado = await this.clienteService.cadastrarCliente(req.body);
            res.status(201).json({
                success: true,
                data: {
                    cliente: resultado.cliente,
                    sincronizacoes: resultado.sincronizacoes
                }
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    async listar(req, res) {
        try {
            const skip = parseInt(req.query.skip) || 0;
            const take = parseInt(req.query.take) || 50;
            const clientes = await this.clienteService.listarClientes(skip, take);
            res.json({
                success: true,
                data: clientes,
                meta: { skip, take }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async obterPorId(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID do cliente é obrigatório' });
                return;
            }
            const cliente = await this.clienteService.obterCliente(id);
            if (!cliente) {
                res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado'
                });
                return;
            }
            res.json({
                success: true,
                data: cliente
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async obterPorCpfCnpj(req, res) {
        try {
            const { cpfCnpj } = req.params;
            if (!cpfCnpj) {
                res.status(400).json({ success: false, error: 'CPF/CNPJ é obrigatório' });
                return;
            }
            const cliente = await this.clienteService.obterClientePorCpfCnpj(cpfCnpj);
            if (!cliente) {
                res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado'
                });
                return;
            }
            res.json({
                success: true,
                data: cliente
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async reprocessarSincronizacoes(req, res) {
        try {
            const resultado = await this.clienteService.reprocessarPendentes();
            res.json({
                success: true,
                data: resultado
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
//# sourceMappingURL=ClienteController.js.map