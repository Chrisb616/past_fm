"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import EditIcon from "@mui/icons-material/Edit";

import { getRecentTracksAction, getUserInfoAction } from "@/lib/lastfm/actions";
import type { TrackDto, UserInfoDto } from "@/lib/lastfm/actions";
import {
  RANGE_TYPES,
  SEASON_LABELS,
  canonicalizeHomeQuery,
  computeTrackRange,
  hasTrackRange,
  homeHref,
  isSecondaryComplete,
  parseHomeQuery,
  rangeHeading,
  relevantHomeSearch,
  serializeHomeQuery,
  type HomeQuery,
  type RangeType,
} from "@/lib/home-query";
import { SEASONS, listSelectableYears, type Season } from "@/lib/seasons";
import { listSelectableCalendarYears } from "@/lib/time-ranges";
import { useToast } from "@/components/toast";

const TYPE_LABELS: Record<RangeType, string> = {
  annual: "Annual",
  seasonal: "Seasonal",
  custom: "Custom",
};

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

type TracksLoad = {
  user: string;
  from: number;
  to: number;
  tracks?: TrackDto[];
  error?: string;
};

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const query = canonicalizeHomeQuery(parseHomeQuery(searchParams));

  const [usernameDraft, setUsernameDraft] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfoDto | null>(null);
  const [userInfoUser, setUserInfoUser] = useState<string | null>(null);
  const [tracksLoad, setTracksLoad] = useState<TracksLoad | null>(null);

  useEffect(() => {
    const canonicalSearch = serializeHomeQuery(query);
    if (relevantHomeSearch(searchParams) !== canonicalSearch) {
      router.replace(homeHref(query));
    }
  }, [query, router, searchParams]);

  const userReady = userInfo !== null && userInfoUser === query.user;
  const showTracks = userReady && hasTrackRange(query);
  const tracksMatch =
    tracksLoad !== null &&
    tracksLoad.user === query.user &&
    tracksLoad.from === query.from &&
    tracksLoad.to === query.to;
  const tracks = tracksMatch ? tracksLoad.tracks : undefined;
  const tracksError = tracksMatch ? tracksLoad.error : undefined;
  const tracksLoading = showTracks && !tracksMatch;

  useEffect(() => {
    const user = query.user;
    if (!user || userInfoUser === user) {
      return;
    }

    let cancelled = false;

    getUserInfoAction(user)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          showToast(
            result.reason === "not_found"
              ? `User ${user} not found`
              : "Something went wrong, please try again",
            "failure",
          );
          setUsernameDraft(user);
          router.replace("/");
          return;
        }
        setUserInfo(result.user);
        setUserInfoUser(user);
      })
      .catch(() => {
        if (cancelled) return;
        showToast("Something went wrong, please try again", "failure");
        setUsernameDraft(user);
        router.replace("/");
      });

    return () => {
      cancelled = true;
    };
  }, [query.user, router, showToast, userInfoUser]);

  useEffect(() => {
    if (!showTracks || !query.user || query.from === undefined || query.to === undefined) {
      return;
    }

    const user = query.user;
    const from = query.from;
    const to = query.to;
    let cancelled = false;

    getRecentTracksAction({ user, from, to })
      .then((result) => {
        if (cancelled) return;
        setTracksLoad({ user, from, to, tracks: result });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTracksLoad({
          user,
          from,
          to,
          error: error instanceof Error ? error.message : "Failed to load tracks.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [showTracks, query.user, query.from, query.to]);

  const navigate = (next: HomeQuery, mode: "push" | "replace" = "push") => {
    const href = homeHref(canonicalizeHomeQuery(next));
    if (mode === "replace") {
      router.replace(href);
      return;
    }
    router.push(href);
  };

  const handleUsernameContinue = () => {
    const user = usernameDraft.trim();
    if (!user) return;
    navigate({ user });
  };

  const handleChangeUser = () => {
    setUsernameDraft(query.user ?? usernameDraft);
    router.push("/");
  };

  const handleSelectType = (type: RangeType) => {
    if (!query.user || query.type === type) return;
    navigate({ user: query.user, type });
  };

  const handleSelectSeason = (season: Season) => {
    if (!query.user || query.season === season) return;
    navigate({
      user: query.user,
      type: "seasonal",
      season,
    });
  };

  const handleSelectYear = (event: SelectChangeEvent) => {
    const year = Number(event.target.value);
    if (!query.user || !Number.isInteger(year)) return;
    navigate({
      user: query.user,
      type: query.type,
      season: query.season,
      year,
      customFrom: query.customFrom,
      customTo: query.customTo,
    });
  };

  const handleCustomChange = (field: "customFrom" | "customTo", value: string) => {
    if (!query.user) return;
    navigate(
      {
        user: query.user,
        type: "custom",
        customFrom: field === "customFrom" ? value : query.customFrom,
        customTo: field === "customTo" ? value : query.customTo,
      },
      "replace",
    );
  };

  const handleRangeContinue = () => {
    const range = computeTrackRange(query);
    if (!query.user || !range) return;
    navigate({ ...query, from: range.from, to: range.to });
  };

  const displayName = userReady ? userInfo.name : (query.user ?? usernameDraft);
  const seasonYears = query.season ? listSelectableYears(query.season) : [];
  const annualYears = listSelectableCalendarYears();
  const continueEnabled = isSecondaryComplete(query);

  return (
    <Container maxWidth="md" sx={{ pt: 6, pb: 6, textAlign: "center" }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Past.fm
      </Typography>

      <Box sx={{ mt: 5, mx: "auto", maxWidth: 360, width: "100%" }}>
        {query.user && !userReady ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : userReady ? (
          <Card sx={{ p: 2, position: "relative" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", pr: 5 }}>
              {userReady && userInfo.imageUrl ? (
                <IconButton
                  component="a"
                  href={userInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${displayName} on Last.fm`}
                  sx={{ p: 0 }}
                >
                  <Avatar src={userInfo.imageUrl} alt={displayName} />
                </IconButton>
              ) : null}
              <Stack direction="column" spacing={1} sx={{ flexGrow: 1, minWidth: 0, textAlign: "left" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                    {displayName}
                  </Typography>
                  {userInfo?.realname ? (
                    <Typography variant="body2" sx={{ fontStyle: "italic", lineHeight: 1.2 }}>
                      {userInfo.realname}
                    </Typography>
                  ) : null}
                </Box>
                <Typography>
                  User Since:{" "}
                  {userInfo?.registered
                    ? new Date(userInfo.registered * 1000).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </Typography>
                <Typography>Playcount: {userInfo?.playcount}</Typography>
              </Stack>
            </Stack>
            <IconButton
              onClick={handleChangeUser}
              aria-label="Change user"
              sx={{
                position: "absolute",
                right: 8,
                bottom: 8,
                width: 36,
                height: 36,
                borderRadius: 1,
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Card>
        ) : (
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              placeholder="Enter Last.fm username"
              value={usernameDraft}
              onChange={(event) => setUsernameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleUsernameContinue();
              }}
              sx={{ textAlign: "left" }}
            />
            <Button variant="contained" onClick={handleUsernameContinue}>
              Continue
            </Button>
          </Stack>
        )}
      </Box>

      {userReady && !showTracks ? (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mt: 5,
            }}
          >
            {RANGE_TYPES.map((type) => (
              <Button
                key={type}
                variant={query.type === type ? "contained" : "outlined"}
                onClick={() => handleSelectType(type)}
              >
                {TYPE_LABELS[type]}
              </Button>
            ))}
          </Box>

          {query.type === "seasonal" ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
                mt: 3,
              }}
            >
              {SEASONS.map((season) => (
                <Button
                  key={season}
                  variant={query.season === season ? "contained" : "outlined"}
                  onClick={() => handleSelectSeason(season)}
                >
                  {SEASON_LABELS[season]}
                </Button>
              ))}
            </Box>
          ) : null}

          {query.type === "seasonal" && query.season ? (
            <FormControl sx={{ mt: 3, minWidth: 160 }}>
              <InputLabel id="season-year-label">Year</InputLabel>
              <Select
                labelId="season-year-label"
                label="Year"
                value={query.year !== undefined ? String(query.year) : ""}
                onChange={handleSelectYear}
              >
                {seasonYears.map((year) => (
                  <MenuItem key={year} value={String(year)}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {query.type === "annual" ? (
            <FormControl sx={{ mt: 3, minWidth: 160 }}>
              <InputLabel id="annual-year-label">Year</InputLabel>
              <Select
                labelId="annual-year-label"
                label="Year"
                value={query.year !== undefined ? String(query.year) : ""}
                onChange={handleSelectYear}
              >
                {annualYears.map((year) => (
                  <MenuItem key={year} value={String(year)}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {query.type === "custom" ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                mt: 3,
              }}
            >
              <TextField
                label="From"
                type="datetime-local"
                value={query.customFrom ?? ""}
                onChange={(event) => handleCustomChange("customFrom", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="To"
                type="datetime-local"
                value={query.customTo ?? ""}
                onChange={(event) => handleCustomChange("customTo", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          ) : null}

          {query.type ? (
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleRangeContinue} disabled={!continueEnabled}>
                Continue
              </Button>
            </Box>
          ) : null}
        </>
      ) : null}

      {userReady && showTracks ? (
        <Box sx={{ mt: 5, textAlign: "left" }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, textAlign: "center" }}>
            {rangeHeading(query)}
          </Typography>
          {tracksLoading ? <Typography>Loading tracks…</Typography> : null}
          {tracksError ? <Typography color="error">{tracksError}</Typography> : null}
          {tracks && tracks.length === 0 ? <Typography>No tracks in this range.</Typography> : null}
          {tracks?.map((track, index) => (
            <Typography key={trackKey(track, index)} component="p">
              {track.artistName} — {track.name}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Container>
  );
}

function trackKey(track: TrackDto, index: number): string {
  const playedAt = track.playedAtIso ?? "unknown";
  return `${index}-${track.url}-${playedAt}`;
}
