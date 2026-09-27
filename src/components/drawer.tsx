import { useState, type JSX } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Toolbar,
  AppBar,
  Avatar,
  Typography,
  Chip,
  Button,
  Stack,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Calculate as CalculateIcon,
  Person as PersonIcon,
  Assessment as ReportIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandLess,
  ExpandMore,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  AccountBalanceWallet as WalletIcon,
  NoteAdd,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  HOME_PATH,
  REPORT_PATH,
  COST_REPORT_PATH,
  BALANCES_PATH,
  PROFILE_PATH,
  REALTIME_NOTE,
} from "../router/path";
import { JINDA_LOGO } from "../contants/logo";
import useAuth from "../context/auth";
import { logout } from "../services/auth.services";
import { useThemeContext } from "../context/ThemeContext";

const drawerWidth = 240;

interface NavItem {
  text: string;
  path?: string;
  icon: JSX.Element;
  subItems?: { text: string; path: string; icon: JSX.Element }[];
}

const navItems: NavItem[] = [
  { text: "ຄິດໄລ່", path: HOME_PATH, icon: <CalculateIcon /> },
  {
    text: "ລາຍງານ",
    icon: <ReportIcon />,
    subItems: [
      { text: "ປະຫວັດທຣິບ", path: REPORT_PATH, icon: <HistoryIcon /> },
      {
        text: "ລາຍງານຄ່າໃຊ້ຈ່າຍ",
        path: COST_REPORT_PATH,
        icon: <BarChartIcon />,
      },
      { text: "ຍອດລວມທຸກທຣິບ", path: BALANCES_PATH, icon: <WalletIcon /> },
    ],
  },
  { text: "ໂປຣໄຟລ໌", path: PROFILE_PATH, icon: <PersonIcon /> },
  { text: "ຕິດໜີ້", path: REALTIME_NOTE, icon: <NoteAdd /> },
];

interface AppDrawerProps {
  children: React.ReactNode;
}

const AppDrawer = ({ children }: AppDrawerProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { mode, toggleTheme } = useThemeContext();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleReportMenuToggle = () => {
    setReportMenuOpen(!reportMenuOpen);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "ອອກຈາກລະບົບ",
      text: "ທ່ານຕ້ອງການອອກຈາກລະບົບບໍ່?",
      showCancelButton: true,
      confirmButtonText: "ອອກຈາກລະບົບ",
      cancelButtonText: "ຍົກເລີກ",
    });
    if (result.isConfirmed) {
      await logout();
      navigate(HOME_PATH, { replace: true });
    }
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ height: "auto" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            p: 2,
          }}
        >
          <Box
            component="img"
            src={JINDA_LOGO}
            alt="logo"
            sx={{ maxWidth: "80%", height: 56, objectFit: "contain" }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => {
          // Item with subItems (expandable menu)
          if (item.subItems) {
            const isAnySubItemActive = item.subItems.some(
              (sub) => location.pathname === sub.path,
            );
            return (
              <Box key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleReportMenuToggle}
                    selected={isAnySubItemActive && !reportMenuOpen}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                    {reportMenuOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={reportMenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItem key={subItem.text} disablePadding>
                        <ListItemButton
                          component={Link}
                          to={subItem.path}
                          selected={location.pathname === subItem.path}
                          onClick={() => setMobileOpen(false)}
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon>{subItem.icon}</ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Regular item without subItems
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path!}
                selected={location.pathname === item.path}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            component={Link}
            to={PROFILE_PATH}
            onClick={() => setMobileOpen(false)}
            sx={{ textDecoration: "none", color: "inherit" }}
          >
            <Avatar
              src={user?.photoURL || undefined}
              sx={{ width: 36, height: 36, bgcolor: "primary.main" }}
            >
              {(user?.displayName || user?.email || "?")
                .charAt(0)
                .toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Tooltip title={user?.email || ""}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  noWrap
                  sx={{ maxWidth: 150 }}
                >
                  {user?.displayName || user?.email || "ຜູ້ໃຊ້"}
                </Typography>
              </Tooltip>
              <Chip
                size="small"
                color={isAdmin ? "secondary" : "default"}
                icon={isAdmin ? <AdminIcon /> : undefined}
                label={isAdmin ? "Admin" : "User"}
                sx={{ height: 20, mt: 0.5 }}
              />
            </Box>
          </Stack>
          <Button
            onClick={handleLogout}
            variant="outlined"
            color="inherit"
            size="small"
            fullWidth
            startIcon={<LogoutIcon />}
          >
            ອອກຈາກລະບົບ
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        color="primary"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, flexGrow: 1 }}>
            SPLITZY
          </Typography>
          <Tooltip title={mode === "dark" ? "ໂໝດແສງ" : "ໂໝດມືດ"}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AppDrawer;
