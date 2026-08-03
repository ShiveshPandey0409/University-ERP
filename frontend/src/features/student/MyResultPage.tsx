import { Box, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { myResult } from "../../api/results";
import { MarksheetView } from "../results/MarksheetView";
import { PageHeader } from "../../components/PageHeader";
import { CardSkeleton } from "../../components/Skeletons";
import { EmptyState } from "../../components/EmptyState";

export default function MyResultPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["my-result"], queryFn: myResult });

  return (
    <Box>
      <PageHeader title="My Result" subtitle="Published marksheets for your enrolment." />
      {isLoading ? (
        <Stack spacing={2}>
          <CardSkeleton height={280} />
          <CardSkeleton height={280} />
        </Stack>
      ) : data.length === 0 ? (
        <EmptyState title="No published result yet" />
      ) : (
        data.map((m, i) => <MarksheetView key={i} m={m} />)
      )}
    </Box>
  );
}
