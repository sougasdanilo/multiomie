import Redis from 'ioredis';

// Configuração para BullMQ - maxRetriesPerRequest deve ser null
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export async function connectRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      resolve();
    });

    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message);
      // Não rejeita para permitir retry automático
    });

    // Timeout de conexão
    setTimeout(() => {
      reject(new Error('Timeout ao conectar ao Redis'));
    }, 10000);
  });
}

export function getRedis(): Redis {
  return redis;
}
