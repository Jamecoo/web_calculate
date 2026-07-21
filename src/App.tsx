import "./App.css";
import { Box, CircularProgress } from "@mui/material";
import AppDrawer from "./components/drawer";
import AppRouter from "./router";
import LoginPage from "./pages/login";
import useAuth from "./context/auth";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppDrawer>
      <AppRouter />
    </AppDrawer>
  );
}

export default App;
