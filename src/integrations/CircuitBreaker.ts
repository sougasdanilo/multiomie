import CircuitBreaker from 'opossum';
import { logger } from '../middlewares/logger.js';

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

const defaultOptions: CircuitBreakerOptions = {
  timeout: 30000, // 30 segundos
  errorThresholdPercentage: 50, // Abre se 50% das chamadas falharem
  resetTimeout: 30000, // Tenta fechar após 30 segundos
  volumeThreshold: 5 // Mínimo de 5 chamadas para calcular
};

export class OmieCircuitBreaker {
  private breakers: Map<string, CircuitBreaker> = new Map();

  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(
        async (fn: () => Promise<any>) => fn(),
        {
          ...defaultOptions,
          ...options,
          name
        }
      );

      breaker.on('open', () => {
        logger.warn({ breaker: name }, `Circuit breaker ABERTO para ${name}`);
      });

      breaker.on('halfOpen', () => {
        logger.info({ breaker: name }, `Circuit breaker MEIO-ABERTO para ${name}`);
      });

      breaker.on('close', () => {
        logger.info({ breaker: name }, `Circuit breaker FECHADO para ${name}`);
      });

      breaker.on('fallback', (result) => {
        logger.warn({ breaker: name, result }, `Fallback executado para ${name}`);
      });

      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name)!;
  }

  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<any>
  ): Promise<any> {
    const breaker = this.getBreaker(name);
    
    if (fallback) {
      breaker.fallback(fallback);
    }

    return await breaker.fire(operation);
  }

  getState(name: string): 'OPEN' | 'CLOSED' | 'HALF_OPEN' | 'UNKNOWN' {
    const breaker = this.breakers.get(name);
    if (!breaker) return 'UNKNOWN';
    return breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED';
  }

  getStats(name: string): any {
    const breaker = this.breakers.get(name);
    if (!breaker) return null;
    
    return {
      name: breaker.name,
      state: this.getState(name),
      stats: breaker.stats,
      opened: breaker.opened,
      halfOpen: breaker.halfOpen,
      closed: !breaker.opened && !breaker.halfOpen
    };
  }

  getAllStats(): any[] {
    return Array.from(this.breakers.keys()).map(name => this.getStats(name));
  }
}

// Singleton instance
export const omieCircuitBreaker = new OmieCircuitBreaker();
