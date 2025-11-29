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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Calculate as CalculateIcon,
  // Person as PersonIcon,
  Assessment as ReportIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { HOME_PATH, REPORT_PATH } from "../router/path";
import { JINDA_LOGO } from "../contants/logo";

const drawerWidth = 240;

interface NavItem {
  text: string;
  path: string;
  icon: JSX.Element;
}

const navItems: NavItem[] = [
  { text: "ຄິດໄລ່", path: HOME_PATH, icon: <CalculateIcon /> },
  //   { text: "User", path: USER_PATH, icon: <PersonIcon /> },
    { text: "ລາຍງານ", path: REPORT_PATH, icon: <ReportIcon /> },
];

interface AppDrawerProps {
  children: React.ReactNode;
}

const AppDrawer = ({ children }: AppDrawerProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box>
      <Toolbar>
        <Box
          // onClick={() => setMobileOpen(false)}
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            p: 2,
          }}
        >
          <Avatar
            sx={{ width: "60%", height: "60%" }}
            src={JINDA_LOGO}
            alt="Jinda Cafe"
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "#21a317ff",
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
