"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import { SEASONS, getSeasonRange, listSelectableYears, type Season } from "@/lib/seasons";
import {
  getAnnualRange,
  listSelectableCalendarYears,
  localDateTimeToUnixSeconds,
} from "@/lib/time-ranges";

const TYPES = ["Annual", "Seasonal", "Custom"] as const;
const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export default function TypeSelectionPage() {
  return (
    <Suspense>
      <TypeSelection />
    </Suspense>
  );
}

function TypeSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = searchParams.get("user") ?? "";
  const [selectedType, setSelectedType] = useState<(typeof TYPES)[number] | null>(
    null,
  );
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handleSelectType = (type: (typeof TYPES)[number]) => {
    setSelectedType(type);
    setSelectedSeason(null);
    setCustomFrom("");
    setCustomTo("");
  };

  const goToTrackList = (from: number, to: number) => {
    const params = new URLSearchParams({
      user,
      from: String(from),
      to: String(to),
    });
    router.push(`/track-list?${params.toString()}`);
  };

  const handleSelectSeasonYear = (event: SelectChangeEvent) => {
    if (!selectedSeason) return;

    const year = Number(event.target.value);
    if (!Number.isInteger(year)) return;

    const { from, to } = getSeasonRange(year, selectedSeason);
    goToTrackList(from, to);
  };

  const handleSelectAnnualYear = (event: SelectChangeEvent) => {
    const year = Number(event.target.value);
    if (!Number.isInteger(year)) return;

    const { from, to } = getAnnualRange(year);
    goToTrackList(from, to);
  };

  const handleSubmitCustom = () => {
    const from = localDateTimeToUnixSeconds(customFrom);
    const to = localDateTimeToUnixSeconds(customTo);
    if (from === undefined || to === undefined || from >= to) return;

    goToTrackList(from, to);
  };

  const seasonYears = selectedSeason ? listSelectableYears(selectedSeason) : [];
  const annualYears = listSelectableCalendarYears();
  const customFromUnix = localDateTimeToUnixSeconds(customFrom);
  const customToUnix = localDateTimeToUnixSeconds(customTo);
  const customRangeValid =
    customFromUnix !== undefined &&
    customToUnix !== undefined &&
    customFromUnix < customToUnix;

  return (
    <Container maxWidth="md" sx={{ pt: 6, textAlign: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
        {TYPES.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "contained" : "outlined"}
            onClick={() => handleSelectType(type)}
          >
            {type}
          </Button>
        ))}
      </Box>

      {selectedType === "Seasonal" && (
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
              variant={selectedSeason === season ? "contained" : "outlined"}
              onClick={() => setSelectedSeason(season)}
            >
              {SEASON_LABELS[season]}
            </Button>
          ))}
        </Box>
      )}

      {selectedType === "Seasonal" && selectedSeason && (
        <FormControl sx={{ mt: 3, minWidth: 160 }}>
          <InputLabel id="season-year-label">Year</InputLabel>
          <Select
            labelId="season-year-label"
            label="Year"
            value=""
            onChange={handleSelectSeasonYear}
          >
            {seasonYears.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedType === "Annual" && (
        <FormControl sx={{ mt: 3, minWidth: 160 }}>
          <InputLabel id="annual-year-label">Year</InputLabel>
          <Select
            labelId="annual-year-label"
            label="Year"
            value=""
            onChange={handleSelectAnnualYear}
          >
            {annualYears.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedType === "Custom" && (
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
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To"
            type="datetime-local"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            variant="contained"
            onClick={handleSubmitCustom}
            disabled={!customRangeValid}
          >
            Continue
          </Button>
        </Box>
      )}
    </Container>
  );
}
