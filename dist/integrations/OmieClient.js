import axios from 'axios';
import { decrypt } from '../utils/encryption.js';
export class OmieApiError extends Error {
    code;
    data;
    constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'OmieApiError';
    }
    isRetryable() {
        const retryableCodes = [
            'NETWORK_ERROR',
            'ETIMEOUT',
            'ECONNRESET',
            'ETIMEDOUT',
            'OMIE_ERROR_500',
            'RATE_LIMIT'
        ];
        return retryableCodes.includes(this.code) ||
            (this.code?.startsWith('5') ?? false);
    }
}
export class OmieClient {
    httpClient;
    credentials;
    baseURL = 'https://app.omie.com.br/api/v1';
    lastRequestTime = 0;
    minInterval = 100;
    constructor(credentials) {
        this.credentials = credentials;
        this.httpClient = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    async call(endpoint, method, params = {}) {
        await this.respeitarRateLimit();
        const payload = {
            call: method,
            app_key: this.credentials.appKey,
            app_secret: this.credentials.appSecret,
            param: [params]
        };
        const url = `/${endpoint}/`;
        try {
            const response = await this.httpClient.post(url, payload);
            if (response.data.faultcode) {
                throw new OmieApiError(response.data.faultstring, response.data.faultcode, response.data);
            }
            return response.data;
        }
        catch (error) {
            if (error instanceof OmieApiError) {
                throw error;
            }
            if (axios.isAxiosError(error)) {
                const axiosError = error;
                throw new OmieApiError(axiosError.message, axiosError.code || 'NETWORK_ERROR', { originalError: axiosError });
            }
            throw error;
        }
    }
    async respeitarRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }
}
export class OmieClientFactory {
    create(empresa) {
        const appSecret = decrypt(empresa.appSecret);
        return new OmieClient({
            appKey: empresa.appKey,
            appSecret
        });
    }
}
//# sourceMappingURL=OmieClient.js.map