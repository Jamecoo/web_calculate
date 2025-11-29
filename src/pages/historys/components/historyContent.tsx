import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Grid,
  Paper,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { formatLaoKipWithCurrency } from "../../../utils/formatLaoKip";
import type { UserShare } from "../../../model/calculateModel";
import useMainControllerContext from "../context";

export const HistoryContent = () => {
  const {
    tabValue,
    setTabValue,
    detailDialog,
    selectedSplit,
    handleViewDetails,
    handleCloseDialog,
    handleTogglePayment,
    splitHistory,
    calculationHistory,
    loading,
    error,
    handleDeleteHistory,
  } = useMainControllerContext();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 4, textAlign: "center" }}
      >
        📊 ປະຫວັດການຄິດໄລ່
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab label={`ການແບ່ງຜູ້ໃຊ້ (${splitHistory.length})`} />
          <Tab label={`ການຄິດໄລ່ທົ່ວໄປ (${calculationHistory.length})`} />
        </Tabs>
      </Box>

      {/* Split Users Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {splitHistory.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  ຍັງບໍ່ມີປະຫວັດການແບ່ງຜູ້ໃຊ້
                </Typography>
              </Paper>
            </Grid>
          ) : (
            splitHistory.map((split) => {
              const paidUsers = split.users.filter(
                (u: UserShare & { isPaid?: boolean }) => u.isPaid
              ).length;
              const totalUsers = split.users.length;
              const allPaid = paidUsers === totalUsers;

              return (
                <Grid size={{ xs: 12, md: 6 }} key={split.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          {formatLaoKipWithCurrency(split.totalAmount)}
                        </Typography>
                        <Chip
                          label={
                            allPaid
                              ? "ຈ່າຍຄົບແລ້ວ"
                              : `${paidUsers}/${totalUsers} ຈ່າຍແລ້ວ`
                          }
                          color={allPaid ? "success" : "warning"}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Stack spacing={1}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ຈຳນວນຄົນ:
                          </Typography>
                          <Typography variant="body2">
                            {split.totalUsers} ຄົນ
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ຕໍ່ຄົນ:
                          </Typography>
                          <Typography variant="body2">
                            {formatLaoKipWithCurrency(split.perUserAmount)}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ວັນທີ່:
                          </Typography>
                          <Typography variant="body2">
                            {split.timestamp
                              ?.toDate()
                              .toLocaleDateString("lo-LA")}
                          </Typography>
                        </Box>
                      </Stack>

                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(split)}
                        sx={{ mt: 2 }}
                      >
                        ເບິ່ງລາຍລະອຽດ
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* Calculation History Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {calculationHistory.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  ຍັງບໍ່ມີປະຫວັດການຄິດໄລ່
                </Typography>
              </Paper>
            </Grid>
          ) : (
            calculationHistory.map((calc) => (
              <Grid size={{ xs: 12, md: 6 }} key={calc.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">
                        {calc.details?.type === "divide"
                          ? "ການຫານ"
                          : calc.details?.type}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDeleteHistory(calc.id, "calculation")
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={1}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          ສູດ:
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {calc.details?.formula}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          ຜົນລັບ:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="primary"
                        >
                          {formatLaoKipWithCurrency(calc.result)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          ວັນທີ່:
                        </Typography>
                        <Typography variant="body2">
                          {calc.timestamp?.toDate().toLocaleDateString("lo-LA")}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedSplit && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">ລາຍລະອຽດການແບ່ງເງິນ</Typography>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteHistory(selectedSplit.id, "split")}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        ຈຳນວນເງິນທັງໝົດ:
                      </Typography>
                      <Typography variant="h6">
                        {formatLaoKipWithCurrency(selectedSplit.totalAmount)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        ຕໍ່ຄົນ:
                      </Typography>
                      <Typography variant="h6">
                        {formatLaoKipWithCurrency(selectedSplit.perUserAmount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="subtitle1" fontWeight="bold">
                  ລາຍຊື່ຜູ້ໃຊ້ ({selectedSplit.users.length}):
                </Typography>

                {selectedSplit.users.map(
                  (user: UserShare & { isPaid?: boolean }) => (
                    <Card key={user.userId} variant="outlined">
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Typography variant="h6">{user.userName}</Typography>
                          <Chip
                            label={user.isPaid ? "ຈ່າຍແລ້ວ" : "ຍັງບໍ່ທັນຈ່າຍ"}
                            color={user.isPaid ? "success" : "default"}
                            size="small"
                          />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              ຍອດເລີ່ມຕົ້ນ:
                            </Typography>
                            <Typography variant="body2">
                              {formatLaoKipWithCurrency(user.initialShare)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              ຍອດຄົງເຫຼືອ:
                            </Typography>
                            <Typography
                              variant="body2"
                              color={
                                user.currentBalance > 0
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {formatLaoKipWithCurrency(user.currentBalance)}
                            </Typography>
                          </Box>

                          {user.purchases.length > 0 && (
                            <>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" fontWeight="bold">
                                ລາຍການຊື້ ({user.purchases.length}):
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                {user.purchases.map((purchase) => (
                                  <Box
                                    key={purchase.id}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      py: 0.5,
                                    }}
                                  >
                                    <Typography variant="body2">
                                      {purchase.itemName}
                                    </Typography>
                                    <Typography variant="body2" color="error">
                                      -
                                      {formatLaoKipWithCurrency(
                                        purchase.amount
                                      )}
                                    </Typography>
                                  </Box>
                                ))}
                              </Paper>
                            </>
                          )}
                        </Stack>

                        <Button
                          variant={user.isPaid ? "outlined" : "contained"}
                          color={user.isPaid ? "error" : "success"}
                          fullWidth
                          startIcon={
                            user.isPaid ? <CancelIcon /> : <CheckCircleIcon />
                          }
                          onClick={() =>
                            handleTogglePayment(
                              selectedSplit.id,
                              user.userId,
                              user.isPaid || false
                            )
                          }
                          sx={{ mt: 2 }}
                        >
                          {user.isPaid ? "ຍົກເລີກການຈ່າຍ" : "ຈ່າຍແລ້ວ"}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>ປິດ</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
