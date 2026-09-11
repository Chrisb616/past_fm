"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Container, TextField, Typography } from "@mui/material";

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
      <Box sx={{ mt: 3, mx: "auto", maxWidth: 480, width: "100%" }}>
        <TextField
          fullWidth
          placeholder="Enter last.fm username"
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
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button variant="contained" onClick={handleGetStarted}>
            Get Started
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
