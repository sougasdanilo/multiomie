import { Cliente as ClienteEntity, Endereco, DadosFiscais } from '../entities/index.js';
export interface CadastroClienteDTO {
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
    celular?: string;
    endereco?: Endereco;
    dadosFiscais?: DadosFiscais;
}
export interface SincronizacaoResult {
    empresaId: string;
    empresaNome: string;
    sucesso: boolean;
    codigoOmie?: string;
    erro?: string;
}
export declare class ClienteService {
    private omieIntegration;
    constructor();
    cadastrarCliente(dados: CadastroClienteDTO): Promise<{
        cliente: ClienteEntity;
        sincronizacoes: SincronizacaoResult[];
    }>;
    private sincronizarComEmpresa;
    obterCodigoOmie(clienteId: string, empresaId: string): Promise<string>;
    listarClientes(skip?: number, take?: number): Promise<ClienteEntity[]>;
    obterCliente(id: string): Promise<ClienteEntity | null>;
    obterClientePorCpfCnpj(cpfCnpj: string): Promise<ClienteEntity | null>;
    reprocessarPendentes(): Promise<{
        total: number;
        sucessos: number;
        falhas: number;
    }>;
    private mapToEntity;
}
//# sourceMappingURL=ClienteService.d.ts.map