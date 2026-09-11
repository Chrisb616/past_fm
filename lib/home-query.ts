import { getSeasonRange, isSeason, listSelectableYears, type Season } from "@/lib/seasons";
import {
  getAnnualRange,
  listSelectableCalendarYears,
  localDateTimeToUnixSeconds,
} from "@/lib/time-ranges";

export const RANGE_TYPES = ["annual", "seasonal", "custom"] as const;

export type RangeType = (typeof RANGE_TYPES)[number];

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export const HOME_QUERY_KEYS = [
  "user",
  "type",
  "season",
  "year",
  "customFrom",
  "customTo",
  "from",
  "to",
] as const;

export type HomeQuery = {
  user?: string;
  type?: RangeType;
  season?: Season;
  year?: number;
  customFrom?: string;
  customTo?: string;
  from?: number;
  to?: number;
};

function isRangeType(value: string): value is RangeType {
  return (RANGE_TYPES as readonly string[]).includes(value);
}

function parseUnixSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
}

function parseYear(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return parsed;
}

export function parseHomeQuery(searchParams: URLSearchParams): HomeQuery {
  const user = searchParams.get("user")?.trim() || undefined;
  const typeRaw = searchParams.get("type");
  const type = typeRaw && isRangeType(typeRaw) ? typeRaw : undefined;
  const seasonRaw = searchParams.get("season");
  const season = seasonRaw && isSeason(seasonRaw) ? seasonRaw : undefined;
  const year = parseYear(searchParams.get("year"));
  const customFrom = searchParams.get("customFrom") || undefined;
  const customTo = searchParams.get("customTo") || undefined;
  const from = parseUnixSeconds(searchParams.get("from"));
  const to = parseUnixSeconds(searchParams.get("to"));

  return { user, type, season, year, customFrom, customTo, from, to };
}

export function serializeHomeQuery(query: HomeQuery): string {
  const params = new URLSearchParams();
  if (query.user) params.set("user", query.user);
  if (query.type) params.set("type", query.type);
  if (query.season) params.set("season", query.season);
  if (query.year !== undefined) params.set("year", String(query.year));
  if (query.customFrom) params.set("customFrom", query.customFrom);
  if (query.customTo) params.set("customTo", query.customTo);
  if (query.from !== undefined) params.set("from", String(query.from));
  if (query.to !== undefined) params.set("to", String(query.to));
  return params.toString();
}

export function homeHref(query: HomeQuery): string {
  const search = serializeHomeQuery(query);
  return search ? `/?${search}` : "/";
}

export function relevantHomeSearch(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of HOME_QUERY_KEYS) {
    if (!searchParams.has(key)) continue;
    const value = searchParams.get(key);
    if (value === null) continue;
    params.set(key, value);
  }
  return params.toString();
}

export function canonicalizeHomeQuery(query: HomeQuery): HomeQuery {
  const user = query.user?.trim();
  if (!user) return {};

  const next: HomeQuery = { user };

  if (query.type) {
    next.type = query.type;
  }

  if (next.type === "annual") {
    if (query.year !== undefined && listSelectableCalendarYears().includes(query.year)) {
      next.year = query.year;
    }
  } else if (next.type === "seasonal") {
    if (query.season) {
      next.season = query.season;
      if (query.year !== undefined && listSelectableYears(query.season).includes(query.year)) {
        next.year = query.year;
      }
    }
  } else if (next.type === "custom") {
    if (query.customFrom && localDateTimeToUnixSeconds(query.customFrom) !== undefined) {
      next.customFrom = query.customFrom;
    }
    if (query.customTo && localDateTimeToUnixSeconds(query.customTo) !== undefined) {
      next.customTo = query.customTo;
    }
  }

  if (query.from !== undefined && query.to !== undefined && query.from < query.to) {
    next.from = query.from;
    next.to = query.to;
  }

  return next;
}

export function hasTrackRange(query: HomeQuery): boolean {
  return query.from !== undefined && query.to !== undefined && query.from < query.to;
}

export function rangeHeading(query: HomeQuery): string {
  if (query.type === "annual" && query.year !== undefined) {
    return String(query.year);
  }
  if (query.type === "seasonal" && query.season && query.year !== undefined) {
    return `${SEASON_LABELS[query.season]} ${query.year}`;
  }
  return "Custom Range";
}

export function isSecondaryComplete(query: HomeQuery): boolean {
  if (query.type === "annual") {
    return query.year !== undefined;
  }
  if (query.type === "seasonal") {
    return query.season !== undefined && query.year !== undefined;
  }
  if (query.type === "custom") {
    const from = query.customFrom ? localDateTimeToUnixSeconds(query.customFrom) : undefined;
    const to = query.customTo ? localDateTimeToUnixSeconds(query.customTo) : undefined;
    return from !== undefined && to !== undefined && from < to;
  }
  return false;
}

export function computeTrackRange(query: HomeQuery): { from: number; to: number } | undefined {
  if (query.type === "annual" && query.year !== undefined) {
    return getAnnualRange(query.year);
  }
  if (query.type === "seasonal" && query.season && query.year !== undefined) {
    return getSeasonRange(query.year, query.season);
  }
  if (query.type === "custom" && query.customFrom && query.customTo) {
    const from = localDateTimeToUnixSeconds(query.customFrom);
    const to = localDateTimeToUnixSeconds(query.customTo);
    if (from !== undefined && to !== undefined && from < to) {
      return { from, to };
    }
  }
  return undefined;
}
