export class LastFmError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "LastFmError";
    this.code = code;
  }
}
