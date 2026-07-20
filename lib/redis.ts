import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Upstream uses a dedicated Redis DB for the TUS upload locks. Self-hosted we
// only run one Upstash DB, so fall back to it — without a URL every lock
// acquisition throws and the resumable (drag & drop) upload 500s.
export const lockerRedisClient = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_LOCKER_URL ??
    process.env.UPSTASH_REDIS_REST_URL) as string,
  token: (process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN) as string,
});

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) => {
  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "papermark",
  });
};
