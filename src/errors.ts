import type { ValidationErrors } from './types.js';

export class TrigvError extends Error {
  override name = 'TrigvError';
  /** Value of the `X-Request-ID` response header, when the API answered. */
  requestId?: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends TrigvError {
  override name = 'ConfigurationError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends TrigvError {
  override name = 'ValidationError';
  readonly errors: ValidationErrors;

  constructor(message: string, errors: ValidationErrors = {}) {
    super(message);
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends TrigvError {
  override name = 'AuthenticationError';
  readonly statusCode = 401;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthorizationError extends TrigvError {
  override name = 'AuthorizationError';
  readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends TrigvError {
  override name = 'NotFoundError';
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 429: 60 requests per minute per workspace. Wait `Retry-After`. */
export class RateLimitError extends TrigvError {
  override name = 'RateLimitError';
  readonly statusCode = 429;
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number);
  /** @deprecated Old argument order (message, retryable, retryAfterMs). `retryable` is ignored. */
  constructor(message: string, retryable: boolean, retryAfterMs?: number);
  constructor(message: string, second?: number | boolean, third?: number) {
    super(message);
    this.retryAfterMs = typeof second === 'boolean' ? third : second;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** @deprecated Every 429 is retryable now, so this is always `true`. */
  get retryable(): boolean {
    return true;
  }
}

/** 409: another request is delivering the same `idempotency_key`. */
export class ConflictError extends TrigvError {
  override name = 'ConflictError';
  readonly statusCode = 409;
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 503: push delivery is unavailable. Retry with the same `idempotency_key`. */
export class ServiceUnavailableError extends TrigvError {
  override name = 'ServiceUnavailableError';
  readonly statusCode = 503;
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiError extends TrigvError {
  override name = 'ApiError';
  readonly statusCode: number;
  readonly body: unknown;

  constructor(message: string, statusCode: number, body: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends TrigvError {
  override name = 'NetworkError';
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends TrigvError {
  override name = 'TimeoutError';

  constructor(message = 'Request timed out') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** @deprecated The monthly event cap no longer exists. Always returns `false`. */
export function isMonthlyLimitMessage(message: string): boolean {
  void message;
  return false;
}
