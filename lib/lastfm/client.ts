import "server-only";

import { LastFmError } from "./errors";
import { loadLastFmSecrets } from "./secrets";
import type {
  GetRecentTracksInRangeParams,
  GetRecentTracksParams,
  GetUserInfoParams,
  MusicEntity,
  RecentTrack,
  RecentTracksPage,
  UnixTimestamp,
  UserImage,
  UserInfo,
} from "./types";

const API_ROOT = "https://ws.audioscrobbler.com/2.0/";
const USER_AGENT = "past.fm/0.1.0";
const MAX_LIMIT = 200;
const DEFAULT_RANGE_LIMIT = 200;
const PAGE_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const TRANSIENT_ERROR_CODES = new Set([11, 16, 29]);

type LastFmTextEntity = {
  mbid?: string;
  name?: string;
  "#text"?: string;
};

type LastFmTrackJson = {
  name: string;
  url: string;
  mbid?: string;
  artist: LastFmTextEntity;
  album?: LastFmTextEntity;
  date?: {
    uts?: string;
    "#text"?: string;
  };
  "@attr"?: {
    nowplaying?: string;
  };
};

type LastFmErrorPayload = {
  error?: number;
  message?: string;
};

type LastFmRecentTracksResponse = LastFmErrorPayload & {
  recenttracks?: {
    track?: LastFmTrackJson | LastFmTrackJson[];
    "@attr"?: {
      user?: string;
      page?: string;
      perPage?: string;
      totalPages?: string;
      total?: string;
    };
  };
};

type LastFmImageJson = {
  size?: string;
  "#text"?: string;
};

type LastFmUserInfoJson = {
  name: string;
  realname?: string;
  url: string;
  country?: string;
  playcount?: string;
  artist_count?: string;
  album_count?: string;
  track_count?: string;
  playlists?: string;
  subscriber?: string;
  type?: string;
  registered?: {
    unixtime?: string;
  };
  image?: LastFmImageJson | LastFmImageJson[];
};

type LastFmUserInfoResponse = LastFmErrorPayload & {
  user?: LastFmUserInfoJson;
};

export class LastFmClient {
  constructor(private readonly apiKey: string) {}

  async getRecentTracks(params: GetRecentTracksParams): Promise<RecentTracksPage> {
    const user = requireUser(params.user);
    const from = toUnixSeconds(params.from);
    const to = toUnixSeconds(params.to);
    requireRange(from, to);

    const limit = params.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new RangeError(`limit must be an integer between 1 and ${MAX_LIMIT}`);
    }

    const page = params.page ?? 1;
    if (!Number.isInteger(page) || page < 1) {
      throw new RangeError("page must be an integer greater than or equal to 1");
    }

