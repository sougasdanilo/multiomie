import { Empresa } from '../entities/index.js';
export interface CriarEmpresaDTO {
    nome: string;
    cnpj: string;
    nomeFantasia?: string;
    appKey: string;
    appSecret: string;
    configuracoes?: Record<string, unknown>;
}
export interface AtualizarEmpresaDTO {
    nome?: string;
    nomeFantasia?: string;
    appKey?: string;
    appSecret?: string;
    ativa?: boolean;
    configuracoes?: Record<string, unknown>;
}
export declare class EmpresaService {
    private omieIntegration;
    constructor();
    criar(dados: CriarEmpresaDTO): Promise<Empresa>;
    atualizar(id: string, dados: AtualizarEmpresaDTO): Promise<Empresa>;
    listar(ativo?: boolean): Promise<Empresa[]>;
    obterPorId(id: string): Promise<Empresa | null>;
    obterPorCnpj(cnpj: string): Promise<Empresa | null>;
    obterPorAppKey(appKey: string): Promise<Empresa | null>;
    desativar(id: string): Promise<void>;
    testarConexao(id: string): Promise<{
        sucesso: boolean;
        mensagem: string;
    }>;
    obterEstatisticas(id: string): Promise<{
        totalClientes: number;
        totalProdutos: number;
        totalPedidos: number;
        totalNotasFiscais: number;
    }>;
    private mapToEntity;
}
//# sourceMappingURL=EmpresaService.d.ts.map