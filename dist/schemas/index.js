import { z } from 'zod';
export const cnpjSchema = z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido');
export const cpfSchema = z.string().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido');
export const cpfCnpjSchema = z.string().regex(/^(\d{11}|\d{14}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/, 'CPF/CNPJ inválido');
export const enderecoSchema = z.object({
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
    cep: z.string().regex(/^\d{8}$|^\d{5}-\d{3}$/, 'CEP inválido'),
    codigoPais: z.string().default('1058')
});
export const dadosFiscaisSchema = z.object({
    ie: z.string().optional(),
    im: z.string().optional(),
    tipoContribuinte: z.enum(['1', '2', '9']).default('9')
});
export const criarEmpresaSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cnpj: cnpjSchema,
    nomeFantasia: z.string().optional(),
    appKey: z.string().min(1, 'App Key é obrigatória'),
    appSecret: z.string().min(1, 'App Secret é obrigatório'),
    configuracoes: z.record(z.unknown()).optional()
});
export const atualizarEmpresaSchema = z.object({
    nome: z.string().min(1).optional(),
    nomeFantasia: z.string().optional(),
    appKey: z.string().optional(),
    appSecret: z.string().optional(),
    ativa: z.boolean().optional(),
    configuracoes: z.record(z.unknown()).optional()
});
export const criarClienteSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cpfCnpj: cpfCnpjSchema,
    email: z.string().email('Email inválido').optional(),
    telefone: z.string().optional(),
    celular: z.string().optional(),
    endereco: enderecoSchema.optional(),
    dadosFiscais: dadosFiscaisSchema.optional()
});
export const atualizarClienteSchema = z.object({
    nome: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefone: z.string().optional(),
    celular: z.string().optional(),
    endereco: enderecoSchema.optional(),
    dadosFiscais: dadosFiscaisSchema.optional()
});
export const criarProdutoSchema = z.object({
    codigo: z.string().min(1, 'Código é obrigatório'),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    descricaoComplementar: z.string().optional(),
    ncm: z.string().regex(/^\d{8}$/, 'NCM deve ter 8 dígitos'),
    cest: z.string().optional(),
    cfop: z.string().optional(),
    unidade: z.string().min(1, 'Unidade é obrigatória'),
    precoBase: z.number().min(0).optional(),
    tipo: z.enum(['PRODUTO', 'SERVICO', 'KIT']).default('PRODUTO')
});
export const pedidoItemSchema = z.object({
    produtoId: z.string().uuid('ID do produto inválido'),
    quantidade: z.number().min(0.001, 'Quantidade deve ser maior que 0'),
    precoUnitario: z.number().min(0).optional(),
    percentualDesconto: z.number().min(0).max(100).default(0)
});
export const criarPedidoSchema = z.object({
    clienteId: z.string().uuid('ID do cliente inválido'),
    enderecoEntrega: enderecoSchema.optional(),
    observacoes: z.string().optional(),
    observacaoInterna: z.string().optional(),
    formaPagamento: z.string().min(1, 'Forma de pagamento é obrigatória'),
    condicaoPagamento: z.string().optional(),
    dataPrevisao: z.string().datetime().optional().or(z.date().optional()),
    itens: z.array(pedidoItemSchema).min(1, 'Pelos menos 1 item é obrigatório'),
    usuarioId: z.string().optional()
});
export const paginationSchema = z.object({
    skip: z.string().regex(/^\d+$/).transform(Number).default('0'),
    take: z.string().regex(/^\d+$/).transform(Number).default('50')
});
export const idParamSchema = z.object({
    id: z.string().uuid('ID inválido')
});
export const empresaIdParamSchema = z.object({
    empresaId: z.string().uuid('ID da empresa inválido')
});
export const pedidoIdParamSchema = z.object({
    pedidoId: z.string().uuid('ID do pedido inválido')
});
//# sourceMappingURL=index.js.map