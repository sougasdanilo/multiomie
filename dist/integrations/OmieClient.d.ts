import { Empresa } from '../entities/index.js';
export interface OmieRequest {
    call: string;
    app_key: string;
    app_secret: string;
    param: any[];
}
export declare class OmieApiError extends Error {
    code: string;
    data?: any | undefined;
    constructor(message: string, code: string, data?: any | undefined);
    isRetryable(): boolean;
}
export declare class OmieClient {
    private httpClient;
    private credentials;
    private baseURL;
    private lastRequestTime;
    private minInterval;
    constructor(credentials: {
        appKey: string;
        appSecret: string;
    });
    call<T>(endpoint: string, method: string, params?: any): Promise<T>;
    private respeitarRateLimit;
}
export declare class OmieClientFactory {
    create(empresa: Empresa): OmieClient;
}
//# sourceMappingURL=OmieClient.d.ts.map