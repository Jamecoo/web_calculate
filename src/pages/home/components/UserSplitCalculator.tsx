import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as MoneyIcon,
} from "@mui/icons-material";
import { useState } from "react";
import useMainControllerContext from "../context";
import { formatLaoKip, formatLaoKipWithCurrency } from "../../../utils/formatLaoKip";

export const UserSplitCalculator = () => {
  const {
    totalAmount,
    totalUsers,
    userNames,
    users,
    step,
    handleTotalAmountChange,
    handleTotalUsersChange,
    handleUserNameChange,
    startCalculation,
    backToSetup,
    addPurchase,
    calculateSettlements,
  } = useMainControllerContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(0);
  const [itemName, setItemName] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  const handleOpenDialog = (userIndex: number) => {
    setSelectedUserIndex(userIndex);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setItemName("");
    setPurchaseAmount("");
  };

  const handleAddPurchase = () => {
    const amount = parseFloat(purchaseAmount);
    if (itemName && !isNaN(amount) && amount > 0) {
      addPurchase(selectedUserIndex, itemName, amount);
      handleCloseDialog();
    }
  };

  // Setup Step - Add names first
  if (step === "setup") {
    return (
      <Box>
        <Stack spacing={3}>
          <TextField
            label="ຈຳນວນເງິນທັງໝົດ"
            type="number"
            value={totalAmount}
            onChange={(e) => handleTotalAmountChange(e.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>ກີບ</Typography>,
            }}
            helperText="ປ້ອນຈຳນວນເງິນທັງໝົດ"
          />

          <TextField
            label="ຈຳນວນຄົນທັງໝົດ"
            type="number"
            value={totalUsers}
            onChange={(e) => handleTotalUsersChange(e.target.value)}
            fullWidth
            variant="outlined"
            helperText="ປ້ອນຈຳນວນຄົນທັງໝົດ"
          />

          {userNames.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ປ້ອນຊື່ຜູ້ໃຊ້
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {userNames.map((name, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <TextField
                        label={`ຜູ້ໃຊ້ ${index + 1}`}
                        value={name}
                        onChange={(e) =>
                          handleUserNameChange(index, e.target.value)
                        }
                        fullWidth
                        placeholder={`ປ້ອນຊື່ ${index + 1}`}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {userNames.length > 0 && (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={startCalculation}
              fullWidth
            >
              ເລີ່ມຄຳນວນ
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  // Calculate settlements for display
  const settlements = calculateSettlements();
  const hasSettlements = settlements.length > 0;

  // Calculate Step - Show user cards with balances
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={backToSetup}
        >
          ກັບຄືນ
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">
            ຈຳນວນເງິນທັງໝົດ: {formatLaoKip(parseFloat(totalAmount))} ກີບ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ຈຳນວນເງິນຕໍ່ຄົນ: {formatLaoKip(users[0]?.initialShare)} ກີບ
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2}>
        {users.map((user, index) => {
          const totalSpent = user.initialShare - user.currentBalance;
          const shouldReceive = user.currentBalance < 0;
          const shouldPay = user.currentBalance > 0;

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={user.userId}>
              <Card
                elevation={2}
                sx={{
                  border: shouldReceive ? "2px solid" : "none",
                  borderColor: shouldReceive ? "success.main" : "transparent",
                  bgcolor: shouldReceive ? "success.light" : "background.paper",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">{user.userName}</Typography>
                    {shouldReceive && (
                      <Chip label="ຄວນໄດ້ຮັບເງິນຄືນ" color="success" size="small" />
                    )}
                    {shouldPay && (
                      <Chip label="ຕ້ອງຈ່າຍ" color="warning" size="small" />
                    )}
                    {!shouldReceive && !shouldPay && (
                      <Chip label="ເສຍສົມດູນ" color="default" size="small" />
                    )}
                  </Box>
                  <Divider sx={{ my: 1 }} />

                  <Stack spacing={1}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ສ່ວນແບ່ງ:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatLaoKip(user.initialShare)} ກີບ
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ຊື້ເຄື່ອງໄປ:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color="error"
                      >
                        {formatLaoKip(totalSpent)} ກີບ
                      </Typography>
                    </Box>

                    <Divider />

                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" fontWeight="bold">
                        {shouldReceive ? "ຄວນໄດ້ຮັບຄືນ:" : shouldPay ? "ຍັງຕ້ອງຈ່າຍ:" : "ສະຖານະ:"}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={
                          shouldReceive
                            ? "success.main"
                            : shouldPay
                            ? "warning.main"
                            : "text.primary"
                        }
                      >
                        {shouldReceive
                          ? formatLaoKip(Math.abs(user.currentBalance))
                          : formatLaoKip(user.currentBalance)}{" "}
                        ກີບ
                      </Typography>
                    </Box>
                  </Stack>

                  {user.purchases.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        ລາຍການຊື້ ({user.purchases.length}):
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1, maxHeight: 150, overflow: "auto" }}
                      >
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
                              -{formatLaoKip(purchase.amount)} ກີບ
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    </>
                  )}

                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    startIcon={<ShoppingCartIcon />}
                    onClick={() => handleOpenDialog(index)}
                    sx={{ mt: 2 }}
                  >
                    ເພີ່ມລາຍການຊື້
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Settlement Summary */}
      <Card elevation={3} sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", mb: 3 }}
          >
            <MoneyIcon sx={{ mr: 1 }} />
            ສະຫຼຸບການຊຳລະເງິນ
          </Typography>

          {/* Show settlements */}
          {hasSettlements ? (
            <>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                ການໂອນເງິນທີ່ຕ້ອງເຮັດ:
              </Typography>
              <Stack spacing={2}>
                {settlements.map((settlement, index) => (
                  <Alert
                    key={index}
                    severity="info"
                    icon={<ArrowForwardIcon />}
                    sx={{
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Box>
                        <Typography variant="body1">
                          <strong>{settlement.from}</strong> ຕ້ອງຈ່າຍເງິນໃຫ້{" "}
                          <strong>{settlement.to}</strong>
                        </Typography>
                      </Box>
                      <Chip
                        label={formatLaoKipWithCurrency(settlement.amount)}
                        color="primary"
                        sx={{ fontWeight: "bold" }}
                      />
                    </Stack>
                  </Alert>
                ))}
              </Stack>
            </>
          ) : (
            <Alert severity="success">
              <Typography variant="body1">
                ✅ ທຸກຄົນເສຍສົມດູນແລ້ວ! ບໍ່ຈຳເປັນຕ້ອງໂອນເງິນ
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add Purchase Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ເພີ່ມລາຍການຊື້ສຳລັບ {users[selectedUserIndex]?.userName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ສ່ວນແບ່ງທີ່ຕ້ອງຈ່າຍ: {formatLaoKip(users[selectedUserIndex]?.initialShare)} ກີບ
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              ຍອດຄົງເຫຼືອຕອນນີ້: {formatLaoKip(users[selectedUserIndex]?.currentBalance)} ກີບ
            </Typography>

            <TextField
              label="ຊື່ສິນຄ້າ"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              autoFocus
              placeholder="ເຊັ່ນ: ກາເຟ, ອາຫານທ່ຽງ, ນ້ຳມັນ"
            />

            <TextField
              label="ຈຳນວນເງິນ"
              type="number"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>ກີບ</Typography>,
              }}
              helperText="ສາມາດຊື້ເກີນສ່ວນແບ່ງໄດ້ (ຈະໄດ້ຮັບເງິນຄືນຈາກຄົນອື່ນ)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ຍົກເລີກ</Button>
          <Button
            onClick={handleAddPurchase}
            variant="contained"
            disabled={!itemName || !purchaseAmount}
          >
            ເພີ່ມລາຍການຊື້
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};