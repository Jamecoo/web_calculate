import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CasinoIcon from "@mui/icons-material/Casino";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import LogoutIcon from "@mui/icons-material/Logout";
import useMainController from "./controller";

const customTheme = createTheme({
  typography: {
    fontFamily: "'Noto Sans Lao', sans-serif",
  },
  palette: {
    mode: "dark",
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    primary: {
      main: "#6366f1",
    },
    success: {
      main: "#10b981",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          textTransform: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export const RealtimeNotePages = () => {
  const {
    currentUser,
    authLoading,
    handleLogout,
    sessions,
    selectedGameId,
    setSelectedGameId,
    newGameName,
    setNewGameName,
    handleCreateGame,
    players,
    history,
    loading,
    playerNameInput,
    setPlayerNameInput,
    selectedWinnerId,
    setSelectedWinnerId,
    roundAmountDisplay,
    handleAmountChange,
    doubledLoserIds,
    toggleDoubledLoser,
    handleAddPlayer,
    handleRemovePlayer,
    handleRecordRound,
    editingTurn,
    setEditingTurn,
    editWinnerId,
    setEditWinnerId,
    editAmountDisplay,
    setEditAmountDisplay,
    editDoubledLoserIds,
    toggleEditDoubledLoser,
    handleOpenEdit,
    handleSaveEdit,
    successMessage,
    setSuccessMessage,
    currentGame,
    isOwner,
    inviteEmailInput,
    setInviteEmailInput,
    handleInviteMember,
    handleRemoveMember,
    startingBalanceDisplay,
    handleStartingBalanceChange,
  } = useMainController();

  const isMobile = useMediaQuery("(max-width:600px)");

  // Local UI state: the "create room" flow now lives behind a button + modal
  // instead of an always-visible text field.
  const [createRoomOpen, setCreateRoomOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const openCreateRoom = () => setCreateRoomOpen(true);
  const closeCreateRoom = () => setCreateRoomOpen(false);
  const openInvite = () => setInviteOpen(true);
  const closeInvite = () => setInviteOpen(false);

  // handleCreateGame already validates, and shows its own success/error
  // SweetAlert; we just wait for it to settle before dismissing the modal
  // so an error alert isn't hidden behind a closing dialog.
  const submitCreateRoom = async () => {
    if (!newGameName || !newGameName.trim()) return;
    await handleCreateGame();
    closeCreateRoom();
  };

  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <ThemeProvider theme={customTheme}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          gap={1.5}
          px={2}
          textAlign="center"
        >
          <CasinoIcon fontSize="large" sx={{ color: "#818cf8" }} />
          <Typography variant="h6" color="#f8fafc" fontWeight={700}>
            ກະລຸນາເຂົ້າສູ່ລະບົບ
          </Typography>
          <Typography color="#94a3b8">
            ທ່ານຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນຈຶ່ງຈະສາມາດເບິ່ງ ແລະ ບັນທຶກຄະແນນໄດ້.
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          maxWidth: 960,
          margin: "0 auto",
          fontFamily: "'Noto Sans Lao', sans-serif",
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={3}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              fontSize: { xs: "1.4rem", sm: "2.2rem" },
            }}
          >
            <CasinoIcon fontSize="large" sx={{ color: "#818cf8" }} />
            ລະບົບຈົດຄະແນນ Realtime
          </Typography>
          <Typography
            variant="body2"
            color="#94a3b8"
            mt={0.5}
            fontSize={{ xs: "0.8rem", sm: "0.875rem" }}
          >
            ບັນທຶກຜົນ ແລະ ຄິດໄລ່ເງິນອັດໂນມັດ Realtime
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={0.75}
            mt={1}
          >
            <Typography variant="caption" color="#64748b" noWrap>
              ເຂົ້າສູ່ລະບົບເປັນ: {currentUser.email}
            </Typography>
            <Tooltip title="ອອກຈາກລະບົບ">
              <IconButton
                size="small"
                onClick={handleLogout}
                aria-label="ອອກຈາກລະບົບ"
                sx={{ color: "#64748b", "&:hover": { color: "#ef4444" } }}
              >
                <LogoutIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Room Switcher */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 3,
            border: "1px solid #334155",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={600}
            mb={1}
            color="#cbd5e1"
          >
            ຫ້ອງຫຼິ້ນ
          </Typography>
          <Box display="flex" gap={1.5} alignItems="stretch">
            <Select
              fullWidth
              size="small"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              sx={{ bgcolor: "#0f172a", flex: 1, minWidth: 0 }}
            >
              {sessions.length === 0 && (
                <MenuItem value="" disabled>
                  -- ຍັງບໍ່ມີຫ້ອງ --
                </MenuItem>
              )}
              {sessions.map((game) => (
                <MenuItem key={game.id} value={game.id}>
                  {game.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              onClick={openCreateRoom}
              startIcon={!isMobile ? <AddCircleIcon /> : undefined}
              sx={{
                flexShrink: 0,
                px: isMobile ? 1.5 : 2.5,
                minWidth: isMobile ? 48 : "auto",
                bgcolor: "#6366f1",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
              aria-label="ສ້າງຫ້ອງໃໝ່"
            >
              {isMobile ? <AddCircleIcon /> : "ຫ້ອງໃໝ່"}
            </Button>
            {selectedGameId && (
              <Tooltip title="ເຊີນເພື່ອນເຂົ້າຫ້ອງນີ້">
                <IconButton
                  onClick={openInvite}
                  aria-label="ເຊີນເພື່ອນ"
                  sx={{
                    flexShrink: 0,
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#cbd5e1",
                    "&:hover": { bgcolor: "#0f172a", borderColor: "#6366f1" },
                  }}
                >
                  <PersonAddAlt1Icon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {currentGame && (
            <Box display="flex" alignItems="center" gap={0.75} mt={1.5}>
              <Chip
                label={isOwner ? "ເຈົ້າຂອງຫ້ອງ" : "ສະມາຊິກ"}
                size="small"
                sx={{
                  bgcolor: isOwner ? "#312e81" : "#334155",
                  color: isOwner ? "#c7d2fe" : "#cbd5e1",
                  fontWeight: 600,
                }}
              />
              <Typography variant="caption" color="#64748b" noWrap>
                {(currentGame.allowedEmails?.length || 0) > 0
                  ? `ແບ່ງປັນກັບ ${currentGame.allowedEmails.length} ຄົນ`
                  : "ຍັງບໍ່ໄດ້ເຊີນໃຜເຂົ້າຫ້ອງນີ້"}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Add Player Box */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 3,
            border: "1px solid #334155",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            mb={1.5}
            color="#f8fafc"
            fontSize="1.1rem"
          >
            ເພີ່ມຜູ້ຫຼິ້ນໃໝ່
          </Typography>
          <Box
            display="flex"
            gap={1.5}
            flexDirection={{ xs: "column", sm: "row" }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="ຊື່ຜູ້ຫຼິ້ນ (ເຊັ່ນ: ທ່ານ A)"
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPlayer();
              }}
              sx={{ bgcolor: "#0f172a" }}
            />
            {/* NEW: manually typed starting balance, e.g. carried over from an old room */}
            <TextField
              fullWidth
              size="small"
              type="text"
              inputMode="numeric"
              placeholder="ຍອດເລີ່ມຕົ້ນ (ກີບ) — ຖ້າມີ"
              value={startingBalanceDisplay}
              onChange={handleStartingBalanceChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPlayer();
              }}
              sx={{ bgcolor: "#0f172a" }}
            />
            <Button
              fullWidth={isMobile}
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={handleAddPlayer}
              sx={{
                px: 3,
                flexShrink: 0,
                bgcolor: "#6366f1",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              ເພີ່ມ
            </Button>
          </Box>
        </Paper>

        {/* Scoreboard — all players in one box */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: "1px solid #334155",
            bgcolor: "#1e293b",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            color="#f8fafc"
            fontSize="1.1rem"
            sx={{ p: { xs: 2, sm: 2.5 }, pb: 1.5 }}
          >
            ກະດານຄະແນນລວມ (Realtime Balance)
          </Typography>
          <Divider sx={{ borderColor: "#334155" }} />

          {players.length === 0 ? (
            <Typography color="#94a3b8" align="center" sx={{ py: 4, px: 2 }}>
              ຍັງບໍ່ມີຜູ້ຫຼິ້ນໃນຫ້ອງນີ້, ກະລຸນາເພີ່ມຜູ້ຫຼິ້ນດ້ານເທິງ.
            </Typography>
          ) : (
            <List dense disablePadding>
              {players.map((player, index) => {
                const isWinner = player.balance > 0;
                const isNeutral = player.balance === 0;

                return (
                  <React.Fragment key={player.id}>
                    <ListItem
                      sx={{
                        py: 1.4,
                        px: { xs: 2, sm: 2.5 },
                        gap: 1,
                      }}
                      secondaryAction={
                        <Tooltip title="ລົບຜູ້ຫຼິ້ນນີ້">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleRemovePlayer(player.id, player.name)
                            }
                            aria-label={`ລົບ ${player.name}`}
                            sx={{
                              color: "#94a3b8",
                              "&:hover": {
                                color: "#ef4444",
                                bgcolor: "rgba(239, 68, 68, 0.1)",
                              },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      {/* Status dot: at a glance, who's up / even / down */}
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          mr: 1.5,
                          bgcolor: isWinner
                            ? "#10b981"
                            : isNeutral
                              ? "#475569"
                              : "#ef4444",
                        }}
                      />
                      <ListItemText
                        primary={
                          <Typography
                            fontWeight={600}
                            color="#f8fafc"
                            noWrap
                            sx={{ maxWidth: { xs: 120, sm: 260 } }}
                          >
                            {player.name}
                          </Typography>
                        }
                      />
                      <Typography
                        fontWeight={800}
                        sx={{
                          color: isWinner
                            ? "#34d399"
                            : isNeutral
                              ? "#f8fafc"
                              : "#f87171",
                          mr: 5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {player.balance > 0
                          ? `+${player.balance.toLocaleString()}`
                          : player.balance.toLocaleString()}{" "}
                        ກີບ
                      </Typography>
                    </ListItem>
                    {index < players.length - 1 && (
                      <Divider component="li" sx={{ borderColor: "#334155" }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>

        {/* Turn Record Box */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 3,
            border: "1px solid #334155",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            mb={1.5}
            color="#f8fafc"
            fontSize="1.1rem"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <EmojiEventsIcon sx={{ color: "#fbbf24" }} />
            ບັນທຶກຜົນການຫຼິ້ນ (ແຕ່ລະຕາ)
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <Select
                fullWidth
                size="small"
                displayEmpty
                value={selectedWinnerId}
                onChange={(e) => setSelectedWinnerId(e.target.value)}
                sx={{ bgcolor: "#0f172a" }}
              >
                <MenuItem value="" disabled>
                  -- ເລືອກຜູ້ຊະນະ --
                </MenuItem>
                {players.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="text"
                inputMode="numeric"
                placeholder="ຈຳນວນເງິນເສຍຜູ້ລະ (ກີບ)"
                value={roundAmountDisplay}
                onChange={handleAmountChange}
                sx={{ bgcolor: "#0f172a" }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={handleRecordRound}
                disabled={
                  !selectedWinnerId || !roundAmountDisplay || players.length < 2
                }
                sx={{
                  py: 1,
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                ບັນທຶກຕານີ້
              </Button>
            </Grid>
          </Grid>
          {players.length < 2 && (
            <Typography
              variant="caption"
              color="#94a3b8"
              mt={1}
              display="block"
            >
              ຕ້ອງມີຜູ້ຫຼິ້ນຢ່າງໜ້ອຍ 2 ຄົນຈຶ່ງບັນທຶກຕາໄດ້.
            </Typography>
          )}

          {/* x2 toggle: mark specific losers who pay double this round */}
          {selectedWinnerId && players.length >= 2 && (
            <Box mt={2}>
              <Typography
                variant="caption"
                color="#94a3b8"
                display="block"
                mb={0.75}
              >
                ຄູນ 2 (x2) — ເລືອກຜູ້ທີ່ຕ້ອງຈ່າຍເພີ່ມຂຶ້ນ 2 ເທົ່າໃນຕານີ້
                (ຖ້າມີ):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {players
                  .filter((p) => p.id !== selectedWinnerId)
                  .map((p) => {
                    const isDoubled = doubledLoserIds.includes(p.id);
                    return (
                      <Chip
                        key={p.id}
                        label={`${p.name} ×2`}
                        onClick={() => toggleDoubledLoser(p.id)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          cursor: "pointer",
                          bgcolor: isDoubled ? "#f59e0b" : "#0f172a",
                          color: isDoubled ? "#1e293b" : "#94a3b8",
                          border: "1px solid",
                          borderColor: isDoubled ? "#f59e0b" : "#334155",
                          "&:hover": {
                            bgcolor: isDoubled ? "#d97706" : "#1e293b",
                          },
                        }}
                      />
                    );
                  })}
              </Box>
            </Box>
          )}
        </Paper>

        {/* History Box */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            border: "1px solid #334155",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            mb={1}
            color="#f8fafc"
            fontSize="1.1rem"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <HistoryIcon sx={{ color: "#94a3b8" }} />
            ປະຫວັດການຫຼິ້ນ
          </Typography>
          <Divider sx={{ mb: 1.5, borderColor: "#334155" }} />
          {history.length === 0 ? (
            <Typography color="#94a3b8" align="center" sx={{ py: 3 }}>
              ຍັງບໍ່ທັນມີປະຫວັດການຫຼິ້ນໃນຫ້ອງນີ້.
            </Typography>
          ) : (
            <List dense disablePadding>
              {history.map((turn, index) => {
                const formattedTime = turn.createdAt?.toDate
                  ? turn.createdAt.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "ດຽວນີ້";
                const totalPlayers = turn.totalPlayersAtTurn || players.length;
                const doubledIds = turn.doubledLoserIds || [];
                const totalLosers = totalPlayers - 1;
                // Doubled losers pay amountPerLoser*2, everyone else pays
                // amountPerLoser once — so the winner's total is the base
                // amount for every loser plus one extra share per doubled loser.
                const winnerTotal =
                  turn.amountPerLoser * (totalLosers + doubledIds.length);
                const doubledNames = doubledIds
                  .map((id) => players.find((p) => p.id === id)?.name)
                  .filter(Boolean);

                return (
                  <React.Fragment key={turn.id}>
                    <ListItem
                      sx={{ py: 1.2, pr: 6 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenEdit(turn)}
                          aria-label="ແກ້ໄຂຕານີ້"
                        >
                          <EditIcon
                            fontSize="small"
                            sx={{ color: "#94a3b8" }}
                          />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            flexWrap="wrap"
                          >
                            <Chip
                              label={`ຕາທີ ${history.length - index}`}
                              size="small"
                              sx={{
                                bgcolor: "#334155",
                                color: "#f8fafc",
                                fontWeight: 600,
                              }}
                            />
                            <Typography fontWeight={600} color="#f8fafc">
                              <strong>{turn.winnerName}</strong> ຊະນະ{" "}
                              <span
                                style={{ color: "#34d399", fontWeight: 700 }}
                              >
                                +{winnerTotal.toLocaleString()} ກີບ
                              </span>
                            </Typography>
                            {doubledNames.length > 0 && (
                              <Chip
                                label={`x2: ${doubledNames.join(", ")}`}
                                size="small"
                                sx={{
                                  bgcolor: "#f59e0b",
                                  color: "#1e293b",
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`ຜູ້ເສຍຈ່າຍຜູ້ລະ: ${turn.amountPerLoser.toLocaleString()} ກີບ • ເວລາ: ${formattedTime}`}
                        secondaryTypographyProps={{ color: "#94a3b8", mt: 0.5 }}
                      />
                    </ListItem>
                    {index < history.length - 1 && (
                      <Divider component="li" sx={{ borderColor: "#334155" }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>

        {/* Create Room Modal */}
        <Dialog
          open={createRoomOpen}
          onClose={closeCreateRoom}
          fullScreen={isMobile}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: { p: 1, bgcolor: "#1e293b", color: "#f8fafc" },
          }}
        >
          <DialogTitle fontWeight={700}>ສ້າງຫ້ອງຫຼິ້ນໃໝ່</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="subtitle2" color="#cbd5e1" mb={1}>
              ຊື່ຫ້ອງ
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="ຊື່ຫ້ອງ (ເຊັ່ນ: ຄືນວັນເສົາ)"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCreateRoom();
              }}
              sx={{ bgcolor: "#0f172a" }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeCreateRoom} sx={{ color: "#94a3b8" }}>
              ຍົກເລີກ
            </Button>
            <Button
              variant="contained"
              onClick={submitCreateRoom}
              disabled={!newGameName || !newGameName.trim()}
              sx={{
                bgcolor: "#6366f1",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              ສ້າງຫ້ອງ
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invite Friend Modal */}
        <Dialog
          open={inviteOpen}
          onClose={closeInvite}
          fullScreen={isMobile}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: { p: 1, bgcolor: "#1e293b", color: "#f8fafc" },
          }}
        >
          <DialogTitle fontWeight={700}>ເຊີນເພື່ອນເຂົ້າຫ້ອງ</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="subtitle2" color="#cbd5e1" mb={1}>
              ອີເມວຂອງເພື່ອນ
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                type="email"
                placeholder="friend@example.com"
                value={inviteEmailInput}
                onChange={(e) => setInviteEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInviteMember();
                }}
                sx={{ bgcolor: "#0f172a" }}
              />
              <Button
                variant="contained"
                onClick={handleInviteMember}
                disabled={!inviteEmailInput.trim()}
                sx={{
                  flexShrink: 0,
                  bgcolor: "#6366f1",
                  "&:hover": { bgcolor: "#4f46e5" },
                }}
              >
                ເຊີນ
              </Button>
            </Box>
            <Typography
              variant="caption"
              color="#64748b"
              display="block"
              mt={1}
            >
              ເພື່ອນຕ້ອງເຂົ້າສູ່ລະບົບດ້ວຍອີເມວນີ້ຈຶ່ງຈະເຫັນຫ້ອງນີ້.
            </Typography>

            <Divider sx={{ my: 2, borderColor: "#334155" }} />

            <Typography variant="subtitle2" color="#cbd5e1" mb={1}>
              ສະມາຊິກທີ່ມີສິດເຂົ້າເຖິງ
            </Typography>
            <List dense disablePadding>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography color="#f8fafc" fontWeight={600} noWrap>
                      {currentGame?.ownerEmail || currentUser?.email}
                    </Typography>
                  }
                  secondary="ເຈົ້າຂອງຫ້ອງ"
                  secondaryTypographyProps={{ color: "#64748b" }}
                />
              </ListItem>
              {(currentGame?.allowedEmails || []).map((email) => (
                <ListItem
                  key={email}
                  sx={{ px: 0 }}
                  secondaryAction={
                    isOwner && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMember(email)}
                        aria-label={`ລົບ ${email}`}
                        sx={{
                          color: "#94a3b8",
                          "&:hover": {
                            color: "#ef4444",
                            bgcolor: "rgba(239, 68, 68, 0.1)",
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Typography color="#f8fafc" noWrap sx={{ pr: 4 }}>
                        {email}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {(!currentGame?.allowedEmails ||
                currentGame.allowedEmails.length === 0) && (
                <Typography variant="caption" color="#64748b">
                  ຍັງບໍ່ໄດ້ເຊີນໃຜເຂົ້າຫ້ອງນີ້.
                </Typography>
              )}
            </List>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeInvite} sx={{ color: "#94a3b8" }}>
              ປິດ
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Turn Modal */}
        <Dialog
          open={Boolean(editingTurn)}
          onClose={() => setEditingTurn(null)}
          fullScreen={isMobile}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: { borderRadius: 3, p: 1, bgcolor: "#1e293b", color: "#f8fafc" },
          }}
        >
          <DialogTitle fontWeight={700}>ແກ້ໄຂຄະແນນຕານີ້</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Typography variant="subtitle2" color="#cbd5e1">
                ເລືອກຜູ້ຊະນະໃໝ່:
              </Typography>
              <Select
                fullWidth
                size="small"
                value={editWinnerId}
                onChange={(e) => setEditWinnerId(e.target.value)}
                sx={{ bgcolor: "#0f172a" }}
              >
                {players.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>

              <Typography variant="subtitle2" color="#cbd5e1">
                ຈຳນວນເງິນເສຍຜູ້ລະ (ກີບ):
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editAmountDisplay}
                onChange={(e) =>
                  setEditAmountDisplay(
                    Number(e.target.value.replace(/\D/g, "")).toLocaleString(),
                  )
                }
                sx={{ bgcolor: "#0f172a" }}
              />

              <Typography variant="subtitle2" color="#cbd5e1">
                ຄູນ 2 (x2) — ຜູ້ທີ່ຈ່າຍເພີ່ມ 2 ເທົ່າ:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {players
                  .filter((p) => p.id !== editWinnerId)
                  .map((p) => {
                    const isDoubled = editDoubledLoserIds.includes(p.id);
                    return (
                      <Chip
                        key={p.id}
                        label={`${p.name} ×2`}
                        onClick={() => toggleEditDoubledLoser(p.id)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          cursor: "pointer",
                          bgcolor: isDoubled ? "#f59e0b" : "#0f172a",
                          color: isDoubled ? "#1e293b" : "#94a3b8",
                          border: "1px solid",
                          borderColor: isDoubled ? "#f59e0b" : "#334155",
                          "&:hover": {
                            bgcolor: isDoubled ? "#d97706" : "#1e293b",
                          },
                        }}
                      />
                    );
                  })}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setEditingTurn(null)}
              sx={{ color: "#94a3b8" }}
            >
              ຍົກເລີກ
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              sx={{ bgcolor: "#6366f1" }}
            >
              ບັນທຶກການແກ້ໄຂ
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Success feedback: a quiet, auto-dismissing toast instead of a
          blocking SweetAlert2 popup — the action's result (new card, new
          list item, updated balance) is already visible, this just confirms it. */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={2500}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%", bgcolor: "#10b981" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default RealtimeNotePages;
