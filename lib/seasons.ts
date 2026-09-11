import solsticeEquinox from "@/public/reference/solstice_equinox.json";

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

export type Season = (typeof SEASONS)[number];

export type SeasonRange = {
  from: number;
  to: number;
};

type SeasonMarkers = Record<Season, number>;

const markersByYear = solsticeEquinox as Record<string, SeasonMarkers>;

const SEASON_END: Record<Season, Season | "nextSpring"> = {
  spring: "summer",
  summer: "autumn",
  autumn: "winter",
  winter: "nextSpring",
};

export function isSeason(value: string): value is Season {
  return (SEASONS as readonly string[]).includes(value);
}

export function getSeasonRange(year: number, season: Season): SeasonRange {
  const markers = markersByYear[String(year)];
  if (!markers) {
    throw new RangeError(`No solstice/equinox data for ${year}`);
  }

  const from = markers[season];
  const end = SEASON_END[season];
  const to =
    end === "nextSpring" ? markersByYear[String(year + 1)]?.spring : markers[end];

  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new RangeError(`Incomplete solstice/equinox data for ${season} ${year}`);
  }

  return { from, to };
}

export function listSelectableYears(
  season: Season,
  nowSeconds = Math.floor(Date.now() / 1000),
): number[] {
  return Object.keys(markersByYear)
    .map(Number)
    .sort((a, b) => b - a)
    .filter((year) => {
      try {
        const { from } = getSeasonRange(year, season);
        return from <= nowSeconds;
      } catch {
        return false;
      }
    });
}
