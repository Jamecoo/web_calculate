import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Paper,
  Divider,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Avatar,
  LinearProgress,
  Alert,
  Grid,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  DateRange as WeekIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { formatLaoKipWithCurrency } from "../../../utils/formatLaoKip";
import useMainControllerContext from "../context";
import type { CategoryCost } from "../controllers";

export const CostReportContent = () => {
  const {
    loading,
    reportType,
    setReportType,
    periodOffset,
    periodLabel,
    dateRangeLabel,
    costSummary,
    goToPreviousPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
  } = useMainControllerContext();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const maxConsumed = Math.max(
    ...costSummary.userCosts.map((u: any) => u.totalConsumed),
    1
  );

  const categoryTotal = costSummary.categoryCosts.reduce(
    (sum: number, c: CategoryCost) => sum + c.total,
    0
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        ລາຍງານຄ່າໃຊ້ຈ່າຍ
      </Typography>

      {/* Report Type Toggle */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <ToggleButtonGroup
              value={reportType}
              exclusive
              onChange={(_, value) => value && setReportType(value)}
              size="small"
            >
              <ToggleButton value="week">
                <WeekIcon sx={{ mr: 1 }} />
                ລາຍອາທິດ
              </ToggleButton>
              <ToggleButton value="month">
                <CalendarIcon sx={{ mr: 1 }} />
                ລາຍເດືອນ
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Period Navigation */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton onClick={goToPreviousPeriod} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Box sx={{ textAlign: "center", minWidth: 200 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {periodLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dateRangeLabel}
              </Typography>
            </Box>
            <IconButton
              onClick={goToNextPeriod}
              size="small"
              disabled={periodOffset === 0}
            >
              <ChevronRightIcon />
            </IconButton>
            {periodOffset > 0 && (
              <IconButton
                onClick={goToCurrentPeriod}
                size="small"
                color="primary"
              >
                <TodayIcon />
              </IconButton>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Card 
            sx={{ 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    ຄ່າໃຊ້ຈ່າຍທັງໝົດ
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatLaoKipWithCurrency(costSummary.totalAmount)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Avatar sx={{ bgcolor: "info.main", mx: "auto", mb: 1 }}>
                <ReceiptIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                ຈຳນວນທຣິບ
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {costSummary.tripCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Avatar sx={{ bgcolor: "success.main", mx: "auto", mb: 1 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                ຈຳນວນຄົນ
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {costSummary.userCosts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Breakdown */}
      {costSummary.categoryCosts.length > 0 && (
        <>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            ຮູປແບບຄ່າໃຊ້ຈ່າຍ
          </Typography>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                {costSummary.categoryCosts.map((cat: CategoryCost) => {
                  const share = categoryTotal
                    ? (cat.total / categoryTotal) * 100
                    : 0;
                  return (
                    <Box key={cat.id}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {cat.emoji} {cat.label}
                        </Typography>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            component="span"
                          >
                            {formatLaoKipWithCurrency(cat.total)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {share.toFixed(0)}% · {cat.count}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={share}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: cat.color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      {/* User Cost Breakdown */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
        📊 ລາຍລະອຽດແຕ່ລະຄົນ
      </Typography>

      {costSummary.userCosts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          ບໍ່ມີຂໍ້ມູນຄ່າໃຊ້ຈ່າຍໃນໄລຍະເວລານີ້
        </Alert>
      ) : (
        <Stack spacing={2}>
          {costSummary.userCosts.map((userCost: any, index: any) => (
            <Card 
              key={userCost.userName} 
              variant="outlined"
              sx={{
                borderLeft: 4,
                borderLeftColor: index === 0 ? "warning.main" : index === 1 ? "grey.400" : index === 2 ? "orange" : "primary.main",
              }}
            >
              <CardContent sx={{ pb: "16px !important" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor:
                          index === 0
                            ? "warning.main"
                            : index === 1
                            ? "grey.400"
                            : index === 2
                            ? "orange"
                            : "primary.main",
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {userCost.userName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {userCost.tripCount} ທຣິບ
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatLaoKipWithCurrency(userCost.totalConsumed)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ຮັບຜິດຊອບ
                    </Typography>
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(userCost.totalConsumed / maxConsumed) * 100}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    mb: 1.5,
                    bgcolor: "grey.200",
                  }}
                />

                <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ອອກເງິນໄປ
                    </Typography>
                    <Typography variant="body1" fontWeight="600" color="success.main">
                      {formatLaoKipWithCurrency(userCost.totalPaid)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ສ່ວນຕ່າງ
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="600"
                      color={
                        userCost.totalPaid - userCost.totalConsumed >= 0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {userCost.totalPaid - userCost.totalConsumed >= 0 ? "+" : ""}
                      {formatLaoKipWithCurrency(
                        userCost.totalPaid - userCost.totalConsumed
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
