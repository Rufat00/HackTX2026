export const errorCodes = [
  'validation',
  'unauthenticated',
  'forbidden',
  'not-found',
  'conflict',
  'invalid-state',
  'rate-limited',
  'provider-unavailable',
] as const;
export type ErrorCode = (typeof errorCodes)[number];
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export type ApiError = {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
    requestId: string;
    fieldErrors?: Record<string, string[]>;
  };
};
