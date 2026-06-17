export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function badRequest(message: string, code = "bad_request") {
  return new HttpError(400, code, message);
}

export function unauthorized(message = "Unauthorized") {
  return new HttpError(401, "unauthorized", message);
}

export function forbidden(message = "Forbidden") {
  return new HttpError(403, "forbidden", message);
}
