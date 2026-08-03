import { Avatar, Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { myProfile } from "../../api/student";
import { PageHeader } from "../../components/PageHeader";
import { CardSkeleton } from "../../components/Skeletons";
import { EmptyState } from "../../components/EmptyState";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box sx={{ minWidth: 200, flex: "1 1 200px" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export default function MyProfilePage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["my-profile"], queryFn: myProfile });

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Your enrolment and personal details." />

      {isLoading ? (
        <CardSkeleton height={320} />
      ) : isError || !data ? (
        <Card>
          <CardContent>
            <EmptyState title="Could not load profile" subtitle="Please try again later." />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}>
              <Avatar
                src={data.photo_url ?? undefined}
                sx={{ width: 96, height: 116, borderRadius: 2 }}
                variant="rounded"
              >
                {data.name?.[0] ?? "?"}
              </Avatar>
              <Box>
                <Typography variant="h6">{data.name}</Typography>
                {data.name_hindi && (
                  <Typography variant="body2" color="text.secondary">
                    {data.name_hindi}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Enrol No: {data.enroll_no}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                  {data.category && <Chip size="small" color="primary" variant="outlined" label={data.category} />}
                  {data.gender && <Chip size="small" label={data.gender} />}
                  {data.prof_status && (
                    <Chip
                      size="small"
                      color={data.prof_status.toLowerCase().includes("complete") ? "success" : "warning"}
                      label={data.prof_status}
                    />
                  )}
                  {data.ews === "Y" && <Chip size="small" variant="outlined" label="EWS" />}
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" flexWrap="wrap" gap={2.5}>
              <Field label="Father's Name" value={data.father_name} />
              <Field label="Mother's Name" value={data.mother_name} />
              <Field label="Date of Birth" value={data.dob} />
              <Field label="Gender" value={data.gender} />
              <Field label="Category" value={data.category} />
              <Field label="Mobile" value={data.mobile} />
              <Field label="Email" value={data.email} />
              <Field label="Address" value={data.address1} />
              <Field label="City" value={data.city1} />
              <Field label="State" value={data.state1} />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
