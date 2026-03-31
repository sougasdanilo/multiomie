import CircuitBreaker from 'opossum';
import { logger } from '../middlewares/logger.js';
const defaultOptions = {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 5
};
export class OmieCircuitBreaker {
    breakers = new Map();
    getBreaker(name, options) {
        if (!this.breakers.has(name)) {
            const breaker = new CircuitBreaker(async (fn) => fn(), {
                ...defaultOptions,
                ...options,
                name
            });
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
        return this.breakers.get(name);
    }
    async execute(name, operation, fallback) {
        const breaker = this.getBreaker(name);
        if (fallback) {
            breaker.fallback(fallback);
        }
        return await breaker.fire(operation);
    }
    getState(name) {
        const breaker = this.breakers.get(name);
        if (!breaker)
            return 'UNKNOWN';
        return breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED';
    }
    getStats(name) {
        const breaker = this.breakers.get(name);
        if (!breaker)
            return null;
        return {
            name: breaker.name,
            state: this.getState(name),
            stats: breaker.stats,
            opened: breaker.opened,
            halfOpen: breaker.halfOpen,
            closed: !breaker.opened && !breaker.halfOpen
        };
    }
    getAllStats() {
        return Array.from(this.breakers.keys()).map(name => this.getStats(name));
    }
}
export const omieCircuitBreaker = new OmieCircuitBreaker();
//# sourceMappingURL=CircuitBreaker.js.map