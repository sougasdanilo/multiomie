// Arquivo de compatibilidade para permitir compilação durante migração

// Tipos básicos para substituir Prisma
interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: any;
  ie?: string;
  im?: string;
  tipo_contribuinte?: string;
  created_at: Date;
  updated_at: Date;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  nome_fantasia?: string;
  app_key: string;
  app_secret: string;
  ativa: boolean;
  configuracoes?: any;
  created_at: Date;
  updated_at: Date;
}

// Mock do prisma para compatibilidade
declare const prisma: {
  cliente: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
  empresa: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
  };
  clienteEmpresa: {
    findUnique: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
  pedido: {
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
  };
  notaFiscal: {
    findMany: (args: any) => Promise<any[]>;
  };
  produtoEmpresa: {
    findMany: (args: any) => Promise<any[]>;
  };
  $queryRaw: (query: TemplateStringsArray, ...args: any[]) => Promise<any>;
};

export { prisma };
