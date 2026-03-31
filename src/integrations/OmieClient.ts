import axios, { AxiosInstance, AxiosError } from 'axios';
import { Empresa } from '../entities';
import { decrypt } from '../utils/encryption';

export interface OmieRequest {
  call: string;
  app_key: string;
  app_secret: string;
  param: any[];
}

export class OmieApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public data?: any
  ) {
    super(message);
    this.name = 'OmieApiError';
  }

  isRetryable(): boolean {
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
  private httpClient: AxiosInstance;
  private credentials: { appKey: string; appSecret: string };
  private baseURL = 'https://app.omie.com.br/api/v1';
  private lastRequestTime: number = 0;
  private minInterval: number = 100;

  constructor(credentials: { appKey: string; appSecret: string }) {
    this.credentials = credentials;
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async call<T>(endpoint: string, method: string, params: any = {}): Promise<T> {
    await this.respeitarRateLimit();

    const payload: OmieRequest = {
      call: method,
      app_key: this.credentials.appKey,
      app_secret: this.credentials.appSecret,
      param: [params]
    };

    const url = `/${endpoint}/`;

    try {
      const response = await this.httpClient.post(url, payload);
      
      if (response.data.faultcode) {
        throw new OmieApiError(
          response.data.faultstring,
          response.data.faultcode,
          response.data
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof OmieApiError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new OmieApiError(
          axiosError.message,
          axiosError.code || 'NETWORK_ERROR',
          { originalError: axiosError }
        );
      }

      throw error;
    }
  }

  private async respeitarRateLimit(): Promise<void> {
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
  create(empresa: Empresa): OmieClient {
    const appSecret = decrypt(empresa.appSecret);
    
    return new OmieClient({
      appKey: empresa.appKey,
      appSecret
    });
  }
}
