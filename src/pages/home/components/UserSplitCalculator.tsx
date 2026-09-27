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
  Stepper,
  Step,
  StepLabel,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as MoneyIcon,
  Add as AddIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BookmarkAdd as BookmarkAddIcon,
  Bookmarks as BookmarksIcon,
} from "@mui/icons-material";
import { useState } from "react";
import Swal from "sweetalert2";
import useMainControllerContext from "../context";
import { formatLaoKip, formatLaoKipWithCurrency } from "../../../utils/formatLaoKip";
import {
  EXPENSE_CATEGORIES,
  DEFAULT_CATEGORY_ID,
  getCategory,
} from "../../../constants/categories";
import type { SavedGroup } from "../../../model/calculateModel";

const AVATAR_COLORS = [
  "#1976d2",
  "#9c27b0",
  "#2e7d32",
  "#ed6c02",
  "#0288d1",
  "#c2185b",
  "#5e35b1",
  "#00897b",
];

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const STEP_LABELS = ["ຕັ້ງຄ່າ", "ລາຍຈ່າຍ"];

// Format number with commas for display
const formatMoneyInput = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");
  // Format with commas
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted string back to number
const parseMoneyInput = (value: string): number => {
  return parseFloat(value.replace(/,/g, "")) || 0;
};

