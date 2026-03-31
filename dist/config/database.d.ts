import sql from './db.js';
declare const prisma: {
    cliente: {
        findUnique: () => Promise<null>;
        create: () => Promise<null>;
        findMany: () => Promise<never[]>;
    };
    empresa: {
        findMany: () => Promise<never[]>;
        findUnique: () => Promise<null>;
    };
    clienteEmpresa: {
        findUnique: () => Promise<null>;
        upsert: () => Promise<null>;
        findMany: () => Promise<never[]>;
    };
    pedido: {
        findUnique: () => Promise<null>;
        findMany: () => Promise<never[]>;
        update: () => Promise<null>;
    };
    notaFiscal: {
        findMany: () => Promise<never[]>;
    };
    produtoEmpresa: {
        findMany: () => Promise<never[]>;
    };
    $queryRaw: () => Promise<null>;
};
export { sql, prisma };
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map