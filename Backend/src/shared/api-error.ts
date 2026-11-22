export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isPositiveInteger(value: unknown): value is number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}