export const UserSplitCalculator = () => {
  const {
    tripName,
    totalUsers,
    userNames,
    users,
    step,
    handleTripNameChange,
    handleTotalUsersChange,
    handleUserNameChange,
    proceedToExpenses,
    backToSetup,
    addPurchase,
    editPurchase,
    deletePurchase,
    calculateSettlements,
    savedGroups,
    applySavedGroup,
    saveCurrentGroup,
    removeSavedGroup,
  } = useMainControllerContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [payerIndex, setPayerIndex] = useState<number | "">("");
  const [itemName, setItemName] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  // userIds of people who shared this item (default: everyone)
  const [consumerIds, setConsumerIds] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY_ID);
  // Edit mode state
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);

  const allUserIds = users.map((u) => u.userId);

  const handleOpenDialog = (presetIndex?: number) => {
    setPayerIndex(presetIndex ?? "");
    setConsumerIds(allUserIds); // default: everyone shares
    setCategory(DEFAULT_CATEGORY_ID);
    setEditingPurchaseId(null); // new purchase mode
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (userIndex: number, purchase: { id: string; itemName: string; amount: number; consumers?: string[]; category?: string }) => {
    setPayerIndex(userIndex);
    setItemName(purchase.itemName);
    setPurchaseAmount(formatMoneyInput(String(purchase.amount)));
    setConsumerIds(purchase.consumers && purchase.consumers.length > 0 ? purchase.consumers : allUserIds);
    setCategory(purchase.category || DEFAULT_CATEGORY_ID);
    setEditingPurchaseId(purchase.id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPayerIndex("");
    setItemName("");
    setPurchaseAmount("");
    setConsumerIds([]);
    setCategory(DEFAULT_CATEGORY_ID);
    setEditingPurchaseId(null);
  };

  const toggleConsumer = (userId: string) => {
    setConsumerIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const allConsumersSelected =
    users.length > 0 && consumerIds.length === users.length;

  const toggleAllConsumers = () => {
    setConsumerIds(allConsumersSelected ? [] : allUserIds);
  };

  const handleAddPurchase = () => {
    const amount = parseMoneyInput(purchaseAmount);
    if (
      payerIndex !== "" &&
      itemName &&
      amount > 0 &&
      consumerIds.length > 0
    ) {
      if (editingPurchaseId) {
        // Edit mode
        editPurchase(payerIndex as number, editingPurchaseId, itemName, amount, consumerIds, category);
      } else {
        // Add mode
        addPurchase(payerIndex, itemName, amount, consumerIds, category);
      }
      handleCloseDialog();
    }
  };

  const handleDeletePurchase = (userIndex: number, purchaseId: string) => {
    deletePurchase(userIndex, purchaseId);
  };

  const consumerNames = (ids?: string[]): string => {
    const list = ids && ids.length > 0 ? ids : allUserIds;
    if (list.length === users.length) return "ທຸກຄົນ";
    return users
      .filter((u) => list.includes(u.userId))
      .map((u) => u.userName)
      .join(", ");
  };

  const handleBackToSetup = () => {
    const hasExpenses = users.some((u) => u.purchases.length > 0);
    if (!hasExpenses) {
      backToSetup();
      return;
    }

    Swal.fire({
      icon: "warning",
      title: "ຢືນຢັນ",
      text: "ຂໍ້ມູນລາຍຈ່າຍທັງໝົດຈະຫາຍໄປ ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການກັບຄືນ?",
      showCancelButton: true,
      confirmButtonText: "ແມ່ນ, ກັບຄືນ",
      cancelButtonText: "ຍົກເລີກ",
    }).then((res) => {
      if (res.isConfirmed) backToSetup();
    });
  };

  const activeStep = step === "setup" ? 0 : 1;
  const stepper = (
    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
      {STEP_LABELS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );

  // Setup Step - Trip name, people count and names
  if (step === "setup") {
    return (
      <Box>
        {stepper}
        <Stack spacing={3}>
          <TextField
            label="ຊື່ລາຍການ (ບໍ່ບັງຄັບ)"
            value={tripName}
            onChange={(e) => handleTripNameChange(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="ເຊັ່ນ: ທ່ຽວທະເລ, ລ້ຽງເພື່ອນ"
          />

          {savedGroups.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <BookmarksIcon fontSize="small" /> ກຸ່ມທີ່ບັນທຶກໄວ້
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  ກົດເພື່ອໃຊ້ລາຍຊື່ກຸ່ມນີ້ຄືນ
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {savedGroups.map((group: SavedGroup) => (
                    <Tooltip key={group.id} title={group.memberNames.join(", ")}>
                      <Chip
                        label={`${group.name} (${group.memberNames.length})`}
                        onClick={() => applySavedGroup(group)}
                        onDelete={() => removeSavedGroup(group)}
                        color="primary"
                        variant="outlined"
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

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
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                  <Button
                    size="small"
                    startIcon={<BookmarkAddIcon />}
                    onClick={saveCurrentGroup}
                    disabled={userNames.filter((n) => n.trim()).length < 2}
                  >
                    ບັນທຶກເປັນກຸ່ມ
                  </Button>
                </Box>
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
              onClick={proceedToExpenses}
              fullWidth
            >
              ຕໍ່ໄປ
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  // Expenses Step - log expenses, computed totals/balances update live
  const settlements = calculateSettlements();
  const hasSettlements = settlements.length > 0;
  const computedTotal = users.reduce(
    (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
    0
  );
  const perUserShare = users.length > 0 ? computedTotal / users.length : 0;
  const hasExpenses = computedTotal > 0;

  return (
    <Box>
      {stepper}

      {/* Summary header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          color: "white",
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ opacity: 0.85 }}>
              ລາຍການແບ່ງເງິນ
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ wordBreak: "break-word" }}
            >
              {tripName?.trim() || "ການແບ່ງເງິນ"}
            </Typography>
          </Box>
          <IconButton onClick={handleBackToSetup} sx={{ color: "white", flexShrink: 0 }}>
            <ArrowBackIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.3)", my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              👥 ຈຳນວນຄົນ
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {users.length} ຄົນ
            </Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              💰 ລວມລາຍຈ່າຍ
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatLaoKip(computedTotal)} ກີບ
            </Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              💵 ສະເລ່ຍ/ຄົນ
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatLaoKip(perUserShare)} ກີບ
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        fullWidth
        sx={{ mb: 3 }}
      >
        ເພີ່ມລາຍຈ່າຍ
      </Button>

      {!hasExpenses ? (
        <Paper
          variant="outlined"
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 4,
            borderStyle: "dashed",
          }}
        >
          <GroupsIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            ຍັງບໍ່ມີລາຍຈ່າຍ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ເລີ່ມເພີ່ມລາຍຈ່າຍຂອງແຕ່ລະຄົນ ລະບົບຈະຄິດໄລ່ສ່ວນແບ່ງໃຫ້ອັດຕະໂນມັດ
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            ເພີ່ມລາຍຈ່າຍທຳອິດ
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {users.map((user, index) => {
              const paid = user.paid ?? 0;
              const consumed = user.consumed ?? 0;
              const shouldReceive = user.currentBalance < 0;
              const shouldPay = user.currentBalance > 0;
              const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={user.userId}>
                  <Card
                    elevation={2}
                    sx={{
                      borderRadius: 3,
                      border: shouldReceive ? "2px solid" : "1px solid",
                      borderColor: shouldReceive
                        ? "success.main"
                        : "divider",
                      bgcolor: shouldReceive
                        ? "success.light"
                        : "background.paper",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            minWidth: 0,
                          }}
                        >
                          <Avatar sx={{ bgcolor: avatarColor }}>
                            {getInitial(user.userName)}
                          </Avatar>
                          <Typography
                            variant="h6"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {user.userName}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(index)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>

                      {shouldReceive && (
                        <Chip
                          icon={<TrendingUpIcon />}
                          label="ຄວນໄດ້ຮັບເງິນຄືນ"
                          color="success"
                          size="small"
                          variant="filled"
                          sx={{ mb: 1, fontWeight: "bold" }}
                        />
                      )}
                      {shouldPay && (
                        <Chip
                          icon={<TrendingDownIcon />}
                          label="ຕ້ອງຈ່າຍ"
                          color="warning"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      )}
                      {!shouldReceive && !shouldPay && (
                        <Chip label="ເສຍສົມດູນ" color="default" size="small" sx={{ mb: 1 }} />
                      )}

                      <Divider sx={{ my: 1 }} />

                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color={shouldReceive ? "text.primary" : "text.secondary"}>
                            ຈ່າຍໄປ:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatLaoKip(paid)} ກີບ
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color={shouldReceive ? "text.primary" : "text.secondary"}>
                            ຮັບຜິດຊອບ:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" color={shouldReceive ? "error.dark" : "error"}>
                            {formatLaoKip(consumed)} ກີບ
                          </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body1" fontWeight="bold">
                            {shouldReceive
                              ? "ຄວນໄດ້ຮັບຄືນ:"
                              : shouldPay
                              ? "ຍັງຕ້ອງຈ່າຍ:"
                              : "ສະຖານະ:"}
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color={
                              shouldReceive
                                ? "success.dark"
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
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                          >
                            <ReceiptIcon fontSize="small" />
                            ລາຍຈ່າຍ ({user.purchases.length}):
                          </Typography>
                          <Paper
                            variant="outlined"
                            sx={{ p: 1, maxHeight: 200, overflow: "auto" }}
                          >
                            {user.purchases.map((purchase) => (
                              <Box key={purchase.id} sx={{ py: 0.5, "&:not(:last-child)": { borderBottom: "1px solid", borderColor: "divider", pb: 1, mb: 1 } }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography variant="body2" sx={{ flex: 1 }}>
                                    {purchase.itemName}
                                  </Typography>
                                  <Typography variant="body2" color="error" sx={{ mr: 1 }}>
                                    -{formatLaoKip(purchase.amount)} ກີບ
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleOpenEditDialog(index, purchase)}
                                      sx={{ p: 0.5 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeletePurchase(index, purchase.id)}
                                      sx={{ p: 0.5 }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Chip
                                    size="small"
                                    label={`${getCategory(purchase.category).emoji} ${getCategory(purchase.category).label}`}
                                    sx={{
                                      height: 20,
                                      fontSize: "0.7rem",
                                      bgcolor: `${getCategory(purchase.category).color}22`,
                                      color: getCategory(purchase.category).color,
                                    }}
                                  />
                                  <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ຮ່ວມ: {consumerNames(purchase.consumers)}
                                </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Paper>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Settlement Summary */}
          <Card elevation={3} sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", mb: 3 }}
              >
                <MoneyIcon sx={{ mr: 1 }} />
                ສະຫຼຸບການຊຳລະເງິນ
              </Typography>

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
                          borderRadius: 2,
                          "& .MuiAlert-message": { width: "100%" },
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
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="body1">
                    ✅ ທຸກຄົນເສຍສົມດູນແລ້ວ! ບໍ່ຈຳເປັນຕ້ອງໂອນເງິນ
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Expense Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingPurchaseId ? "ແກ້ໄຂລາຍຈ່າຍ" : "ເພີ່ມລາຍຈ່າຍ"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="payer-select-label">ຈ່າຍໂດຍ</InputLabel>
              <Select
                labelId="payer-select-label"
                label="ຈ່າຍໂດຍ"
                value={payerIndex}
                onChange={(e) => setPayerIndex(e.target.value as number)}
              >
                {users.map((user, index) => (
                  <MenuItem key={user.userId} value={index}>
                    {user.userName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {payerIndex !== "" && (
              <Typography variant="body2" fontWeight="bold">
                ຍອດຄົງເຫຼືອຕອນນີ້ຂອງ {users[payerIndex]?.userName}:{" "}
                {formatLaoKip(users[payerIndex]?.currentBalance)} ກີບ
              </Typography>
            )}

            <TextField
              label="ຊື່ລາຍຈ່າຍ"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              autoFocus
              placeholder="ເຊັ່ນ: ກາເຟ, ອາຫານທ່ຽງ, ນ້ຳມັນ"
            />

            <FormControl component="fieldset" variant="standard">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                ປະເພດລາຍຈ່າຍ
              </FormLabel>
              <ToggleButtonGroup
                value={category}
                exclusive
                onChange={(_, value) => value && setCategory(value)}
                size="small"
                sx={{
                  flexWrap: "wrap",
                  gap: 0.5,
                  "& .MuiToggleButton-root": {
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  },
                }}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <ToggleButton key={c.id} value={c.id} sx={{ px: 1.5 }}>
                    <span style={{ marginRight: 4 }}>{c.emoji}</span>
                    {c.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </FormControl>

            <TextField
              label="ຈຳນວນເງິນ"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(formatMoneyInput(e.target.value))}
              fullWidth
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>ກີບ</Typography>,
              }}
              helperText="ຈະຖືກແບ່ງສະເພາະຄົນທີ່ຮ່ວມໃຊ້ດ້ານລຸ່ມນີ້"
              inputProps={{ inputMode: "numeric" }}
            />

            <FormControl component="fieldset" variant="standard">
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <FormLabel component="legend">ໃຜຮ່ວມໃຊ້/ກິນ ລາຍການນີ້?</FormLabel>
                <Button size="small" onClick={toggleAllConsumers}>
                  {allConsumersSelected ? "ລ້າງທັງໝົດ" : "ເລືອກທັງໝົດ"}
                </Button>
              </Box>
              <FormGroup>
                {users.map((user) => (
                  <FormControlLabel
                    key={user.userId}
                    control={
                      <Checkbox
                        checked={consumerIds.includes(user.userId)}
                        onChange={() => toggleConsumer(user.userId)}
                      />
                    }
                    label={user.userName}
                  />
                ))}
              </FormGroup>
              {consumerIds.length > 0 && purchaseAmount && (
                <Typography variant="caption" color="text.secondary">
                  ຄົນລະ{" "}
                  {formatLaoKip(
                    parseMoneyInput(purchaseAmount) / consumerIds.length
                  )}{" "}
                  ກີບ ({consumerIds.length} ຄົນ)
                </Typography>
              )}
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ຍົກເລີກ</Button>
          <Button
            onClick={handleAddPurchase}
            variant="contained"
            disabled={
              payerIndex === "" ||
              !itemName ||
              !purchaseAmount ||
              consumerIds.length === 0
            }
          >
            {editingPurchaseId ? "ບັນທຶກ" : "ເພີ່ມລາຍຈ່າຍ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
