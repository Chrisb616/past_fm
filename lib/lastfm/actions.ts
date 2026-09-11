"use server";

import { getLastFmClient } from "./client";
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
    const client = await getLastFmClient();
    const info = await client.getUserInfo({ user });
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
    const client = await getLastFmClient();
    const tracks = await client.getRecentTracksInRange(params);
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
