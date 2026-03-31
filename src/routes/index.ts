import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { PedidoController } from '../controllers/PedidoController';
import { ProdutoController } from '../controllers/ProdutoController';
import { EmpresaController } from '../controllers/EmpresaController';
import { SincronizacaoController } from '../controllers/SincronizacaoController';
import { DashboardController } from '../controllers/DashboardController';
import { WebhookController } from '../controllers/WebhookController';
import { authMiddleware } from '../middlewares/auth';
import { requestLogger } from '../middlewares/logger';

const router = Router();

// Logger middleware para todas as rotas
router.use(requestLogger);

// Controllers
const clienteController = new ClienteController();
const pedidoController = new PedidoController();
const produtoController = new ProdutoController();
const empresaController = new EmpresaController();
const sincronizacaoController = new SincronizacaoController();
const dashboardController = new DashboardController();
const webhookController = new WebhookController();

// ============ DASHBOARD ============
router.get('/dashboard/resumo', (req, res) => dashboardController.getResumo(req, res));
router.get('/dashboard/integracao', (req, res) => dashboardController.getStatusIntegracao(req, res));
router.get('/dashboard/circuit-breakers', (req, res) => dashboardController.getCircuitBreakerStatus(req, res));
router.get('/dashboard/pedidos-recentes', (req, res) => dashboardController.getPedidosRecentes(req, res));
router.get('/dashboard/notas-fiscais-recentes', (req, res) => dashboardController.getNotasFiscaisRecentes(req, res));
router.get('/dashboard/system-status', (req, res) => dashboardController.getSystemStatus(req, res));

// ============ EMPRESAS ============
router.post('/empresas', (req, res) => empresaController.criar(req, res));
router.get('/empresas', (req, res) => empresaController.listar(req, res));
router.get('/empresas/:id', (req, res) => empresaController.obterPorId(req, res));
router.put('/empresas/:id', (req, res) => empresaController.atualizar(req, res));
router.delete('/empresas/:id', (req, res) => empresaController.desativar(req, res));
router.post('/empresas/:id/testar-conexao', (req, res) => empresaController.testarConexao(req, res));
router.get('/empresas/:id/estatisticas', (req, res) => empresaController.obterEstatisticas(req, res));

// ============ CLIENTES ============
router.post('/clientes', (req, res) => clienteController.criar(req, res));
router.get('/clientes', (req, res) => clienteController.listar(req, res));
router.get('/clientes/:id', (req, res) => clienteController.obterPorId(req, res));
router.get('/clientes/cpf-cnpj/:cpfCnpj', (req, res) => clienteController.obterPorCpfCnpj(req, res));
router.post('/clientes/reprocessar-sincronizacoes', (req, res) => clienteController.reprocessarSincronizacoes(req, res));

// ============ PRODUTOS ============
router.post('/produtos/sincronizar/:empresaId', (req, res) => produtoController.sincronizarEmpresa(req, res));
router.get('/produtos/empresa/:empresaId', (req, res) => produtoController.listarPorEmpresa(req, res));
router.get('/produtos/:produtoId/estoque/:empresaId', (req, res) => produtoController.consultarEstoque(req, res));

// ============ PEDIDOS ============
router.post('/pedidos', (req, res) => pedidoController.criar(req, res));
router.get('/pedidos', (req, res) => pedidoController.listar(req, res));
router.get('/pedidos/:id', (req, res) => pedidoController.obterPorId(req, res));
router.post('/pedidos/:id/processar', (req, res) => pedidoController.processar(req, res));
router.post('/pedidos/:id/faturar', (req, res) => pedidoController.faturar(req, res));

// ============ SINCRONIZAÇÃO ============
router.post('/sincronizacao/produtos/:empresaId', (req, res) => sincronizacaoController.sincronizarProdutos(req, res));
router.post('/sincronizacao/clientes', (req, res) => sincronizacaoController.sincronizarClientesTodasEmpresas(req, res));
router.post('/sincronizacao/estoque/:empresaId', (req, res) => sincronizacaoController.atualizarEstoqueEmpresa(req, res));
router.post('/sincronizacao/pedidos/:pedidoId/processar', (req, res) => sincronizacaoController.processarPedidoAsync(req, res));
router.post('/sincronizacao/pedidos/:pedidoId/faturar', (req, res) => sincronizacaoController.faturarPedidoAsync(req, res));
router.get('/sincronizacao/status', (req, res) => sincronizacaoController.obterStatusFilas(req, res));

// ============ WEBHOOKS OMIE ============
router.post('/webhooks/nfe/emitida', (req, res) => webhookController.handleNfeEmitida(req, res));
router.post('/webhooks/pedido/faturado', (req, res) => webhookController.handlePedidoFaturado(req, res));

export default router;
