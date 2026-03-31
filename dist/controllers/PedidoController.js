import { PedidoService } from '../services/PedidoService.js';
export class PedidoController {
    pedidoService;
    constructor() {
        this.pedidoService = new PedidoService();
    }
    async criar(req, res) {
        try {
            const dados = req.body;
            const pedido = await this.pedidoService.criarPedido(dados);
            res.status(201).json({
                success: true,
                data: pedido
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    async processar(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
                return;
            }
            const pedido = await this.pedidoService.processarPedido(id);
            res.json({
                success: true,
                data: pedido,
                message: 'Pedido processado com sucesso em todas as empresas'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    async faturar(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
                return;
            }
            const pedido = await this.pedidoService.faturarPedido(id);
            res.json({
                success: true,
                data: pedido,
                message: 'Pedido faturado com sucesso'
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
            const status = req.query.status;
            const clienteId = req.query.clienteId;
            const pedidos = await this.pedidoService.listarPedidos(skip, take, {
                status,
                clienteId
            });
            res.json({
                success: true,
                data: pedidos,
                meta: { skip, take, filtros: { status, clienteId } }
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
                res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
                return;
            }
            const pedido = await this.pedidoService.obterPedido(id);
            if (!pedido) {
                res.status(404).json({
                    success: false,
                    error: 'Pedido não encontrado'
                });
                return;
            }
            res.json({
                success: true,
                data: pedido
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
//# sourceMappingURL=PedidoController.js.map