import { useEffect, useState } from "react";

import { Box, Button, Card, CardContent, Tab, Tabs, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { getNotice, updateNotice } from "../../api/support";
import { PageHeader } from "../../components/PageHeader";
import { toast } from "../../components/toast";

export default function NoticesPage() {
  const { data } = useQuery({ queryKey: ["notice"], queryFn: getNotice });
  const [text, setText] = useState("");
  const [tab, setTab] = useState(0); // 0 = rendered preview, 1 = edit HTML

  useEffect(() => {
    if (data?.details != null) setText(data.details);
  }, [data]);

  async function save() {
    await updateNotice(text);
    toast.success("Notice updated");
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <PageHeader
        title="Notice Board"
        subtitle="Publish announcements shown across the portal."
        actions={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={save}>
            Save
          </Button>
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Preview" />
        <Tab label="Edit HTML" />
      </Tabs>

      {tab === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                overflowX: "auto",
                "& table": { borderCollapse: "collapse", width: "100%", my: 1 },
                "& td, & th": { border: "1px solid #ddd", padding: "6px 8px", verticalAlign: "top" },
                "& a": { color: "primary.main", wordBreak: "break-word" },
                fontSize: 14,
              }}
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </CardContent>
        </Card>
      ) : (
        <TextField
          multiline
          minRows={24}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          InputProps={{ sx: { fontFamily: "monospace", fontSize: 12.5, alignItems: "flex-start" } }}
        />
      )}
    </Box>
  );
}
