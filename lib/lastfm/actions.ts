"use server";

import {
  aggregateScrobbles,
  type ListeningCharts,
} from "@/lib/scrobbles/aggregate";
import { getLastFmApiKey, getRecentTracksInRange, getUserInfo } from "./client";
import { LastFmError, isUserNotFoundError } from "./errors";
import type { UserImage } from "./types";

export type { ListeningCharts };

export type UserInfoDto = {
  name: string;
  realname: string;
  url: string;
  playcount: number;
  registered: number;
  imageUrl?: string;
};

export type GetUserInfoActionResult =
  | { ok: true; user: UserInfoDto }
  | { ok: false; reason: "not_found" | "unknown" };

export async function getUserInfoAction(user: string): Promise<GetUserInfoActionResult> {
  try {
    const apiKey = await getLastFmApiKey();
    const info = await getUserInfo({ apiKey, user });
    return {
      ok: true,
      user: {
        name: info.name,
        realname: info.realName ?? "",
        url: info.url,
        playcount: info.playcount,
        registered: info.registeredAt
          ? Math.floor(info.registeredAt.getTime() / 1000)
          : 0,
        imageUrl: userImageUrl(info.images),
      },
    };
  } catch (error) {
    return {
      ok: false,
      reason: isUserNotFoundError(error) ? "not_found" : "unknown",
    };
  }
}

export async function getRecentTracksAction(params: {
  user: string;
  from: number;
  to: number;
}): Promise<ListeningCharts> {
  try {
    const apiKey = await getLastFmApiKey();
    const tracks = await getRecentTracksInRange({ apiKey, ...params });
    return aggregateScrobbles(tracks);
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
