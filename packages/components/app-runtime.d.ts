/** AG local runtime, not a transport, navigation router, authority or durable message broker. */
export type AppPriority = "user-blocking" | "user-visible" | "background";
export interface RuntimeStats {
  readonly [key: string]: number | boolean;
}
export interface EventEnvelope<T = unknown> {
  readonly topic: string;
  readonly payload: T;
  readonly priority: AppPriority;
  readonly createdAt: number;
  readonly expiresAt: number;
}
export interface EventBus {
  /** Queue an immutable-by-convention payload reference. Only replaceable state may supply coalesceKey. */
  publish<T>(
    topic: string,
    payload: T,
    options?: { priority?: AppPriority; ttlMs?: number; coalesceKey?: string },
  ): {
    accepted: boolean;
    reason?: "capacity" | "disposed";
    coalesced?: boolean;
  };
  subscribe<T>(
    topic: string,
    handler: (event: EventEnvelope<T>) => void,
    options?: { signal?: AbortSignal },
  ): () => void;
  /** Cooperatively drain one bounded slice; running JS callbacks cannot be preempted. */
  flush(): number;
  readonly stats: RuntimeStats;
  dispose(): void;
}
export declare function createEventBus(options?: {
  capacityPerTier?: number;
  maxSubscriptions?: number;
  maxEventsPerFlush?: number;
  timeBudgetMs?: number;
  defaultTtlMs?: number;
  autoFlush?: boolean;
  now?: () => number;
  schedule?: (callback: () => void) => () => void;
  onError?: (error: unknown) => void;
}): EventBus;
export interface RequestRouter {
  /** Query keys must include every parameter affecting identity/permissions/revision. Values are immutable references. */
  register<T, R>(
    name: string,
    handler: (
      input: T,
      context: { signal: AbortSignal; route: string; scopeKey: string },
    ) => R | PromiseLike<R>,
    options:
      | {
          kind: "query";
          key: (input: T) => string;
          cacheTtlMs?: number;
          validate?: (input: T) => boolean;
        }
      | { kind: "command"; validate?: (input: T) => boolean },
  ): () => void;
  request<T, R = unknown>(
    name: string,
    input: T,
    options?: {
      priority?: AppPriority;
      timeoutMs?: number;
      signal?: AbortSignal;
    },
  ): Promise<R>;
  /** Clear caches and abort/fence old requests; late results never resolve old waiters or refill caches. */
  invalidate(name: string): void;
  readonly stats: RuntimeStats;
  dispose(): void;
}
export declare function createRequestRouter(options: {
  scopeKey: string;
  maxConcurrent?: number;
  maxPending?: number;
  maxWaiters?: number;
  maxRoutes?: number;
  maxCacheEntries?: number;
  now?: () => number;
}): RequestRouter;
export declare class AppRuntimeError extends Error {
  readonly code: string;
  constructor(code: string);
}
