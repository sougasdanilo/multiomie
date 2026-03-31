import sql from './db.js';

// Mock do prisma para compatibilidade durante migração
const prisma = {
  cliente: {
    findUnique: async () => null,
    create: async () => null,
    findMany: async () => []
  },
  empresa: {
    findMany: async () => [],
    findUnique: async () => null
  },
  clienteEmpresa: {
    findUnique: async () => null,
    upsert: async () => null,
    findMany: async () => []
  },
  pedido: {
    findUnique: async () => null,
    findMany: async () => [],
    update: async () => null
  },
  notaFiscal: {
    findMany: async () => []
  },
  produtoEmpresa: {
    findMany: async () => []
  },
  $queryRaw: async () => null
};

export { sql, prisma };

export async function connectDatabase(): Promise<void> {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await sql.end();
}
