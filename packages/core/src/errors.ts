export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = "INTERNAL_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 503, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "能源站登录失败或会话已过期") {
    super(message, 401, "UPSTREAM_AUTH_ERROR");
    this.name = "AuthenticationError";
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, "UPSTREAM_ERROR", details);
    this.name = "UpstreamError";
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(message, 502, "UPSTREAM_PARSE_ERROR");
    this.name = "ParseError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
