import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
  var __lastDbFailureTime: number | undefined
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

// Circuit breaker / DB health tracker
const DB_CIRCUIT_BREAKER_COOLDOWN_MS = 45000; // 45 seconds

export function isDbCircuitBroken(): boolean {
  const lastFailure = globalThis.__lastDbFailureTime || 0;
  return (Date.now() - lastFailure) < DB_CIRCUIT_BREAKER_COOLDOWN_MS;
}

export function recordDbFailure() {
  globalThis.__lastDbFailureTime = Date.now();
}

export function resetDbCircuit() {
  globalThis.__lastDbFailureTime = 0;
}

/**
 * Safely executes a Prisma query with a fast timeout and circuit-breaker protection.
 * If the remote DB is unreachable or paused, it trips the circuit breaker so subsequent
 * queries return immediately without waiting for TCP connection timeouts.
 */
export async function safeDbQuery<T>(promiseFn: () => Promise<T>, timeoutMs: number = 1500): Promise<T | null> {
  if (isDbCircuitBroken()) {
    return null;
  }
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    );
    const result = await Promise.race([promiseFn(), timeoutPromise]);
    resetDbCircuit();
    return result as T;
  } catch (err) {
    recordDbFailure();
    return null;
  }
}

