import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  // Percent as PercentIcon,
  // Remove as RemoveIcon,
  Functions as FunctionsIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { MainControllerProvider } from "./context/MainControllerProvider";
import { UserSplitCalculator } from "./components/UserSplitCalculator";
import useMainControllerContext from "./context";
import { formatLaoKipWithCurrency } from "../../utils/formatLaoKip";

// Format number with commas for display
const formatMoneyInput = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted string back to number string
const parseMoneyInput = (value: string): string => {
  return value.replace(/,/g, "");
};

export const Content = () => {
  const {
    totalAmount,
    userAmount,
    calculationType,
    result,
    loading,
    error,
    users,
    handleTotalAmountChange,
    handleUserAmountChange,
    handleCalculationTypeChange,
    saveSplitToFirebase,
    saveToHistory,
    clearCalculation,
    getFormulaDescription,
  } = useMainControllerContext();

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 4 }}>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            ປະເພດການຄິດໄລ່
          </Typography>

          <ToggleButtonGroup
            value={calculationType}
            exclusive
            onChange={(_, value) => value && handleCalculationTypeChange(value)}
            fullWidth
            sx={{ mb: 4 }}
          >
            <ToggleButton value="divide">
              <FunctionsIcon sx={{ mr: 1 }} />
              ຫານ
            </ToggleButton>
            {/* <ToggleButton value="percentage">
              <PercentIcon sx={{ mr: 1 }} />
              ເປີເຊັນ
            </ToggleButton>
            <ToggleButton value="subtract">
              <RemoveIcon sx={{ mr: 1 }} />
              Subtract
            </ToggleButton> */}
            <ToggleButton value="split_users">
              <PeopleIcon sx={{ mr: 1 }} />
              ຫານກັບໝູ່
            </ToggleButton>
          </ToggleButtonGroup>

          {calculationType === "split_users" ? (
            <UserSplitCalculator />
          ) : (
            <>
              <Stack spacing={3}>
                <TextField
                  label="ຈຳນວນເງິນທັງໝົດ"
                  value={formatMoneyInput(totalAmount)}
                  onChange={(e) =>
                    handleTotalAmountChange(parseMoneyInput(e.target.value))
                  }
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>ກີບ</Typography>,
                  }}
                  inputProps={{ inputMode: "numeric" }}
                  helperText="ປ້ອນຈຳນວນເງິນທັງໝົດ"
                />

                <TextField
                  label="ຈຳນວນຄົນທັງໝົດ"
                  value={userAmount}
                  onChange={(e) =>
                    handleUserAmountChange(e.target.value.replace(/\D/g, ""))
                  }
                  fullWidth
                  variant="outlined"
                  inputProps={{ inputMode: "numeric" }}
                  helperText="ປ້ອນຈຳນວນຄົນທັງໝົດ"
                />
              </Stack>

              {result && (
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    mt: 3,
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <CalculateIcon sx={{ mr: 1 }} />
                    ຜົນການຄິດໄລ່
                  </Typography>
                  <Divider
                    sx={{
                      mb: 2,
                      bgcolor: "primary.contrastText",
                      opacity: 0.3,
                    }}
                  />

                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1">ສູດ:</Typography>
                      <Chip
                        label={getFormulaDescription()}
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1">ຜົນການຄິດໄລ່:</Typography>
                      <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                        {calculationType === "percentage"
                          ? `${result.result.toFixed(2)}%`
                          : formatLaoKipWithCurrency(result.result)}
                      </Typography>
                    </Box>

                    <Divider
                      sx={{ bgcolor: "primary.contrastText", opacity: 0.3 }}
                    />

                    {/* <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">ເປີເຊັນ:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {result.percentage.toFixed(2)}%
                      </Typography>
                    </Box> */}

                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">ຍັງເຫຼືອ:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {formatLaoKipWithCurrency(result.remaining)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Save and Clear buttons - inside card */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="end"
            sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}
          >
            {calculationType === "split_users" ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={saveSplitToFirebase}
                disabled={users.length === 0 || loading}
                size="large"
              >
                ບັນທຶກການຫານກັບໝູ່
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={saveToHistory}
                disabled={!result || loading}
                size="large"
              >
                ບັນທຶກການຄິດໄລ່
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={clearCalculation}
              size="large"
            >
              ລ້າງ
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export const HomePage = () => {
  return (
    <MainControllerProvider>
      <Content />
    </MainControllerProvider>
  );
};
