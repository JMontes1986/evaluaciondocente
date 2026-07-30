import "server-only";

export interface RateLimitResult { allowed: boolean; retryAfterSeconds: number }
export interface RateLimiter { check(key: string): Promise<RateLimitResult> }

class MemoryRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, number[]>();
  constructor(private readonly limit: number, private readonly windowMs: number) {}
  async check(key: string): Promise<RateLimitResult> {
    const now=Date.now(),recent=(this.attempts.get(key)??[]).filter(time=>time>now-this.windowMs);
    if(recent.length>=this.limit)return{allowed:false,retryAfterSeconds:Math.ceil((recent[0]+this.windowMs-now)/1000)};
    recent.push(now);this.attempts.set(key,recent);return{allowed:true,retryAfterSeconds:0};
  }
}

// Sustituir esta instancia por un adaptador Upstash Redis en despliegues con alto tráfico.
export const studentLoginRateLimiter:RateLimiter=new MemoryRateLimiter(8,15*60*1000);
export const adminAiRateLimiter:RateLimiter=new MemoryRateLimiter(5,10*60*1000);
export const commentModerationRateLimiter:RateLimiter=new MemoryRateLimiter(60,10*60*1000);
