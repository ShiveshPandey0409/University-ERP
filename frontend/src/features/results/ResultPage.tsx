import { useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { getMarksheets } from "../../api/results";
import { CardSkeleton } from "../../components/Skeletons";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { MarksheetView } from "./MarksheetView";

export default function ResultPage() {
  const [roll, setRoll] = useState("");
  const [query, setQuery] = useState("");

  const { data = [], isFetching } = useQuery({
    queryKey: ["result", query],
    queryFn: () => getMarksheets(query),
    enabled: Boolean(query),
  });

  return (
    <Box>
      <PageHeader
        title="Results"
        subtitle="Search a roll number to view the published statement of marks."
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              label="Roll Number"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setQuery(roll.trim())}
              sx={{ width: 240 }}
            />
            <Button variant="contained" startIcon={<SearchIcon />} onClick={() => setQuery(roll.trim())}>
              Search
            </Button>
          </Stack>
        }
      />

      {isFetching && <CardSkeleton height={360} />}

      {query && !isFetching && data.length === 0 && (
        <EmptyState title="No published result" subtitle="No published result was found for this roll number." />
      )}

      <Stack spacing={3}>
        {!isFetching &&
          data.map((m, i) => <MarksheetView key={m.rollno ?? i} m={m} />)}
      </Stack>
    </Box>
  );
}
