import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
  FormControlLabel,
  Switch,
  Grid,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  NotificationsActive as RemindIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalanceWallet as WalletIcon,
  Handshake as HandshakeIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { formatLaoKipWithCurrency } from "../../../utils/formatLaoKip";
import { buildReminderMessage, shareReminder } from "../../../utils/reminder";
import useMainControllerContext from "../context";
import type { PairBalance, PersonBalance } from "../controllers";

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

const colorFor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export const BalancesContent = () => {
  const {
    loading,
    error,
    pairs,
    people,
    tripsCounted,
    totalTrips,
    totalOutstanding,
    includeSettled,
    setIncludeSettled,
  } = useMainControllerContext();

  const [expanded, setExpanded] = useState<string | null>(null);

  const handleRemind = async (pair: PairBalance) => {
    const tripNames = pair.trips.map((t) => t.tripName).join(", ");
    const message = buildReminderMessage({
      tripName: tripNames,
      from: pair.from,
      to: pair.to,
      amount: pair.amount,
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
      timer: 1500,
      showConfirmButton: false,
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        ຍອດລວມທຸກທຣິບ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ລວມໜີ້ຈາກທຸກທຣິບເຂົ້າກັນ ໃຫ້ຮູ້ວ່າສຸດທ້າຍໃຜຕ້ອງຈ່າຍໃຫ້ໃຜ ເທົ່າໃດ
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card
        sx={{
          mb: 2,
          color: "white",
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 52, height: 52 }}>
              <WalletIcon />
            </Avatar>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ຍອດທີ່ຍັງຄ້າງທັງໝົດ
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatLaoKipWithCurrency(totalOutstanding)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                ຈາກ {tripsCounted} / {totalTrips} ທຣິບ
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <FormControlLabel
        sx={{ mb: 1 }}
        control={
          <Switch
            checked={includeSettled}
            onChange={(e) => setIncludeSettled(e.target.checked)}
          />
        }
        label={
          <Typography variant="body2">
            ນັບຄົນທີ່ໝາຍວ່າຈ່າຍແລ້ວນຳ
          </Typography>
        }
      />

      {pairs.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 5, textAlign: "center", borderRadius: 4, borderStyle: "dashed" }}
        >
          <HandshakeIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            ບໍ່ມີໜີ້ຄ້າງ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ທຸກຄົນເສຍສົມດູນແລ້ວ ຫຼື ຍັງບໍ່ມີທຣິບທີ່ຕ້ອງຊຳລະ
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {pairs.map((pair: PairBalance) => {
            const isOpen = expanded === pair.key;
            return (
              <Card key={pair.key} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ pb: "12px !important" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: colorFor(pair.from), fontSize: 14 }}
                      >
                        {initial(pair.from)}
                      </Avatar>
                      <Typography variant="body1" fontWeight={600} noWrap>
                        {pair.from}
                      </Typography>
                      <ArrowForwardIcon fontSize="small" color="action" />
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: colorFor(pair.to), fontSize: 14 }}
                      >
                        {initial(pair.to)}
                      </Avatar>
                      <Typography variant="body1" fontWeight={600} noWrap>
                        {pair.to}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={formatLaoKipWithCurrency(pair.amount)}
                        color="primary"
                        sx={{ fontWeight: "bold" }}
                      />
                      <Tooltip title="ສົ່ງການແຈ້ງເຕືອນ">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleRemind(pair)}
                        >
                          <RemindIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={isOpen ? "ເຊື່ອງທຣິບ" : "ເບິ່ງທຣິບ"}>
                        <IconButton
                          size="small"
                          onClick={() => setExpanded(isOpen ? null : pair.key)}
                        >
                          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Collapse in={isOpen} unmountOnExit>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      ມາຈາກ {pair.trips.length} ທຣິບ:
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {pair.trips.map((trip) => {
                        // A trip that ran the other way reduces the total.
                        const towardsPair = trip.amount > 0;
                        return (
                          <Box
                            key={`${pair.key}-${trip.tripId}`}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2" noWrap>
                              {trip.tripName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={towardsPair ? "text.primary" : "success.main"}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {towardsPair ? "+" : "-"}
                              {formatLaoKipWithCurrency(Math.abs(trip.amount))}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {people.length > 0 && (
        <>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 4, mb: 1 }}>
            ສະຫຼຸບແຕ່ລະຄົນ
          </Typography>
          <Grid container spacing={1.5}>
            {people.map((person: PersonBalance) => (
              <Grid size={{ xs: 12, sm: 6 }} key={person.name}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: colorFor(person.name) }}>
                      {initial(person.name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={600} noWrap>
                        {person.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={person.net > 0 ? "warning.main" : "success.main"}
                        fontWeight={600}
                      >
                        {person.net > 0
                          ? `ຕ້ອງຈ່າຍ ${formatLaoKipWithCurrency(person.net)}`
                          : `ຈະໄດ້ຮັບ ${formatLaoKipWithCurrency(-person.net)}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 3 }}
      >
        ໝາຍເຫດ: ຈັບຄູ່ຄົນຕາມຊື່ທີ່ປ້ອນໃນແຕ່ລະທຣິບ — ຊື່ທີ່ຂຽນຕ່າງກັນຈະນັບເປັນຄົນລະຄົນ
      </Typography>
    </Box>
  );
};
