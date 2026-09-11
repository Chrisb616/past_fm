export type UnixRange = {
  from: number;
  to: number;
};

const FIRST_LASTFM_YEAR = 2002;

export function getAnnualRange(year: number): UnixRange {
  if (!Number.isInteger(year)) {
    throw new RangeError("year must be an integer");
  }

  return {
    from: Date.UTC(year, 0, 1) / 1000,
    to: Date.UTC(year + 1, 0, 1) / 1000,
  };
}

export function listSelectableCalendarYears(
  nowSeconds = Math.floor(Date.now() / 1000),
  firstYear = FIRST_LASTFM_YEAR,
): number[] {
  const currentYear = new Date(nowSeconds * 1000).getUTCFullYear();
  const years: number[] = [];

  for (let year = currentYear; year >= firstYear; year -= 1) {
    years.push(year);
  }

  return years;
}

export function localDateTimeToUnixSeconds(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  const unix = Math.floor(new Date(year, month - 1, day, hour, minute, second).getTime() / 1000);

  return Number.isFinite(unix) ? unix : undefined;
}
