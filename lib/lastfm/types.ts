export type UnixTimestamp = Date | number;

export type GetRecentTracksParams = {
  user: string;
  from: UnixTimestamp;
  to: UnixTimestamp;
  limit?: number;
  page?: number;
  signal?: AbortSignal;
};

export type GetRecentTracksInRangeParams = {
  user: string;
  from: UnixTimestamp;
  to: UnixTimestamp;
  signal?: AbortSignal;
};

export type GetUserInfoParams = {
  user: string;
  signal?: AbortSignal;
};

export type MusicEntity = {
  name: string;
  mbid?: string;
};

export type RecentTrack = {
  name: string;
  url: string;
  mbid?: string;
  artist: MusicEntity;
  album?: MusicEntity;
  playedAt?: Date;
  nowPlaying: boolean;
};

export type RecentTracksPage = {
  tracks: RecentTrack[];
  user: string;
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
};

export type UserImage = {
  size: string;
  url: string;
};

export type UserInfo = {
  name: string;
  realName?: string;
  url: string;
  country?: string;
  playcount: number;
  artistCount?: number;
  albumCount?: number;
  trackCount?: number;
  playlists: number;
  subscriber: boolean;
  type?: string;
  registeredAt?: Date;
  images: UserImage[];
};

export type LastFmSecrets = {
  api_key: string;
  api_secret: string;
};
