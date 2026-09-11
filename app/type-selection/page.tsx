"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Container } from "@mui/material";

const TYPES = ["Annual", "Seasonal", "Custom"] as const;

export default function TypeSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = searchParams.get("user") ?? "";

  const handleSelect = (type: string) => {
    router.push(
      `/track-list?user=${encodeURIComponent(user)}&type=${encodeURIComponent(type)}`,
    );
  };

  return (
    <Container maxWidth="md" sx={{ pt: 6, textAlign: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
        {TYPES.map((type) => (
          <Button key={type} variant="contained" onClick={() => handleSelect(type)}>
            {type}
          </Button>
        ))}
      </Box>
    </Container>
  );
}
