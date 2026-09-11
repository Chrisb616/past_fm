"use server";

import { getLastFmApiKey, getRecentTracksInRange, getUserInfo } from "./client";
import { LastFmError } from "./errors";
import type { UserImage } from "./types";

export type UserInfoDto = {
  name: string;
  realname: string;
  url: string;
  playcount: number;
  registered: number;
  imageUrl?: string;
};

export type TrackDto = {
  artistName: string;
  name: string;
  url: string;
  playedAtIso: string | null;
};

export async function getUserInfoAction(user: string): Promise<UserInfoDto> {
  try {
    const apiKey = await getLastFmApiKey();
    const info = await getUserInfo({ apiKey, user });
    return {
      name: info.name,
      realname: info.realName ?? "",
      url: info.url,
      playcount: info.playcount,
      registered: info.registeredAt
        ? Math.floor(info.registeredAt.getTime() / 1000)
        : 0,
      imageUrl: userImageUrl(info.images),
    };
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load user."));
  }
}

export async function getRecentTracksAction(params: {
  user: string;
  from: number;
  to: number;
}): Promise<TrackDto[]> {
  try {
    const apiKey = await getLastFmApiKey();
    const tracks = await getRecentTracksInRange({ apiKey, ...params });
    return tracks.map((track) => ({
      artistName: track.artist.name,
      name: track.name,
      url: track.url,
      playedAtIso: track.playedAt?.toISOString() ?? null,
    }));
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load tracks."));
  }
}

function userImageUrl(images: UserImage[]): string | undefined {
  const medium = images.find((image) => image.size === "medium" && image.url);
  if (medium) return medium.url;
  return images.find((image) => image.url)?.url;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof LastFmError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
