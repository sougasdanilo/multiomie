import { z } from 'zod';
export declare const cnpjSchema: z.ZodString;
export declare const cpfSchema: z.ZodString;
export declare const cpfCnpjSchema: z.ZodString;
export declare const enderecoSchema: z.ZodObject<{
    logradouro: z.ZodString;
    numero: z.ZodString;
    complemento: z.ZodOptional<z.ZodString>;
    bairro: z.ZodString;
    cidade: z.ZodString;
    estado: z.ZodString;
    cep: z.ZodString;
    codigoPais: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    codigoPais: string;
    complemento?: string | undefined;
}, {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    complemento?: string | undefined;
    codigoPais?: string | undefined;
}>;
export declare const dadosFiscaisSchema: z.ZodObject<{
    ie: z.ZodOptional<z.ZodString>;
    im: z.ZodOptional<z.ZodString>;
    tipoContribuinte: z.ZodDefault<z.ZodEnum<["1", "2", "9"]>>;
}, "strip", z.ZodTypeAny, {
    tipoContribuinte: "1" | "2" | "9";
    ie?: string | undefined;
    im?: string | undefined;
}, {
    ie?: string | undefined;
    im?: string | undefined;
    tipoContribuinte?: "1" | "2" | "9" | undefined;
}>;
export declare const criarEmpresaSchema: z.ZodObject<{
    nome: z.ZodString;
    cnpj: z.ZodString;
    nomeFantasia: z.ZodOptional<z.ZodString>;
    appKey: z.ZodString;
    appSecret: z.ZodString;
    configuracoes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    nome: string;
    cnpj: string;
    appKey: string;
    appSecret: string;
    nomeFantasia?: string | undefined;
    configuracoes?: Record<string, unknown> | undefined;
}, {
    nome: string;
    cnpj: string;
    appKey: string;
    appSecret: string;
    nomeFantasia?: string | undefined;
    configuracoes?: Record<string, unknown> | undefined;
}>;
export declare const atualizarEmpresaSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    nomeFantasia: z.ZodOptional<z.ZodString>;
    appKey: z.ZodOptional<z.ZodString>;
    appSecret: z.ZodOptional<z.ZodString>;
    ativa: z.ZodOptional<z.ZodBoolean>;
    configuracoes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    nome?: string | undefined;
    nomeFantasia?: string | undefined;
    appKey?: string | undefined;
    appSecret?: string | undefined;
    ativa?: boolean | undefined;
    configuracoes?: Record<string, unknown> | undefined;
}, {
    nome?: string | undefined;
    nomeFantasia?: string | undefined;
    appKey?: string | undefined;
    appSecret?: string | undefined;
    ativa?: boolean | undefined;
    configuracoes?: Record<string, unknown> | undefined;
}>;
export declare const criarClienteSchema: z.ZodObject<{
    nome: z.ZodString;
    cpfCnpj: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    celular: z.ZodOptional<z.ZodString>;
    endereco: z.ZodOptional<z.ZodObject<{
        logradouro: z.ZodString;
        numero: z.ZodString;
        complemento: z.ZodOptional<z.ZodString>;
        bairro: z.ZodString;
        cidade: z.ZodString;
        estado: z.ZodString;
        cep: z.ZodString;
        codigoPais: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        codigoPais: string;
        complemento?: string | undefined;
    }, {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        complemento?: string | undefined;
        codigoPais?: string | undefined;
    }>>;
    dadosFiscais: z.ZodOptional<z.ZodObject<{
        ie: z.ZodOptional<z.ZodString>;
        im: z.ZodOptional<z.ZodString>;
        tipoContribuinte: z.ZodDefault<z.ZodEnum<["1", "2", "9"]>>;
    }, "strip", z.ZodTypeAny, {
        tipoContribuinte: "1" | "2" | "9";
        ie?: string | undefined;
        im?: string | undefined;
    }, {
        ie?: string | undefined;
        im?: string | undefined;
        tipoContribuinte?: "1" | "2" | "9" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    nome: string;
    cpfCnpj: string;
    email?: string | undefined;
    telefone?: string | undefined;
    celular?: string | undefined;
    endereco?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        codigoPais: string;
        complemento?: string | undefined;
    } | undefined;
    dadosFiscais?: {
        tipoContribuinte: "1" | "2" | "9";
        ie?: string | undefined;
        im?: string | undefined;
    } | undefined;
}, {
    nome: string;
    cpfCnpj: string;
    email?: string | undefined;
    telefone?: string | undefined;
    celular?: string | undefined;
    endereco?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        complemento?: string | undefined;
        codigoPais?: string | undefined;
    } | undefined;
    dadosFiscais?: {
        ie?: string | undefined;
        im?: string | undefined;
        tipoContribuinte?: "1" | "2" | "9" | undefined;
    } | undefined;
}>;
export declare const atualizarClienteSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    celular: z.ZodOptional<z.ZodString>;
    endereco: z.ZodOptional<z.ZodObject<{
        logradouro: z.ZodString;
        numero: z.ZodString;
        complemento: z.ZodOptional<z.ZodString>;
        bairro: z.ZodString;
        cidade: z.ZodString;
        estado: z.ZodString;
        cep: z.ZodString;
        codigoPais: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        codigoPais: string;
        complemento?: string | undefined;
    }, {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        complemento?: string | undefined;
        codigoPais?: string | undefined;
    }>>;
    dadosFiscais: z.ZodOptional<z.ZodObject<{
        ie: z.ZodOptional<z.ZodString>;
        im: z.ZodOptional<z.ZodString>;
        tipoContribuinte: z.ZodDefault<z.ZodEnum<["1", "2", "9"]>>;
    }, "strip", z.ZodTypeAny, {
        tipoContribuinte: "1" | "2" | "9";
        ie?: string | undefined;
        im?: string | undefined;
    }, {
        ie?: string | undefined;
        im?: string | undefined;
        tipoContribuinte?: "1" | "2" | "9" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    nome?: string | undefined;
    email?: string | undefined;
    telefone?: string | undefined;
    celular?: string | undefined;
    endereco?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        codigoPais: string;
        complemento?: string | undefined;
    } | undefined;
    dadosFiscais?: {
        tipoContribuinte: "1" | "2" | "9";
        ie?: string | undefined;
        im?: string | undefined;
    } | undefined;
}, {
    nome?: string | undefined;
    email?: string | undefined;
    telefone?: string | undefined;
    celular?: string | undefined;
    endereco?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        complemento?: string | undefined;
        codigoPais?: string | undefined;
    } | undefined;
    dadosFiscais?: {
        ie?: string | undefined;
        im?: string | undefined;
        tipoContribuinte?: "1" | "2" | "9" | undefined;
    } | undefined;
}>;
export declare const criarProdutoSchema: z.ZodObject<{
    codigo: z.ZodString;
    descricao: z.ZodString;
    descricaoComplementar: z.ZodOptional<z.ZodString>;
    ncm: z.ZodString;
    cest: z.ZodOptional<z.ZodString>;
    cfop: z.ZodOptional<z.ZodString>;
    unidade: z.ZodString;
    precoBase: z.ZodOptional<z.ZodNumber>;
    tipo: z.ZodDefault<z.ZodEnum<["PRODUTO", "SERVICO", "KIT"]>>;
}, "strip", z.ZodTypeAny, {
    codigo: string;
    descricao: string;
    ncm: string;
    unidade: string;
    tipo: "PRODUTO" | "SERVICO" | "KIT";
    descricaoComplementar?: string | undefined;
    cest?: string | undefined;
    cfop?: string | undefined;
    precoBase?: number | undefined;
}, {
    codigo: string;
    descricao: string;
    ncm: string;
    unidade: string;
    descricaoComplementar?: string | undefined;
    cest?: string | undefined;
    cfop?: string | undefined;
    precoBase?: number | undefined;
    tipo?: "PRODUTO" | "SERVICO" | "KIT" | undefined;
}>;
export declare const pedidoItemSchema: z.ZodObject<{
    produtoId: z.ZodString;
    quantidade: z.ZodNumber;
    precoUnitario: z.ZodOptional<z.ZodNumber>;
    percentualDesconto: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    produtoId: string;
    quantidade: number;
    percentualDesconto: number;
    precoUnitario?: number | undefined;
}, {
    produtoId: string;
    quantidade: number;
    precoUnitario?: number | undefined;
    percentualDesconto?: number | undefined;
}>;
export declare const criarPedidoSchema: z.ZodObject<{
    clienteId: z.ZodString;
    enderecoEntrega: z.ZodOptional<z.ZodObject<{
        logradouro: z.ZodString;
        numero: z.ZodString;
        complemento: z.ZodOptional<z.ZodString>;
        bairro: z.ZodString;
        cidade: z.ZodString;
        estado: z.ZodString;
        cep: z.ZodString;
        codigoPais: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        codigoPais: string;
        complemento?: string | undefined;
    }, {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        complemento?: string | undefined;
        codigoPais?: string | undefined;
    }>>;
    observacoes: z.ZodOptional<z.ZodString>;
    observacaoInterna: z.ZodOptional<z.ZodString>;
    formaPagamento: z.ZodString;
    condicaoPagamento: z.ZodOptional<z.ZodString>;
    dataPrevisao: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodDate>]>;
    itens: z.ZodArray<z.ZodObject<{
        produtoId: z.ZodString;
        quantidade: z.ZodNumber;
        precoUnitario: z.ZodOptional<z.ZodNumber>;
        percentualDesconto: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        produtoId: string;
        quantidade: number;
        percentualDesconto: number;
        precoUnitario?: number | undefined;
    }, {
        produtoId: string;
        quantidade: number;
        precoUnitario?: number | undefined;
        percentualDesconto?: number | undefined;
    }>, "many">;
    usuarioId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    clienteId: string;
    formaPagamento: string;
    itens: {
        produtoId: string;
        quantidade: number;
        percentualDesconto: number;
        precoUnitario?: number | undefined;
    }[];
    enderecoEntrega?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        codigoPais: string;
        complemento?: string | undefined;
    } | undefined;
    observacoes?: string | undefined;
    observacaoInterna?: string | undefined;
    condicaoPagamento?: string | undefined;
    dataPrevisao?: string | Date | undefined;
    usuarioId?: string | undefined;
}, {
    clienteId: string;
    formaPagamento: string;
    itens: {
        produtoId: string;
        quantidade: number;
        precoUnitario?: number | undefined;
        percentualDesconto?: number | undefined;
    }[];
    enderecoEntrega?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        complemento?: string | undefined;
        codigoPais?: string | undefined;
    } | undefined;
    observacoes?: string | undefined;
    observacaoInterna?: string | undefined;
    condicaoPagamento?: string | undefined;
    dataPrevisao?: string | Date | undefined;
    usuarioId?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    skip: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    take: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    skip: number;
    take: number;
}, {
    skip?: string | undefined;
    take?: string | undefined;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const empresaIdParamSchema: z.ZodObject<{
    empresaId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    empresaId: string;
}, {
    empresaId: string;
}>;
export declare const pedidoIdParamSchema: z.ZodObject<{
    pedidoId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pedidoId: string;
}, {
    pedidoId: string;
}>;
export type CriarEmpresaDTO = z.infer<typeof criarEmpresaSchema>;
export type AtualizarEmpresaDTO = z.infer<typeof atualizarEmpresaSchema>;
export type CriarClienteDTO = z.infer<typeof criarClienteSchema>;
export type AtualizarClienteDTO = z.infer<typeof atualizarClienteSchema>;
export type CriarProdutoDTO = z.infer<typeof criarProdutoSchema>;
export type CriarPedidoDTO = z.infer<typeof criarPedidoSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
//# sourceMappingURL=index.d.ts.map