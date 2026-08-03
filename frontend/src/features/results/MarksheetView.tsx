import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SchoolIcon from "@mui/icons-material/School";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { openMarksheetPdf, type Marksheet } from "../../api/results";

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export function MarksheetView({ m }: { m: Marksheet }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const finalResult = m.result || m.grand_result || "";
  const isPass = finalResult.toUpperCase() === "PASS";

  return (
    <Card
      sx={{
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        "@media print": { boxShadow: "none", border: "1px solid #ccc" },
      }}
    >
      {/* Header band */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          color: theme.palette.primary.contrastText,
          background: `linear-gradient(120deg, ${primary} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <SchoolIcon sx={{ fontSize: 40, opacity: 0.9 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {m.college_name || "University"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Statement of Marks
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {m.course_name} · Semester {m.semester}
                {m.category ? ` · ${m.category}` : ""}
              </Typography>
            </Box>
          </Stack>
          {m.rollno && (
            <Button
              size="small"
              variant="contained"
              color="inherit"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => openMarksheetPdf(m.rollno!)}
              sx={{
                color: primary,
                bgcolor: "#fff",
                flexShrink: 0,
                "@media print": { display: "none" },
                "&:hover": { bgcolor: alpha("#ffffff", 0.9) },
              }}
            >
              PDF
            </Button>
          )}
        </Stack>
      </Box>

      {/* Meta grid */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        <Meta label="Name" value={m.name} />
        <Meta label="Roll No" value={m.rollno} />
        <Meta label="Enrollment No" value={m.enroll_no} />
        <Meta label="Father's Name" value={m.father_name} />
        <Meta label="Exam" value={m.exam_month} />
        <Meta label="Marksheet No" value={m.marksheet_no} />
      </Box>

      <Divider />

      {/* Papers table */}
      <Box sx={{ px: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary" } }}>
              <TableCell>Code</TableCell>
              <TableCell>Paper</TableCell>
              <TableCell align="right">Max</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {m.papers.map((p, i) => {
              const passed = (p.status || "").toUpperCase() === "PASS";
              return (
                <TableRow key={i} hover>
                  <TableCell>{p.code || "—"}</TableCell>
                  <TableCell>{p.name || "—"}</TableCell>
                  <TableCell align="right">{p.max || "—"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {p.total || "—"}
                  </TableCell>
                  <TableCell align="center">{p.grade || "—"}</TableCell>
                  <TableCell align="center">
                    {p.status ? (
                      <Chip size="small" color={passed ? "success" : "error"} variant="outlined" label={p.status} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Divider />

      {/* Footer chips */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ px: 3, py: 2, bgcolor: alpha(primary, 0.04) }}
      >
        <Chip color="primary" variant="outlined" label={`SGPA: ${m.sgpa || "—"}`} />
        {m.grand_cgpa && <Chip color="primary" label={`CGPA: ${m.grand_cgpa}`} />}
        {m.grand_percent && <Chip color="info" variant="outlined" label={`Percent: ${m.grand_percent}%`} />}
        {m.grand_division && <Chip variant="outlined" label={`Division: ${m.grand_division}`} />}
        {finalResult && (
          <Chip color={isPass ? "success" : "error"} label={`Result: ${finalResult}`} sx={{ fontWeight: 700 }} />
        )}
      </Stack>
    </Card>
  );
}
