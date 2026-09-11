"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Container, TextField, Typography, Stack } from "@mui/material";

export default function Landing() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleGetStarted = () => {
    const user = username.trim();
    if (!user) return;
    router.push(`/type-selection?user=${encodeURIComponent(user)}`);
  };

  return (
    <Container maxWidth="md" sx={{ pt: 6, textAlign: "center" }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Past.fm
      </Typography>
      <Box sx={{ mt: 5, mx: "auto", maxWidth: 480, width: "100%" }}>
        <Stack direction = "row" spacing={2}>
          <TextField
            fullWidth
            placeholder="Enter Last.fm username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleGetStarted();
            }}
            slotProps={{
              input: {
                sx: { borderRadius: 2, backgroundColor: "#fff" },
              },
            }}
            sx={{ textAlign: "left" }}
          />
          <Button variant="contained" onClick={handleGetStarted}>
            Continue
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
