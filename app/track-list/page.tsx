import { Container, Typography } from "@mui/material";

export default async function TrackList({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; type?: string }>;
}) {
  const { user = "", type = "" } = await searchParams;

  return (
    <Container maxWidth="md" sx={{ pt: 6, textAlign: "center" }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Track List
      </Typography>
      <Typography>
        user: {user}, selection: {type}
      </Typography>
    </Container>
  );
}
