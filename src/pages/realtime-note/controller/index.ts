import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";
import { logout as firebaseLogout } from "../../../services/auth.services";
import {
  subscribeToGameSessions,
  subscribeToPlayers,
  subscribeToHistory,
  createNewGameInFirestore,
  addPlayerToFirestore,
  deletePlayerFromFirestore,
  recordTurnToFirestore,
  editTurnInFirestore,
  inviteMemberToGame,
  removeMemberFromGame,
  type GameSession,
  type Player,
  type HistoryRecord,
  //   updatePlayerBalance,
  updatePlayerBalanceWithHistory,
} from "../../../services/realtime-note.service";

// SweetAlert2 base styling for dark theme.
// Reserved for things that need to interrupt the user: validation warnings,
// errors, and destructive-action confirmation. Routine "it worked" feedback
// uses the lighter Snackbar (see successMessage below) instead.
const customSwal = Swal.mixin({
  background: "#1e293b",
  color: "#f8fafc",
  confirmButtonColor: "#6366f1",
  cancelButtonColor: "#64748b",
  customClass: {
    popup: "swal2-dark-popup",
  },
});

export const useMainController = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [newGameName, setNewGameName] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const [playerNameInput, setPlayerNameInput] = useState("");
  const [selectedWinnerId, setSelectedWinnerId] = useState("");
  const [roundAmountDisplay, setRoundAmountDisplay] = useState<string>("");
  // Player IDs who should pay double (x2) the base amount on this round.
  const [doubledLoserIds, setDoubledLoserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Turn Modal state
  const [editingTurn, setEditingTurn] = useState<HistoryRecord | null>(null);
  const [editWinnerId, setEditWinnerId] = useState("");
  const [editAmountDisplay, setEditAmountDisplay] = useState("");
  const [editDoubledLoserIds, setEditDoubledLoserIds] = useState<string[]>([]);

  // Invite-a-friend state
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  // NEW: starting balance the user types in when adding a player
  const [startingBalanceDisplay, setStartingBalanceDisplay] = useState("");
  // NEW: tracks just the "recording a round" action, so the button can disable itself
  const [isRecordingRound, setIsRecordingRound] = useState(false);
  // Manual balance edit state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editBalanceDisplay, setEditBalanceDisplay] = useState("");

  // Non-blocking success feedback. The UI renders this as a Snackbar instead
  // of a SweetAlert2 popup, since a toast that appears near the action and
  // auto-dismisses is less disruptive than a modal for routine confirmations.
  const [successMessage, setSuccessMessage] = useState("");
  // NEW: tracks the "saving a manual balance edit" action
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const handleOpenEditBalance = (player: Player) => {
    setEditingPlayer(player);
    setEditBalanceDisplay(formatSignedWithCommas(player.balance));
  };

  const handleSaveEditBalance = async () => {
    if (!editingPlayer || !selectedGameId) return;
    const newBalance = parseSignedRawNumber(editBalanceDisplay);

    setIsSavingBalance(true); // NEW
    try {
      await updatePlayerBalanceWithHistory(
        selectedGameId,
        editingPlayer.id,
        editingPlayer.name,
        editingPlayer.balance,
        newBalance,
      );
      setEditingPlayer(null);
      setSuccessMessage("ແກ້ໄຂຄະແນນສຳເລັດ");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ແກ້ໄຂບໍ່ສຳເລັດ",
      });
    } finally {
      setIsSavingBalance(false); // NEW — runs whether it succeeded or failed
    }
  };

  const handleEditBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditBalanceDisplay(formatSignedWithCommas(e.target.value));

  const formatWithCommas = (val: string | number) => {
    const num = val.toString().replace(/\D/g, "");
    return num ? Number(num).toLocaleString("en-US") : "";
  };

  const parseRawNumber = (val: string) => Number(val.replace(/\D/g, "")) || 0;

  const formatSignedWithCommas = (val: string | number) => {
    const str = val.toString();
    const isNegative = str.trim().startsWith("-");
    const digits = str.replace(/\D/g, ""); // strips the '-' too, so re-add it below
    if (!digits) return isNegative ? "-" : "";
    const formatted = Number(digits).toLocaleString("en-US");
    return isNegative ? `-${formatted}` : formatted;
  };

  const parseSignedRawNumber = (val: string) => {
    const isNegative = val.trim().startsWith("-");
    const digits = val.replace(/\D/g, "");
    const num = Number(digits) || 0;
    return isNegative ? -num : num;
  };

  const toggleDoubledLoser = (playerId: string) => {
    setDoubledLoserIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    );
  };

  const toggleEditDoubledLoser = (playerId: string) => {
    setEditDoubledLoserIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    );
  };

  // 0. Track the signed-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. Subscribe to Game Sessions this user can access (owned or invited)
  useEffect(() => {
    if (!currentUser) {
      setSessions([]);
      setSelectedGameId("");
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToGameSessions(
      currentUser.uid,
      currentUser.email,
      async (gameList) => {
        if (gameList.length === 0) {
          const defaultId = await createNewGameInFirestore(
            "ຫ້ອງຫຼິ້ນໄພ້ທົ່ວໄປ",
            currentUser.uid,
            currentUser.email,
          );
          setSelectedGameId(defaultId);
        } else {
          setSessions(gameList);
          // Keep the current selection if it's still visible to this user;
          // otherwise (first load, or access was revoked) fall bachandleSaveEditBalancek to the
          // first room in the list.
          setSelectedGameId((prev) =>
            prev && gameList.some((g) => g.id === prev) ? prev : gameList[0].id,
          );
        }
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [currentUser]);

  // 2. Subscribe to Players & History
  useEffect(() => {
    if (!selectedGameId) return;

    const unsubPlayers = subscribeToPlayers(selectedGameId, setPlayers);
    const unsubHistory = subscribeToHistory(selectedGameId, setHistory);

    return () => {
      unsubPlayers();
      unsubHistory();
    };
  }, [selectedGameId]);

  // Create Game
  const handleCreateGame = async () => {
    if (!currentUser) return;
    if (!newGameName.trim()) {
      customSwal.fire({
        icon: "warning",
        title: "ກະລຸນາປ້ອນຊື່ຫ້ອງ",
        text: "ຊື່ຫ້ອງຫຼິ້ນໄພ້ບໍ່ສາມາດຫວ່າງເປົ່າໄດ້",
      });
      return;
    }
    try {
      const gameId = await createNewGameInFirestore(
        newGameName.trim(),
        currentUser.uid,
        currentUser.email,
      );
      setNewGameName("");
      setSelectedGameId(gameId);
      setSuccessMessage("ສ້າງຫ້ອງສຳເລັດ");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ເກີດຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດສ້າງຫ້ອງໄດ້, ກະລຸນາລອງໃໝ່",
      });
    }
  };

  // Add Player
  const handleAddPlayer = async () => {
    if (!playerNameInput.trim()) {
      customSwal.fire({
        icon: "warning",
        title: "ກະລຸນາປ້ອນຊື່ຜູ້ຫຼິ້ນ",
      });
      return;
    }

    try {
      let targetGameId = selectedGameId;
      if (!targetGameId && currentUser) {
        targetGameId = await createNewGameInFirestore(
          "ຫ້ອງຫຼິ້ນໄພ້ 1",
          currentUser.uid,
          currentUser.email,
        );
        setSelectedGameId(targetGameId);
      }
      if (!targetGameId) return;

      // NEW: parse the manually typed starting balance (defaults to 0 if blank)
      const startingBalance = parseSignedRawNumber(startingBalanceDisplay);
      await addPlayerToFirestore(
        targetGameId,
        playerNameInput.trim(),
        startingBalance,
      );

      setPlayerNameInput("");
      setStartingBalanceDisplay(""); // reset for the next player
      setSuccessMessage("ເພີ່ມຜູ້ຫຼິ້ນສຳເລັດ");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ເພີ່ມຜູ້ຫຼິ້ນບໍ່ສຳເລັດ",
        text: "ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ Internet ຫຼື Permissions",
      });
    }
  };

  // Remove Player with Confirmation Dialog
  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    if (!selectedGameId || !playerId) return;

    const result = await customSwal.fire({
      title: `ຢືນຢັນການລົບ ${playerName}?`,
      text: "ຖ້າລົບແລ້ວ ຂໍ້ມູນ ແລະ ຄະແນນຂອງຜູ້ຫຼິ້ນນີ້ຈະຖືກລົບອອກ!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ລົບຜູ້ຫຼິ້ນ",
      cancelButtonText: "ຍົກເລີກ",
    });

    if (result.isConfirmed) {
      try {
        // 1. Delete from Firestore
        await deletePlayerFromFirestore(selectedGameId, playerId);

        // 2. Clear winner select if deleted player was selected
        if (selectedWinnerId === playerId) {
          setSelectedWinnerId("");
        }

        // 3. Force-remove player from local state immediately (Optimistic Update)
        setPlayers((prevPlayers) =>
          prevPlayers.filter((p) => p.id !== playerId),
        );

        setSuccessMessage("ລົບຜູ້ຫຼິ້ນສຳເລັດ");
      } catch (err) {
        console.error("Delete player error:", err);
        customSwal.fire({
          icon: "error",
          title: "ລົບບໍ່ສຳເລັດ",
          text: "ເກີດຂໍ້ຜິດພາດໃນການລົບຂໍ້ມູນ, ກະລຸນາກວດສອບ Firebase Rules",
        });
      }
    }
  };

  // Record Turn Result
  const handleRecordRound = async () => {
    const amount = parseRawNumber(roundAmountDisplay);
    if (!selectedWinnerId || amount <= 0 || !selectedGameId) {
      customSwal.fire({
        icon: "warning",
        title: "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ",
        text: "ກະລຸນາເລືອກຜູ້ຊະນະ ແລະ ປ້ອນຈຳນວນເງິນໃຫ້ຖືກຕ້ອງ",
      });
      return;
    }

    const winner = players.find((p) => p.id === selectedWinnerId);
    if (!winner) return;

    const doubledIdsForThisRound = doubledLoserIds.filter(
      (id) => id !== winner.id,
    );

    setIsRecordingRound(true); // NEW
    try {
      await recordTurnToFirestore(
        selectedGameId,
        winner,
        players,
        amount,
        doubledIdsForThisRound,
      );
      setRoundAmountDisplay("");
      setSelectedWinnerId("");
      setDoubledLoserIds([]);
      setSuccessMessage("ບັນທຶກຕານີ້ສຳເລັດ!");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ບັນທຶກບໍ່ສຳເລັດ",
        text: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ, ກະລຸນາລອງໃໝ່",
      });
    } finally {
      setIsRecordingRound(false); // NEW — runs whether it succeeded or failed
    }
  };

  // Edit Turn Handlers
  const handleOpenEdit = (turn: HistoryRecord) => {
    setEditingTurn(turn);
    setEditWinnerId(turn.winnerId);
    setEditAmountDisplay(formatWithCommas(turn.amountPerLoser));
    setEditDoubledLoserIds(turn.doubledLoserIds || []);
  };

  const handleSaveEdit = async () => {
    if (!editingTurn || !selectedGameId) return;
    const amount = parseRawNumber(editAmountDisplay);
    const doubledIdsForEdit = editDoubledLoserIds.filter(
      (id) => id !== editWinnerId,
    );
    try {
      await editTurnInFirestore(
        selectedGameId,
        editingTurn.id,
        editWinnerId,
        amount,
        doubledIdsForEdit,
      );
      setEditingTurn(null);
      setSuccessMessage("ແກ້ໄຂປະຫວັດສຳເລັດ");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ແກ້ໄຂບໍ່ສຳເລັດ",
      });
    }
  };

  // Invite a friend by email so they can see (and use) this room
  const handleInviteMember = async () => {
    const email = inviteEmailInput.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
      customSwal.fire({
        icon: "warning",
        title: "ອີເມວບໍ່ຖືກຕ້ອງ",
        text: "ກະລຸນາປ້ອນອີເມວທີ່ຖືກຕ້ອງ",
      });
      return;
    }
    if (!selectedGameId) return;
    if (currentUser?.email && email === currentUser.email.toLowerCase()) {
      customSwal.fire({
        icon: "info",
        title: "ນີ້ແມ່ນອີເມວຂອງທ່ານເອງ",
        text: "ທ່ານເຂົ້າເຖິງຫ້ອງນີ້ຢູ່ແລ້ວ",
      });
      return;
    }

    try {
      await inviteMemberToGame(selectedGameId, email);
      setInviteEmailInput("");
      setSuccessMessage("ເຊີນເພື່ອນສຳເລັດ");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ເຊີນບໍ່ສຳເລັດ",
        text: "ກະລຸນາລອງໃໝ່",
      });
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!selectedGameId) return;
    try {
      await removeMemberFromGame(selectedGameId, email);
      setSuccessMessage("ລົບສະມາຊິກສຳເລັດ");
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ລົບສະມາຊິກບໍ່ສຳເລັດ",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      customSwal.fire({
        icon: "error",
        title: "ອອກຈາກລະບົບບໍ່ສຳເລັດ",
      });
    }
  };

  const currentGame = sessions.find((g) => g.id === selectedGameId) || null;
  const isOwner = Boolean(
    currentUser && currentGame && currentGame.ownerId === currentUser.uid,
  );

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.balance - a.balance),
    [players],
  );

  return {
    isSavingBalance,
    handleEditBalanceChange,
    editingPlayer,
    setEditingPlayer,
    editBalanceDisplay,
    setEditBalanceDisplay,
    handleOpenEditBalance,
    handleSaveEditBalance,
    sortedPlayers,
    isRecordingRound,
    startingBalanceDisplay,
    handleStartingBalanceChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setStartingBalanceDisplay(formatSignedWithCommas(e.target.value)),
    playerNameInput,
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
    setPlayerNameInput,
    selectedWinnerId,
    setSelectedWinnerId,
    roundAmountDisplay,
    handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setRoundAmountDisplay(formatWithCommas(e.target.value)),
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
  };
};

export default useMainController;
