import { useState, type ReactNode } from "react";

import {
  AssignmentOutlined,
  DarkModeOutlined,
  DashboardOutlined,
  ExpandLess,
  ExpandMore,
  HowToRegOutlined,
  LightModeOutlined,
  Logout,
  PaymentsOutlined,
  SchoolOutlined,
  SupportAgentOutlined,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { useColorMode } from "../app/ThemeModeContext";
import { MotionPage } from "../components/motion";

const DRAWER_WIDTH = 268;
const UNIVERSITY = "Pt. Shambhunath Shukla University, Shahdol (M.P.)";

interface NavItem {
  text: string;
  to: string;
}
interface NavSection {
  section: string;
  icon: ReactNode;
  items: NavItem[];
}

const STAFF_NAV: NavSection[] = [
  {
    section: "Admissions",
    icon: <HowToRegOutlined fontSize="small" />,
    items: [
      { text: "Dashboard", to: "/admission" },
      { text: "Merit List", to: "/admission?tab=merit" },
      { text: "Category × Gender", to: "/admission?tab=report" },
    ],
  },
  { section: "Academics", icon: <SchoolOutlined fontSize="small" />, items: [{ text: "Students", to: "/students" }] },
  { section: "Examination", icon: <AssignmentOutlined fontSize="small" />, items: [{ text: "Marks Entry", to: "/emarks" }] },
  { section: "Results", icon: <WorkspacePremiumOutlined fontSize="small" />, items: [{ text: "Marksheet / Result", to: "/results" }] },
  {
    section: "Finance & Degree",
    icon: <PaymentsOutlined fontSize="small" />,
    items: [
      { text: "Fees Collection", to: "/fees" },
      { text: "Degree", to: "/degree" },
    ],
  },
  {
    section: "Support",
    icon: <SupportAgentOutlined fontSize="small" />,
    items: [
      { text: "Grievances", to: "/grievance" },
      { text: "Notice Board", to: "/notices" },
    ],
  },
];

const STUDENT_NAV: NavSection[] = [
  {
    section: "My Portal",
    icon: <DashboardOutlined fontSize="small" />,
    items: [
      { text: "Dashboard", to: "/" },
      { text: "My Profile", to: "/me/profile" },
      { text: "Exam Forms", to: "/me/exam-forms" },
      { text: "My Payments", to: "/me/payments" },
      { text: "My Result", to: "/me/result" },
    ],
  },
];

function SideNav({ sections }: { sections: NavSection[] }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const current = pathname + search;
  const [open, setOpen] = useState<Record<string, boolean>>(
    () => Object.fromEntries(sections.map((s) => [s.section, true])),
  );
  const isActive = (to: string) => (to.includes("?") ? current === to : pathname === to);

  return (
    <List dense sx={{ px: 1 }}>
      {sections.map((sec) => {
        const expanded = open[sec.section] ?? true;
        return (
          <Box key={sec.section} sx={{ mb: 0.5 }}>
            <ListItemButton onClick={() => setOpen((s) => ({ ...s, [sec.section]: !expanded }))}>
              <ListItemIcon sx={{ minWidth: 34, color: "text.secondary" }}>{sec.icon}</ListItemIcon>
              <ListItemText
                primary={sec.section}
                primaryTypographyProps={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, color: "text.secondary", textTransform: "uppercase" }}
              />
              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItemButton>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              {sec.items.map((it) => (
                <ListItemButton
                  key={it.to}
                  selected={isActive(it.to)}
                  onClick={() => navigate(it.to)}
                  sx={{
                    pl: 4.5,
                    position: "relative",
                    "&.Mui-selected::before": {
                      content: '""',
                      position: "absolute",
                      left: 8,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 3,
                      bgcolor: "primary.main",
                    },
                  }}
                >
                  <ListItemText primary={it.text} primaryTypographyProps={{ fontSize: 14 }} />
                </ListItemButton>
              ))}
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

export default function AppShell() {
  const { me, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = me?.auth === "Student" ? STUDENT_NAV : STAFF_NAV;
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const initials = (me?.username || "?").slice(0, 2).toUpperCase();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <WorkspacePremiumOutlined sx={{ color: "primary.main", mr: 1.5 }} />
          <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            {UNIVERSITY}
          </Typography>
          <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
            <IconButton color="inherit" onClick={toggle}>
              {mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14, fontWeight: 700 }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{me?.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                {me?.auth} portal
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Divider />
        <Box sx={{ overflowY: "auto", py: 1 }}>
          <SideNav sections={nav} />
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
        <Toolbar />
        <MotionPage key={pathname}>
          <Outlet />
        </MotionPage>
      </Box>
    </Box>
  );
}
