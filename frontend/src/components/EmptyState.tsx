import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { Box, Typography } from "@mui/material";

export function EmptyState({ title = "Nothing here yet", subtitle }: { title?: string; subtitle?: string }) {
  return (
    <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
      <InboxOutlinedIcon sx={{ fontSize: 48, opacity: 0.35 }} />
      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        {title}
      </Typography>
      {subtitle && <Typography variant="body2">{subtitle}</Typography>}
    </Box>
  );
}
