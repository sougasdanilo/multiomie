import { EmpresaService } from '../services/EmpresaService.js';
import { z } from 'zod';
const criarEmpresaSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cnpj: z.string().min(14, 'CNPJ inválido'),
    nomeFantasia: z.string().optional(),
    appKey: z.string().min(1, 'App Key é obrigatória'),
    appSecret: z.string().min(1, 'App Secret é obrigatório'),
    configuracoes: z.record(z.unknown()).optional()
});
const atualizarEmpresaSchema = z.object({
    nome: z.string().min(1).optional(),
    nomeFantasia: z.string().optional(),
    appKey: z.string().optional(),
    appSecret: z.string().optional(),
    ativa: z.boolean().optional(),
    configuracoes: z.record(z.unknown()).optional()
});
export class EmpresaController {
    empresaService;
    constructor() {
        this.empresaService = new EmpresaService();
    }
    async criar(req, res) {
        try {
            const dados = criarEmpresaSchema.parse(req.body);
            const empresa = await this.empresaService.criar(dados);
            res.status(201).json({
                success: true,
                data: empresa,
                message: 'Empresa criada com sucesso'
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
            const ativo = req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined;
            const empresas = await this.empresaService.listar(ativo);
            res.json({
                success: true,
                data: empresas
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
                res.status(400).json({ success: false, error: 'ID é obrigatório' });
                return;
            }
            const empresa = await this.empresaService.obterPorId(id);
            if (!empresa) {
                res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
                return;
            }
            res.json({
                success: true,
                data: empresa
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID é obrigatório' });
                return;
            }
            const dados = atualizarEmpresaSchema.parse(req.body);
            const empresa = await this.empresaService.atualizar(id, dados);
            res.json({
                success: true,
                data: empresa,
                message: 'Empresa atualizada com sucesso'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    async desativar(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID é obrigatório' });
                return;
            }
            await this.empresaService.desativar(id);
            res.json({
                success: true,
                message: 'Empresa desativada com sucesso'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    async testarConexao(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID é obrigatório' });
                return;
            }
            const resultado = await this.empresaService.testarConexao(id);
            res.json({
                success: resultado.sucesso,
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
    async obterEstatisticas(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'ID é obrigatório' });
                return;
            }
            const estatisticas = await this.empresaService.obterEstatisticas(id);
            res.json({
                success: true,
                data: estatisticas
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
//# sourceMappingURL=EmpresaController.js.map