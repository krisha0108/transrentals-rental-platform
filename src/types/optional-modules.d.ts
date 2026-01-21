/**
 * Type declarations for optional modules that may not be installed
 * These modules are used conditionally and the app works without them
 */

// ioredis - used for Redis-based rate limiting (optional)
declare module 'ioredis' {
  export interface RedisOptions {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    enableOfflineQueue?: boolean;
  }

  export default class Redis {
    constructor(url?: string);
    constructor(options?: RedisOptions);

    get(key: string): Promise<string | null>;
    set(key: string, value: string, expiryMode?: string, time?: number): Promise<string>;
    del(key: string | string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    zadd(key: string, ...args: (string | number)[]): Promise<number>;
    zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]>;
    zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
    zcard(key: string): Promise<number>;
    pipeline(): Pipeline;
    quit(): Promise<string>;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export interface Pipeline {
    zadd(key: string, ...args: (string | number)[]): this;
    zremrangebyscore(key: string, min: number | string, max: number | string): this;
    zcard(key: string): this;
    expire(key: string, seconds: number): this;
    exec(): Promise<[Error | null, any][]>;
  }
}

// @sentry/nextjs - used for error monitoring (optional)
declare module '@sentry/nextjs' {
  export interface SentryOptions {
    dsn?: string;
    tracesSampleRate?: number;
    debug?: boolean;
    environment?: string;
    release?: string;
  }

  export interface User {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  }

  export interface Breadcrumb {
    category?: string;
    message?: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, any>;
  }

  export interface Transaction {
    finish(): void;
    setStatus(status: string): void;
  }

  export function init(options: SentryOptions): void;
  export function captureException(error: Error | unknown, hint?: any): string;
  export function captureMessage(message: string, level?: string): string;
  export function setUser(user: User | null): void;
  export function setTag(key: string, value: string): void;
  export function setTags(tags: Record<string, string>): void;
  export function addBreadcrumb(breadcrumb: Breadcrumb): void;
  export function startTransaction(context: { name: string; op?: string }): Transaction;
  export function withScope(callback: (scope: any) => void): void;
}
