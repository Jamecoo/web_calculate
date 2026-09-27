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
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Avatar,
  Tooltip,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useState, useRef } from "react";
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as MoneyIcon,
  Share as ShareIcon,
  NotificationsActive as RemindIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  PersonOutline as PersonIcon,
  GroupAdd as GroupAddIcon,
  Add as AddIcon,
  QrCode as QrCodeIcon,
  ContentCopy as CopyIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
} from "@mui/icons-material";
import { formatLaoKip, formatLaoKipWithCurrency, formatDate } from "../../../utils/formatLaoKip";
import type { UserShare } from "../../../model/calculateModel";
import {
  computeUserTotals,
  calculateSettlements,
} from "../../../utils/splitCalculations";
import useMainControllerContext from "../context";
import useAuth from "../../../context/auth";
import Swal from "sweetalert2";
import useShareableBill from "./useShareBill";
import {
  EXPENSE_CATEGORIES,
  DEFAULT_CATEGORY_ID,
  getCategory,
} from "../../../constants/categories";
import { buildReminderMessage, shareReminder } from "../../../utils/reminder";
import { STORAGE_ENABLED } from "../../../constants/features";

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
    addMember,
    removeMember,
    addExpenseToSplit,
    addSlip,
    togglePinTrip,
    updateTripName,
    editExpense,
    deleteExpense,
    addParticipant,
    removeParticipant,
    ensureTripInvite,
  } = useMainControllerContext();

  const { user, isAdmin } = useAuth();
  const { shareBill, downloadBillPdf, downloadBillJpeg } = useShareableBill();
  const slipInputRef = useRef<HTMLInputElement>(null);

  // --- trip collaboration local state ---
  const [memberEmail, setMemberEmail] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [expensePayer, setExpensePayer] = useState<string>("");
  const [expenseItem, setExpenseItem] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseConsumers, setExpenseConsumers] = useState<string[]>([]);
  const [expenseCategory, setExpenseCategory] = useState<string>(DEFAULT_CATEGORY_ID);

  // --- edit trip name state ---
  const [editingTripName, setEditingTripName] = useState(false);
  const [tripNameInput, setTripNameInput] = useState("");

  // --- edit expense state ---
  const [editingExpense, setEditingExpense] = useState<{
    userId: string;
    purchaseId: string;
  } | null>(null);
  const [editExpenseItem, setEditExpenseItem] = useState("");
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [editExpenseConsumers, setEditExpenseConsumers] = useState<string[]>([]);
  const [editExpenseCategory, setEditExpenseCategory] = useState<string>(DEFAULT_CATEGORY_ID);

  // --- add participant state ---
  const [newParticipantName, setNewParticipantName] = useState("");

  const isOwner = !!selectedSplit && selectedSplit.userId === user?.uid;
  const canManageMembers = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  const openExpenseDialog = () => {
    const ids = (selectedSplit?.users || []).map((u: UserShare) => u.userId);
    setExpensePayer(ids[0] || "");
    setExpenseItem("");
    setExpenseAmount("");
    setExpenseConsumers(ids);
    setExpenseCategory(DEFAULT_CATEGORY_ID);
    setExpenseOpen(true);
  };

  const toggleExpenseConsumer = (id: string) => {
    setExpenseConsumers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitExpense = async () => {
    if (!selectedSplit) return;
    const amount = parseFloat(expenseAmount);
    const ok = await addExpenseToSplit(
      selectedSplit.id,
      expensePayer,
      expenseItem,
      isNaN(amount) ? 0 : amount,
      expenseConsumers,
      expenseCategory
    );
    if (ok) setExpenseOpen(false);
  };

  // --- Edit trip name handlers ---
  const startEditTripName = () => {
    if (!selectedSplit) return;
    setTripNameInput(selectedSplit.tripName || "");
    setEditingTripName(true);
  };

  const saveTripName = async () => {
    if (!selectedSplit) return;
    const ok = await updateTripName(selectedSplit.id, tripNameInput);
    if (ok) setEditingTripName(false);
  };

  const cancelEditTripName = () => {
    setEditingTripName(false);
    setTripNameInput("");
  };

  // --- Edit expense handlers ---
  const startEditExpense = (
    userId: string,
    purchase: { id: string; itemName: string; amount: number; consumers?: string[]; category?: string }
  ) => {
    setEditingExpense({ userId, purchaseId: purchase.id });
    setEditExpenseItem(purchase.itemName);
    setEditExpenseAmount(String(purchase.amount));
    setEditExpenseCategory(purchase.category || DEFAULT_CATEGORY_ID);
    // If consumers is not defined, default to all users in the split
    const consumers = purchase.consumers || selectedSplit?.users.map((u: UserShare) => u.userId) || [];
    setEditExpenseConsumers(consumers);
  };

  const saveEditExpense = async () => {
    if (!selectedSplit || !editingExpense) return;
    const amount = parseFloat(editExpenseAmount);
    const ok = await editExpense(
      selectedSplit.id,
      editingExpense.userId,
      editingExpense.purchaseId,
      editExpenseItem,
      isNaN(amount) ? 0 : amount,
      editExpenseConsumers,
      editExpenseCategory
    );
    if (ok) setEditingExpense(null);
  };

  const cancelEditExpense = () => {
    setEditingExpense(null);
    setEditExpenseItem("");
    setEditExpenseAmount("");
    setEditExpenseConsumers([]);
    setEditExpenseCategory(DEFAULT_CATEGORY_ID);
  };

  const toggleEditExpenseConsumer = (id: string) => {
    setEditExpenseConsumers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteExpense = async (userId: string, purchaseId: string) => {
    if (!selectedSplit) return;
    await deleteExpense(selectedSplit.id, userId, purchaseId);
  };

  const handleAddParticipant = async () => {
    if (!selectedSplit) return;
    const ok = await addParticipant(selectedSplit.id, newParticipantName);
    if (ok) setNewParticipantName("");
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedSplit) return;
    await removeParticipant(selectedSplit.id, userId);
  };

  const handleAddMember = async () => {
    if (!selectedSplit) return;
    const ok = await addMember(selectedSplit.id, memberEmail);
    if (ok) setMemberEmail("");
  };

  const handleSlipPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !selectedSplit) return;
    await addSlip(selectedSplit.id, file);
  };

  // Generate shareable trip link
  const getTripShareLink = (tripId: string) => {
    return `${window.location.origin}/report?join=${tripId}`;
  };

  const handleCopyLink = async () => {
    if (!selectedSplit) return;
    const link = getTripShareLink(selectedSplit.id);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleOpenQrDialog = () => {
    setQrDialogOpen(true);
    // Publishes the name-only preview the link resolves against; a no-op for
    // anyone who is not the trip owner.
    if (selectedSplit) {
      ensureTripInvite(selectedSplit.id).catch((err: unknown) =>
        console.error("Error publishing trip invite:", err)
      );
    }
  };

  // Nudge whoever still owes money, through the phone's share sheet.
  const handleSendReminder = async (settlement: {
    from: string;
    to: string;
    amount: number;
  }) => {
    if (!selectedSplit) return;
    const message = buildReminderMessage({
      tripName: selectedSplit.tripName,
      from: settlement.from,
      to: settlement.to,
      amount: settlement.amount,
      link: getTripShareLink(selectedSplit.id),
    });

    const outcome = await shareReminder(message);
    if (outcome === "cancelled") return;

    if (outcome === "failed") {
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດສົ່ງການແຈ້ງເຕືອນໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: outcome === "shared" ? "ສົ່ງແລ້ວ" : "ຄັດລອກແລ້ວ",
      text:
        outcome === "shared"
          ? "ສົ່ງການແຈ້ງເຕືອນແລ້ວ"
          : "ຄັດລອກຂໍ້ຄວາມແລ້ວ ແປະໄປໃສ່ໃນແອບແຊທໄດ້ເລົຢ",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
    setLinkCopied(false);
  };

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
          <Tab label={`ການຫານກັບໝູ່ (${splitHistory.length})`} />
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
                  ຍັງບໍ່ມີປະຫວັດການຫານກັບໝູ່
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
                  <Card 
                    elevation={2}
                    sx={{
                      border: split.isPinned ? "2px solid" : "none",
                      borderColor: split.isPinned ? "primary.main" : "transparent",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                          gap: 1,
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {split.isPinned && (
                              <PushPinIcon fontSize="small" color="primary" />
                            )}
                            {split.tripName && (
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {split.tripName}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="h6">
                            {formatLaoKipWithCurrency(split.totalAmount)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Tooltip title={split.isPinned ? "ຍົກເລີກປິນ" : "ປິນທຣິບ"}>
                            <IconButton
                              size="small"
                              onClick={() => togglePinTrip(split.id)}
                              color={split.isPinned ? "primary" : "default"}
                            >
                              {split.isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                            </IconButton>
                          </Tooltip>
                          <Chip
                            label={
                              allPaid
                                ? "ຈ່າຍຄົບແລ້ວ"
                                : `${paidUsers}/${totalUsers} ຈ່າຍແລ້ວ`
                            }
                            color={allPaid ? "success" : "warning"}
                            size="small"
                          />
                        </Stack>
                      </Box>

                      {isAdmin && split.userEmail && (
                        <Chip
                          icon={<PersonIcon />}
                          label={split.userEmail}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1, maxWidth: "100%" }}
                        />
                      )}

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
                            {split.timestamp && formatDate(split.timestamp.toDate())}
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

                    {isAdmin && calc.userEmail && (
                      <Chip
                        icon={<PersonIcon />}
                        label={calc.userEmail}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1, maxWidth: "100%" }}
                      />
                    )}

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
                          {calc.timestamp && formatDate(calc.timestamp.toDate())}
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                  {selectedSplit.isPinned && (
                    <PushPinIcon color="primary" />
                  )}
                  {editingTripName ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tripNameInput}
                        onChange={(e) => setTripNameInput(e.target.value)}
                        placeholder="ຊື່ທຣິບ"
                        autoFocus
                      />
                      <IconButton color="primary" onClick={saveTripName}>
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton onClick={cancelEditTripName}>
                        <CancelIcon />
                      </IconButton>
                    </Stack>
                  ) : (
                    <>
                      <Typography variant="h6">
                        {selectedSplit.tripName || "ລາຍລະອຽດການແບ່ງເງິນ"}
                      </Typography>
                      {canDelete && (
                        <Tooltip title="ແກ້ໄຂຊື່ທຣິບ">
                          <IconButton size="small" onClick={startEditTripName}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title={selectedSplit.isPinned ? "ຍົກເລີກປິນ" : "ປິນທຣິບ"}>
                    <IconButton
                      onClick={() => togglePinTrip(selectedSplit.id)}
                      color={selectedSplit.isPinned ? "primary" : "default"}
                    >
                      {selectedSplit.isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                    </IconButton>
                  </Tooltip>
                  {canDelete && (
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleDeleteHistory(selectedSplit.id, "split")
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
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

                {/* Members / sharing */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <GroupAddIcon fontSize="small" /> ສະມາຊິກໃນທຣິບ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ເຈົ້າຂອງ: {selectedSplit.userEmail || "-"}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mb: canManageMembers ? 2 : 0 }}
                  >
                    {(selectedSplit.memberEmails || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        ຍັງບໍ່ມີສະມາຊິກທີ່ຖືກແບ່ງປັນ
                      </Typography>
                    ) : (
                      (selectedSplit.memberEmails || []).map((m: string) => (
                        <Chip
                          key={m}
                          label={m}
                          size="small"
                          variant="outlined"
                          onDelete={
                            canManageMembers
                              ? () => removeMember(selectedSplit.id, m)
                              : undefined
                          }
                        />
                      ))
                    )}
                  </Stack>

                  {canManageMembers && (
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        fullWidth
                        type="email"
                        placeholder="ອີເມວໝູ່ເພື່ອແບ່ງປັນ"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddMember}
                        startIcon={<GroupAddIcon />}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        ເພີ່ມ
                      </Button>
                    </Stack>
                  )}
                </Paper>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={openExpenseDialog}
                >
                  ເພີ່ມລາຍຈ່າຍ
                </Button>

                {/* Settlement Summary Section */}
                {(() => {
                  const settlements = calculateSettlements(
                    computeUserTotals(selectedSplit.users)
                  );
                  const hasSettlements = settlements.length > 0;

                  return (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          gutterBottom
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            fontWeight: "bold",
                            mb: 2,
                          }}
                        >
                          <MoneyIcon sx={{ mr: 1 }} />
                          ສະຫຼຸບການຊຳລະເງິນ
                        </Typography>

                        {hasSettlements ? (
                          <Stack spacing={1.5}>
                            {settlements.map((settlement, index) => (
                              <Alert
                                key={index}
                                severity="info"
                                icon={<ArrowForwardIcon />}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="body2">
                                    <strong>{settlement.from}</strong> ຕ້ອງຈ່າຍໃຫ້{" "}
                                    <strong>{settlement.to}</strong>
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                  >
                                    <Chip
                                      label={formatLaoKipWithCurrency(
                                        settlement.amount
                                      )}
                                      color="primary"
                                      size="small"
                                      sx={{ fontWeight: "bold" }}
                                    />
                                    <Tooltip title="ສົ່ງການແຈ້ງເຕືອນ">
                                      <IconButton
                                        size="small"
                                        color="warning"
                                        onClick={() =>
                                          handleSendReminder(settlement)
                                        }
                                      >
                                        <RemindIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Box>
                              </Alert>
                            ))}
                          </Stack>
                        ) : (
                          <Alert severity="success">
                            <Typography variant="body2">
                              ✅ ທຸກຄົນເສຍສົມດູນແລ້ວ! ບໍ່ຈຳເປັນຕ້ອງໂອນເງິນ
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Add Participant Section */}
                {canDelete && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <PersonAddIcon fontSize="small" /> ເພີ່ມຜູ້ເຂົ້າຮ່ວມໃໝ່
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      ເພີ່ມຄົນໃໝ່ເຂົ້າໃນການຄຳນວນ (ກໍລະນີລືມເພີ່ມຕອນບັນທຶກ)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="ຊື່ຜູ້ເຂົ້າຮ່ວມໃໝ່"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddParticipant();
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddParticipant}
                        startIcon={<PersonAddIcon />}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        ເພີ່ມ
                      </Button>
                    </Stack>
                  </Paper>
                )}

                <Typography variant="subtitle1" fontWeight="bold">
                  ລາຍຊື່ຜູ້ໃຊ້ ({selectedSplit.users.length}):
                </Typography>

                {computeUserTotals(selectedSplit.users).map(
                  (user: UserShare & { isPaid?: boolean }) => {
                    const shouldReceive = user.currentBalance < 0;
                    const shouldPay = user.currentBalance > 0;
                    const paid = user.paid ?? 0;
                    const consumed = user.consumed ?? 0;

                    return (
                      <Card
                        key={user.userId}
                        variant="outlined"
                        sx={{
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
                              mb: 2,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="h6">{user.userName}</Typography>
                              {canDelete && selectedSplit.users.length > 2 && (
                                <Tooltip title="ລົບຜູ້ເຂົ້າຮ່ວມ">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveParticipant(user.userId)}
                                  >
                                    <PersonRemoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {shouldReceive && (
                                <Chip
                                  label="ຄວນໄດ້ຮັບເງິນຄືນ"
                                  color="success"
                                  size="small"
                                />
                              )}
                              {shouldPay && (
                                <Chip
                                  label="ຕ້ອງຈ່າຍ"
                                  color="warning"
                                  size="small"
                                />
                              )}
                              <Chip
                                label={user.isPaid ? "ຈ່າຍແລ້ວ" : "ຍັງບໍ່ທັນຈ່າຍ"}
                                color={user.isPaid ? "success" : "default"}
                                size="small"
                              />
                            </Stack>
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
                                ຈ່າຍໄປ:
                              </Typography>
                              <Typography variant="body2">
                                {formatLaoKipWithCurrency(paid)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                ຮັບຜິດຊອບ:
                              </Typography>
                              <Typography variant="body2" color="error">
                                {formatLaoKipWithCurrency(consumed)}
                              </Typography>
                            </Box>

                            <Divider />

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {shouldReceive
                                  ? "ຄວນໄດ້ຮັບຄືນ:"
                                  : shouldPay
                                  ? "ຍັງຕ້ອງຈ່າຍ:"
                                  : "ສະຖານະ:"}
                              </Typography>
                              <Typography
                                variant="body2"
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
                                  ? formatLaoKipWithCurrency(
                                      Math.abs(user.currentBalance)
                                    )
                                  : formatLaoKipWithCurrency(user.currentBalance)}
                              </Typography>
                            </Box>
                          </Stack>

                          {user.purchases.length > 0 && (
                            <>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" fontWeight="bold">
                                ລາຍການຊື້ ({user.purchases.length}):
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                                {user.purchases.map((purchase) => {
                                  const isEditingThis =
                                    editingExpense?.userId === user.userId &&
                                    editingExpense?.purchaseId === purchase.id;

                                  if (isEditingThis) {
                                    return (
                                      <Box
                                        key={purchase.id}
                                        sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}
                                      >
                                        <Stack spacing={1}>
                                          <TextField
                                            size="small"
                                            fullWidth
                                            label="ຊື່ລາຍການ"
                                            value={editExpenseItem}
                                            onChange={(e) => setEditExpenseItem(e.target.value)}
                                          />
                                          <TextField
                                            size="small"
                                            fullWidth
                                            label="ຈຳນວນເງິນ"
                                            type="number"
                                            value={editExpenseAmount}
                                            onChange={(e) => setEditExpenseAmount(e.target.value)}
                                            inputProps={{ inputMode: "numeric" }}
                                          />
                                          <ToggleButtonGroup
                                            value={editExpenseCategory}
                                            exclusive
                                            onChange={(_, value) =>
                                              value && setEditExpenseCategory(value)
                                            }
                                            size="small"
                                            sx={{ flexWrap: "wrap", gap: 0.5 }}
                                          >
                                            {EXPENSE_CATEGORIES.map((c) => (
                                              <ToggleButton
                                                key={c.id}
                                                value={c.id}
                                                sx={{ px: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                                              >
                                                <span style={{ marginRight: 4 }}>{c.emoji}</span>
                                                {c.label}
                                              </ToggleButton>
                                            ))}
                                          </ToggleButtonGroup>
                                          <FormControl component="fieldset" size="small">
                                            <FormLabel component="legend">ຜູ້ຮັບຜິດຊອບ</FormLabel>
                                            <FormGroup row>
                                              {selectedSplit.users.map((u: UserShare) => (
                                                <FormControlLabel
                                                  key={u.userId}
                                                  control={
                                                    <Checkbox
                                                      size="small"
                                                      checked={editExpenseConsumers.includes(u.userId)}
                                                      onChange={() => toggleEditExpenseConsumer(u.userId)}
                                                    />
                                                  }
                                                  label={u.userName}
                                                />
                                              ))}
                                            </FormGroup>
                                          </FormControl>
                                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={cancelEditExpense}
                                            >
                                              ຍົກເລີກ
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="contained"
                                              onClick={saveEditExpense}
                                            >
                                              ບັນທຶກ
                                            </Button>
                                          </Stack>
                                        </Stack>
                                      </Box>
                                    );
                                  }

                                  return (
                                    <Box
                                      key={purchase.id}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        py: 0.5,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          minWidth: 0,
                                        }}
                                      >
                                        <Chip
                                          size="small"
                                          label={getCategory(purchase.category).emoji}
                                          sx={{
                                            height: 20,
                                            "& .MuiChip-label": { px: 0.75 },
                                            bgcolor: `${getCategory(purchase.category).color}22`,
                                          }}
                                        />
                                        <Typography variant="body2" noWrap>
                                          {purchase.itemName}
                                        </Typography>
                                      </Box>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Typography variant="body2" color="error">
                                          -{formatLaoKipWithCurrency(purchase.amount)}
                                        </Typography>
                                        {canDelete && (
                                          <>
                                            <Tooltip title="ແກ້ໄຂ">
                                              <IconButton
                                                size="small"
                                                onClick={() => startEditExpense(user.userId, purchase)}
                                              >
                                                <EditIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="ລົບ">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteExpense(user.userId, purchase.id)}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          </>
                                        )}
                                      </Stack>
                                    </Box>
                                  );
                                })}
                              </Paper>
                            </>
                          )}

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
                    );
                  }
                )}

                {/* Payment slips (temporarily hidden until Storage is enabled) */}
                {STORAGE_ENABLED && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ImageIcon fontSize="small" /> ສະລິບການໂອນ (
                        {(selectedSplit.slips || []).length})
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => slipInputRef.current?.click()}
                      >
                        ເພີ່ມສະລິບ
                      </Button>
                      <input
                        ref={slipInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleSlipPick}
                      />
                    </Box>
                    <Grid container spacing={1}>
                      {(selectedSplit.slips || []).map((slip: any) => (
                        <Grid size={{ xs: 4, sm: 3 }} key={slip.id}>
                          <Box
                            component="a"
                            href={slip.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Avatar
                              variant="rounded"
                              src={slip.imageUrl}
                              sx={{ width: "100%", height: 90 }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
              <Tooltip title="ແບ່ງປັນດ້ວຍ QR Code">
                <Button
                  startIcon={<QrCodeIcon />}
                  onClick={handleOpenQrDialog}
                  color="secondary"
                >
                  QR Code
                </Button>
              </Tooltip>
              <Button
                startIcon={<PdfIcon />}
                onClick={() => downloadBillPdf(selectedSplit)}
              >
                PDF
              </Button>
              <Button
                startIcon={<ImageIcon />}
                onClick={() => downloadBillJpeg(selectedSplit)}
              >
                JPEG
              </Button>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={() => shareBill(selectedSplit)}
              >
                ແບ່ງປັນ
              </Button>
              <Button onClick={handleCloseDialog}>ປິດ</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add-expense-to-trip dialog */}
      <Dialog
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ເພີ່ມລາຍຈ່າຍເຂົ້າທຣິບ</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="trip-payer-label">ຈ່າຍໂດຍ</InputLabel>
              <Select
                labelId="trip-payer-label"
                label="ຈ່າຍໂດຍ"
                value={expensePayer}
                onChange={(e) => setExpensePayer(e.target.value)}
              >
                {(selectedSplit?.users || []).map((u: UserShare) => (
                  <MenuItem key={u.userId} value={u.userId}>
                    {u.userName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="ຊື່ລາຍຈ່າຍ"
              value={expenseItem}
              onChange={(e) => setExpenseItem(e.target.value)}
              fullWidth
              placeholder="ເຊັ່ນ: ອາຫານທ່ຽງ, ນ້ຳມັນ"
            />

            <FormControl component="fieldset" variant="standard">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                ປະເພດລາຍຈ່າຍ
              </FormLabel>
              <ToggleButtonGroup
                value={expenseCategory}
                exclusive
                onChange={(_, value) => value && setExpenseCategory(value)}
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
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>ກີບ</Typography>,
              }}
            />

            <FormControl component="fieldset" variant="standard">
              <FormLabel component="legend">ໃຜຮ່ວມໃຊ້/ກິນ?</FormLabel>
              <FormGroup>
                {(selectedSplit?.users || []).map((u: UserShare) => (
                  <FormControlLabel
                    key={u.userId}
                    control={
                      <Checkbox
                        checked={expenseConsumers.includes(u.userId)}
                        onChange={() => toggleExpenseConsumer(u.userId)}
                      />
                    }
                    label={u.userName}
                  />
                ))}
              </FormGroup>
              {expenseConsumers.length > 0 && expenseAmount && (
                <Typography variant="caption" color="text.secondary">
                  ຄົນລະ{" "}
                  {formatLaoKip(
                    (parseFloat(expenseAmount) || 0) / expenseConsumers.length
                  )}{" "}
                  ກີບ ({expenseConsumers.length} ຄົນ)
                </Typography>
              )}
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseOpen(false)}>ຍົກເລີກ</Button>
          <Button
            variant="contained"
            onClick={submitExpense}
            disabled={
              !expensePayer ||
              !expenseItem ||
              !expenseAmount ||
              expenseConsumers.length === 0
            }
          >
            ເພີ່ມ
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Share Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={handleCloseQrDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          <QrCodeIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h6">ແບ່ງປັນດ້ວຍ QR Code</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            {selectedSplit && (
              <>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                  }}
                >
                  <QRCodeSVG
                    value={getTripShareLink(selectedSplit.id)}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </Paper>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  ສະແກນ QR Code ນີ້ເພື່ອເຂົ້າຮ່ວມທຣິບ
                  <br />
                  <strong>{selectedSplit.tripName || "ທຣິບ"}</strong>
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    {getTripShareLink(selectedSplit.id)}
                  </Typography>
                  <Tooltip title={linkCopied ? "ຄັດລອກແລ້ວ!" : "ຄັດລອກລິ້ງ"}>
                    <IconButton
                      size="small"
                      onClick={handleCopyLink}
                      color={linkCopied ? "success" : "default"}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>

                {linkCopied && (
                  <Alert severity="success" sx={{ width: "100%" }}>
                    ຄັດລອກລິ້ງສຳເລັດແລ້ວ!
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog} fullWidth variant="outlined">
            ປິດ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};