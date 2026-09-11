import { Container, Typography } from "@mui/material";

export default function TrackListLoading() {
  return (
    <Container maxWidth="md" sx={{ pt: 6, textAlign: "center" }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Track List
      </Typography>
      <Typography>Loading tracks…</Typography>
    </Container>
  );
}
