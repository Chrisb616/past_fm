export class LastFmError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "LastFmError";
    this.code = code;
  }
}

export function isUserNotFoundError(error: unknown): boolean {
  if (!(error instanceof LastFmError)) {
    return false;
  }
  if (error.code === 404) {
    return true;
  }
  return error.code === 6 && /user not found/i.test(error.message);
}
