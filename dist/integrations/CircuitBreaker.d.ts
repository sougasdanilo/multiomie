import CircuitBreaker from 'opossum';
interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
}
export declare class OmieCircuitBreaker {
    private breakers;
    getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker;
    execute<T>(name: string, operation: () => Promise<T>, fallback?: () => Promise<any>): Promise<any>;
    getState(name: string): 'OPEN' | 'CLOSED' | 'HALF_OPEN' | 'UNKNOWN';
    getStats(name: string): any;
    getAllStats(): any[];
}
export declare const omieCircuitBreaker: OmieCircuitBreaker;
export {};
//# sourceMappingURL=CircuitBreaker.d.ts.map