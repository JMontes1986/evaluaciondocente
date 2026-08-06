import "server-only";

export interface RateLimitResult { allowed: boolean; retryAfterSeconds: number }
export interface RateLimiter { check(key: string): Promise<RateLimitResult> }

class MemoryRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, number[]>();
  constructor(private readonly limit: number, private readonly windowMs: number, private readonly maxKeys = 10_000) {}
  async check(key: string): Promise<RateLimitResult> {
    const now=Date.now();
    if (this.attempts.size >= this.maxKeys && !this.attempts.has(key)) {
      for (const [storedKey, times] of this.attempts) {
        if (!times.some((time) => time > now - this.windowMs)) this.attempts.delete(storedKey);
      }
      if (this.attempts.size >= this.maxKeys) this.attempts.delete(this.attempts.keys().next().value as string);
    }
    const recent=(this.attempts.get(key)??[]).filter(time=>time>now-this.windowMs);
    if(recent.length>=this.limit)return{allowed:false,retryAfterSeconds:Math.ceil((recent[0]+this.windowMs-now)/1000)};
    recent.push(now);this.attempts.set(key,recent);return{allowed:true,retryAfterSeconds:0};
  }
}

// Sustituir esta instancia por un adaptador Upstash Redis en despliegues con alto tráfico.
export const studentNetworkLoginRateLimiter:RateLimiter=new MemoryRateLimiter(2000,15*60*1000);
export const studentCodeLoginRateLimiter:RateLimiter=new MemoryRateLimiter(8,15*60*1000);
export const adminAiRateLimiter:RateLimiter=new MemoryRateLimiter(5,10*60*1000);
export const adminLoginNetworkRateLimiter:RateLimiter=new MemoryRateLimiter(30,15*60*1000);
export const adminLoginAccountRateLimiter:RateLimiter=new MemoryRateLimiter(8,15*60*1000);
export const passwordResetRateLimiter:RateLimiter=new MemoryRateLimiter(3,60*60*1000);
