import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { PedidoController } from '../controllers/PedidoController';
import { ProdutoController } from '../controllers/ProdutoController';
import { WebhookController } from '../controllers/WebhookController';

const router = Router();

// Controllers
const clienteController = new ClienteController();
const pedidoController = new PedidoController();
const produtoController = new ProdutoController();
const webhookController = new WebhookController();

// Clientes
router.post('/clientes', (req, res) => clienteController.criar(req, res));
router.get('/clientes', (req, res) => clienteController.listar(req, res));
router.get('/clientes/:id', (req, res) => clienteController.obterPorId(req, res));
router.get('/clientes/cpf-cnpj/:cpfCnpj', (req, res) => clienteController.obterPorCpfCnpj(req, res));
router.post('/clientes/reprocessar-sincronizacoes', (req, res) => clienteController.reprocessarSincronizacoes(req, res));

// Produtos
router.post('/produtos/sincronizar/:empresaId', (req, res) => produtoController.sincronizarEmpresa(req, res));
router.get('/produtos/empresa/:empresaId', (req, res) => produtoController.listarPorEmpresa(req, res));
router.get('/produtos/:produtoId/estoque/:empresaId', (req, res) => produtoController.consultarEstoque(req, res));

// Pedidos
router.post('/pedidos', (req, res) => pedidoController.criar(req, res));
router.get('/pedidos', (req, res) => pedidoController.listar(req, res));
router.get('/pedidos/:id', (req, res) => pedidoController.obterPorId(req, res));
router.post('/pedidos/:id/processar', (req, res) => pedidoController.processar(req, res));
router.post('/pedidos/:id/faturar', (req, res) => pedidoController.faturar(req, res));

// Webhooks Omie
router.post('/webhooks/nfe/emitida', (req, res) => webhookController.handleNfeEmitida(req, res));
router.post('/webhooks/pedido/faturado', (req, res) => webhookController.handlePedidoFaturado(req, res));

export default router;
