import { useEffect, useState, type ReactNode } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { animate } from "framer-motion";

function useCountUp(target: number, duration = 0.9) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [target, duration]);
  return Math.round(val);
}

export function StatCard({
  label,
  value,
  icon,
  color = "#4f46e5",
  prefix = "",
  suffix = "",
  subtext,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color?: string;
  prefix?: string;
  suffix?: string;
  subtext?: string;
}) {
  const count = useCountUp(Number.isFinite(value) ? value : 0);
  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": { transform: "translateY(-3px)" },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(color, 0.14),
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
              {prefix}
              {count.toLocaleString()}
              {suffix}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
          </Box>
        </Stack>
        {subtext && (
          <Typography variant="caption" sx={{ mt: 1.5, display: "block" }}>
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
