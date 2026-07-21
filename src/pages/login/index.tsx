import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
} from "../../services/auth.services";
import { JINDA_LOGO } from "../../contants/logo";

type Mode = "login" | "register";

const friendlyError = (code?: string): string => {
  switch (code) {
    case "auth/invalid-email":
      return "ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ";
    case "auth/email-already-in-use":
      return "ອີເມວນີ້ຖືກໃຊ້ແລ້ວ";
    case "auth/weak-password":
      return "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ";
    case "auth/popup-closed-by-user":
      return "ຍົກເລີກການເຂົ້າສູ່ລະບົບ";
    default:
      return "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່";
  }
};

export const LoginPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "ແຈ້ງເຕືອນ",
        text: "ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ",
        confirmButtonText: "ຕົກລົງ",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      // onAuthStateChanged in AuthProvider will flip the app into the authed view.
    } catch (err) {
      const code = (err as { code?: string })?.code;
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: friendlyError(code),
        confirmButtonText: "ຕົກລົງ",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: friendlyError(code),
        confirmButtonText: "ຕົກລົງ",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: isDark
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
          : "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #ecfeff 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.4)"
            : "0 20px 60px rgba(79,70,229,0.12)",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Box
            component="img"
            src={JINDA_LOGO}
            alt="logo"
            sx={{
              height: 72,
              maxWidth: "80%",
              objectFit: "contain",
              mb: 1,
            }}
          />
          <Typography variant="h5" fontWeight={700}>
            {mode === "login" ? "ເຂົ້າສູ່ລະບົບ" : "ສ້າງບັນຊີໃໝ່"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SPLITZY · Fun, catchy, easy to remember
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="ອີເມວ"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="ລະຫັດຜ່ານ"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {mode === "login" ? "ເຂົ້າສູ່ລະບົບ" : "ລົງທະບຽນ"}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }}>ຫຼື</Divider>

        <Button
          onClick={handleGoogle}
          variant="outlined"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={<GoogleIcon />}
        >
          ເຂົ້າສູ່ລະບົບດ້ວຍ Google
        </Button>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="body2" color="text.secondary" component="span">
            {mode === "login" ? "ຍັງບໍ່ມີບັນຊີ? " : "ມີບັນຊີແລ້ວ? "}
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "ສ້າງບັນຊີ" : "ເຂົ້າສູ່ລະບົບ"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
