import type { ValidationErrors } from './types.js';

export class TrigvError extends Error {
  override name = 'TrigvError';

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

export class RateLimitError extends TrigvError {
  override name = 'RateLimitError';
  readonly statusCode = 429;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;

  constructor(message: string, retryable = true, retryAfterMs?: number) {
    super(message);
    this.retryable = retryable;
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

export function isMonthlyLimitMessage(message: string): boolean {
  return message.includes('Monthly event limit');
}
