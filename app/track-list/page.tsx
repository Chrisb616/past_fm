import { Container, Typography } from "@mui/material";

import { getLastFmClient } from "@/lib/lastfm";
import { LastFmError } from "@/lib/lastfm/errors";
import type { RecentTrack } from "@/lib/lastfm/types";

export default async function TrackList({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; from?: string; to?: string }>;
}) {
  const { user = "", from: fromParam, to: toParam } = await searchParams;
  const from = parseUnixSeconds(fromParam);
  const to = parseUnixSeconds(toParam);

  if (!user || from === undefined || to === undefined) {
    return (
      <Container maxWidth="md" sx={{ pt: 6, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Track List
        </Typography>
        <Typography>
          {user ? `user: ${user}` : "Choose a time range to load tracks."}
        </Typography>
      </Container>
    );
  }

  let tracks: RecentTrack[];
  try {
    const client = await getLastFmClient();
    tracks = await client.getRecentTracksInRange({ user, from, to });
  } catch (error) {
    return (
      <Container maxWidth="md" sx={{ pt: 6, textAlign: "left" }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, textAlign: "center" }}>
          Track List
        </Typography>
        <Typography color="error">{errorMessage(error)}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 6, pb: 6, textAlign: "left" }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700, textAlign: "center" }}
      >
        Track List
      </Typography>
      {tracks.length === 0 ? (
        <Typography>No tracks in this range.</Typography>
      ) : (
        tracks.map((track, index) => (
          <Typography key={trackKey(track, index)} component="p">
            {track.artist.name} — {track.name}
          </Typography>
        ))
      )}
    </Container>
  );
}

function parseUnixSeconds(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
}

function errorMessage(error: unknown): string {
  if (error instanceof LastFmError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to load tracks.";
}

function trackKey(track: RecentTrack, index: number): string {
  const playedAt = track.playedAt?.toISOString() ?? "unknown";
  return `${index}-${track.url}-${playedAt}`;
}