    const url = new URL(API_ROOT);
    url.searchParams.set("method", "user.getrecenttracks");
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("user", user);
    url.searchParams.set("from", String(from));
    url.searchParams.set("to", String(to));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));

    const payload = await this.requestJson<LastFmRecentTracksResponse>(url, params.signal);
    if (!payload.recenttracks) {
      throw new LastFmError(8, "Last.fm response was missing recenttracks");
    }

    const tracks = unwrapList(payload.recenttracks.track).map(normalizeTrack);
    const attr = payload.recenttracks["@attr"];

    return {
      tracks,
      user: attr?.user ?? user,
      page: parseCount(attr?.page, page),
      perPage: parseCount(attr?.perPage, limit),
      totalPages: parseCount(attr?.totalPages, 0),
      total: parseCount(attr?.total, tracks.length),
    };
  }

  async getRecentTracksInRange(
    params: GetRecentTracksInRangeParams,
  ): Promise<RecentTrack[]> {
    const firstPage = await this.getRecentTracks({
      ...params,
      limit: DEFAULT_RANGE_LIMIT,
      page: 1,
    });

    const tracks = scrobbledTracks(firstPage.tracks);
    const totalPages = firstPage.totalPages;

    for (let page = 2; page <= totalPages; page += 1) {
      await delay(PAGE_DELAY_MS, params.signal);
      const nextPage = await this.getRecentTracks({
        ...params,
        limit: DEFAULT_RANGE_LIMIT,
        page,
      });
      tracks.push(...scrobbledTracks(nextPage.tracks));
    }

    return tracks;
  }

  async getUserInfo(params: GetUserInfoParams): Promise<UserInfo> {
    const user = requireUser(params.user);

    const url = new URL(API_ROOT);
    url.searchParams.set("method", "user.getinfo");
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("user", user);

    const payload = await this.requestJson<LastFmUserInfoResponse>(url, params.signal);
    if (!payload.user) {
      throw new LastFmError(8, "Last.fm response was missing user");
    }

    return normalizeUser(payload.user);
  }

  private async requestJson<T extends LastFmErrorPayload>(
    url: URL,
    callerSignal?: AbortSignal,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.fetchJson<T>(url, callerSignal);
      } catch (error) {
        lastError = error;
        if (callerSignal?.aborted || !isRetryable(error) || attempt === MAX_ATTEMPTS) {
          throw error;
        }
        await delay(250 * 2 ** (attempt - 1), callerSignal);
      }
    }

    throw lastError;
  }

  private async fetchJson<T extends LastFmErrorPayload>(
    url: URL,
    callerSignal?: AbortSignal,
  ): Promise<T> {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout;

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal,
    });

    if (!response.ok) {
      throw new LastFmError(
        response.status,
        `Last.fm request failed with HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as T;

    if (typeof payload.error === "number") {
      throw new LastFmError(payload.error, payload.message ?? "Last.fm request failed");
    }

    return payload;
  }
}

let clientPromise: Promise<LastFmClient> | undefined;

export function getLastFmClient(): Promise<LastFmClient> {
  clientPromise ??= loadLastFmSecrets()
    .then((secrets) => new LastFmClient(secrets.api_key))
    .catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  return clientPromise;
}

function requireUser(user: string): string {
  const trimmed = user.trim();
  if (!trimmed) {
    throw new Error("user is required");
  }
  return trimmed;
}

function requireRange(from: number, to: number): void {
  if (from >= to) {
    throw new RangeError("from must be earlier than to");
  }
}

function toUnixSeconds(value: UnixTimestamp): number {
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }
  if (!Number.isFinite(value)) {
    throw new RangeError("timestamp must be a finite number of Unix seconds");
  }
  return Math.floor(value);
}

function unwrapList<T>(value: T | T[] | undefined): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function normalizeTrack(track: LastFmTrackJson): RecentTrack {
  const uts = track.date?.uts ? Number(track.date.uts) : Number.NaN;
  const album = toMusicEntity(track.album);

  return {
    name: track.name,
    url: track.url,
    mbid: optionalMbid(track.mbid),
    artist: toMusicEntity(track.artist) ?? { name: "" },
    album,
    playedAt: Number.isFinite(uts) ? new Date(uts * 1000) : undefined,
    nowPlaying: track["@attr"]?.nowplaying === "true",
  };
}

function normalizeUser(user: LastFmUserInfoJson): UserInfo {
  const registeredAt = user.registered?.unixtime
    ? Number(user.registered.unixtime)
    : Number.NaN;
  const realName = user.realname?.trim();
  const country = user.country?.trim();

  return {
    name: user.name,
    realName: realName ? realName : undefined,
    url: user.url,
    country: country ? country : undefined,
    playcount: parseCount(user.playcount, 0),
    artistCount: optionalCount(user.artist_count),
    albumCount: optionalCount(user.album_count),
    trackCount: optionalCount(user.track_count),
    playlists: parseCount(user.playlists, 0),
    subscriber: user.subscriber === "1",
    type: user.type || undefined,
    registeredAt: Number.isFinite(registeredAt) ? new Date(registeredAt * 1000) : undefined,
    images: unwrapList(user.image)
      .map(normalizeImage)
      .filter((image): image is UserImage => image !== undefined),
  };
}

function normalizeImage(image: LastFmImageJson): UserImage | undefined {
  const url = image["#text"]?.trim();
  if (!url) {
    return undefined;
  }

  return { size: image.size ?? "", url };
}

function toMusicEntity(entity: LastFmTextEntity | undefined): MusicEntity | undefined {
  if (!entity) {
    return undefined;
  }

  const name = entity["#text"] ?? entity.name ?? "";
  if (!name) {
    return undefined;
  }

  return { name, mbid: optionalMbid(entity.mbid) };
}

function optionalMbid(mbid: string | undefined): string | undefined {
  return mbid ? mbid : undefined;
}

function parseCount(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalCount(value: string | undefined): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function scrobbledTracks(tracks: RecentTrack[]): RecentTrack[] {
  return tracks.filter((track) => !track.nowPlaying);
}

function isRetryable(error: unknown): boolean {
  if (error instanceof LastFmError) {
    return TRANSIENT_ERROR_CODES.has(error.code) || error.code >= 500;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    return error.name === "TimeoutError" || error.name === "AbortError";
  }

  return false;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError(signal));
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError(signal));
      },
      { once: true },
    );
  });
}

function abortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("This operation was aborted", "AbortError");
}
