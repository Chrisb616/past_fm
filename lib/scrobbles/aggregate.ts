import type { RecentTrack } from "@/lib/lastfm/types";

export type TrackRow = {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  url: string;
  scrobbles: number;
};

export type ArtistRow = {
  id: string;
  name: string;
  scrobbles: number;
  trackIds: string[];
  albumIds: string[];
};

export type AlbumTrackCount = {
  trackId: string;
  scrobbles: number;
};

export type AlbumRow = {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  scrobbles: number;
  tracks: AlbumTrackCount[];
};

export type ListeningCharts = {
  tracks: TrackRow[];
  artists: ArtistRow[];
  albums: AlbumRow[];
};

type MutableArtist = {
  id: string;
  name: string;
  scrobbles: number;
  trackIds: Set<string>;
  albumIds: Set<string>;
};

type MutableTrack = {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  url: string;
  scrobbles: number;
};

type MutableAlbum = {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  scrobbles: number;
  trackCounts: Map<string, number>;
};

export function aggregateScrobbles(tracks: RecentTrack[]): ListeningCharts {
  const artists = new Map<string, MutableArtist>();
  const trackRows = new Map<string, MutableTrack>();
  const albums = new Map<string, MutableAlbum>();

  for (const scrobble of tracks) {
    if (scrobble.nowPlaying) {
      continue;
    }

    const artistName = scrobble.artist.name;
    const artistId = entityKey(artistName);
    const artist = getOrCreateArtist(artists, artistId, artistName);
    artist.scrobbles += 1;

    const trackId = `${artistId}\0${entityKey(scrobble.name)}`;
    const track = getOrCreateTrack(trackRows, {
      id: trackId,
      name: scrobble.name,
      artistId,
      artistName: artist.name,
      url: scrobble.url,
    });
    track.scrobbles += 1;
    artist.trackIds.add(trackId);

    const albumName = scrobble.album?.name.trim() ?? "";
    if (!albumName) {
      continue;
    }

    const albumId = `${artistId}\0${entityKey(albumName)}`;
    const album = getOrCreateAlbum(albums, {
      id: albumId,
      name: albumName,
      artistId,
      artistName: artist.name,
    });
    album.scrobbles += 1;
    album.trackCounts.set(trackId, (album.trackCounts.get(trackId) ?? 0) + 1);
    artist.albumIds.add(albumId);
  }

  const sortedTracks = [...trackRows.values()].sort(compareByScrobblesThenName);
  const sortedArtists = [...artists.values()]
    .map((artist) => materializeArtist(artist, trackRows, albums))
    .sort(compareByScrobblesThenName);
  const sortedAlbums = [...albums.values()]
    .map((album) => materializeAlbum(album, trackRows))
    .sort(compareByScrobblesThenName);

  return {
    tracks: sortedTracks,
    artists: sortedArtists,
    albums: sortedAlbums,
  };
}

function entityKey(name: string): string {
  return name.trim().toLowerCase();
}

function getOrCreateArtist(
  artists: Map<string, MutableArtist>,
  id: string,
  name: string,
): MutableArtist {
  const existing = artists.get(id);
  if (existing) {
    return existing;
  }

  const created: MutableArtist = {
    id,
    name,
    scrobbles: 0,
    trackIds: new Set(),
    albumIds: new Set(),
  };
  artists.set(id, created);
  return created;
}

function getOrCreateTrack(
  tracks: Map<string, MutableTrack>,
  seed: Omit<MutableTrack, "scrobbles">,
): MutableTrack {
  const existing = tracks.get(seed.id);
  if (existing) {
    return existing;
  }

  const created: MutableTrack = { ...seed, scrobbles: 0 };
  tracks.set(seed.id, created);
  return created;
}

function getOrCreateAlbum(
  albums: Map<string, MutableAlbum>,
  seed: Omit<MutableAlbum, "scrobbles" | "trackCounts">,
): MutableAlbum {
  const existing = albums.get(seed.id);
  if (existing) {
    return existing;
  }

  const created: MutableAlbum = {
    ...seed,
    scrobbles: 0,
    trackCounts: new Map(),
  };
  albums.set(seed.id, created);
  return created;
}

function materializeArtist(
  artist: MutableArtist,
  tracks: Map<string, MutableTrack>,
  albums: Map<string, MutableAlbum>,
): ArtistRow {
  const trackIds = [...artist.trackIds].sort((leftId, rightId) => {
    const left = tracks.get(leftId);
    const right = tracks.get(rightId);
    return compareByScrobblesThenName(
      left ?? { scrobbles: 0, name: leftId },
      right ?? { scrobbles: 0, name: rightId },
    );
  });
  const albumIds = [...artist.albumIds].sort((leftId, rightId) => {
    const left = albums.get(leftId);
    const right = albums.get(rightId);
    return compareByScrobblesThenName(
      left ?? { scrobbles: 0, name: leftId },
      right ?? { scrobbles: 0, name: rightId },
    );
  });

  return {
    id: artist.id,
    name: artist.name,
    scrobbles: artist.scrobbles,
    trackIds,
    albumIds,
  };
}

function materializeAlbum(
  album: MutableAlbum,
  tracks: Map<string, MutableTrack>,
): AlbumRow {
  const albumTracks = [...album.trackCounts.entries()]
    .map(([trackId, scrobbles]) => ({ trackId, scrobbles }))
    .sort((left, right) => {
      const scrobbleOrder = right.scrobbles - left.scrobbles;
      if (scrobbleOrder !== 0) {
        return scrobbleOrder;
      }
      const leftName = tracks.get(left.trackId)?.name ?? left.trackId;
      const rightName = tracks.get(right.trackId)?.name ?? right.trackId;
      return leftName.localeCompare(rightName);
    });

  return {
    id: album.id,
    name: album.name,
    artistId: album.artistId,
    artistName: album.artistName,
    scrobbles: album.scrobbles,
    tracks: albumTracks,
  };
}

function compareByScrobblesThenName(
  left: { scrobbles: number; name: string },
  right: { scrobbles: number; name: string },
): number {
  if (left.scrobbles !== right.scrobbles) {
    return right.scrobbles - left.scrobbles;
  }
  return left.name.localeCompare(right.name);
}
