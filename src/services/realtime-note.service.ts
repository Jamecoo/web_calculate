import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDocs,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export interface GameSession {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  // Lowercased emails of friends invited into this room (besides the owner).
  allowedEmails: string[];
  createdAt?: Timestamp | null;
}

export interface Player {
  id: string;
  name: string;
  balance: number;
}

export interface HistoryRecord {
  id: string;
  type?: "round" | "adjustment"; // NEW — "round" (or missing, for old data) = normal turn; "adjustment" = manual balance edit
  winnerId: string;
  winnerName: string;
  amountPerLoser: number;
  doubledLoserIds?: string[];
  totalPlayersAtTurn: number;
  createdAt?: Timestamp | null;
  // NEW — only present when type === "adjustment"
  adjustedPlayerId?: string;
  adjustedPlayerName?: string;
  previousBalance?: number;
  newBalance?: number;
}

// Only returns rooms the given user can see: rooms they own, plus rooms
// where their email has been invited. Firestore's client SDK can't OR two
// different fields in one query, so this runs two live queries and merges
// the results by room id.
//
// IMPORTANT: this filtering happens client-side for convenience. It is not
// a substitute for Firestore Security Rules — without rules that check
// request.auth.uid == resource.data.ownerId ||
// request.auth.token.email in resource.data.allowedEmails,
// a signed-in user could still read any room's data directly.
export const subscribeToGameSessions = (
  uid: string,
  email: string | null,
  callback: (games: GameSession[]) => void,
) => {
  if (!uid) return () => {};

  const gamesRef = collection(db, "games");
  const ownedQuery = query(gamesRef, where("ownerId", "==", uid));
  const normalizedEmail = (email || "").trim().toLowerCase();
  const invitedQuery = normalizedEmail
    ? query(gamesRef, where("allowedEmails", "array-contains", normalizedEmail))
    : null;

  const mapDoc = (
    d: import("firebase/firestore").QueryDocumentSnapshot,
  ): GameSession => ({
    id: d.id,
    name: d.data().name || "ບໍ່ມີຊື່",
    ownerId: d.data().ownerId || "",
    ownerEmail: d.data().ownerEmail || "",
    allowedEmails: Array.isArray(d.data().allowedEmails)
      ? d.data().allowedEmails
      : [],
  });

  let ownedGames: GameSession[] = [];
  let invitedGames: GameSession[] = [];

  const emitMerged = () => {
    const merged = new Map<string, GameSession>();
    [...ownedGames, ...invitedGames].forEach((g) => merged.set(g.id, g));
    callback(Array.from(merged.values()));
  };

  const unsubOwned = onSnapshot(
    ownedQuery,
    (snapshot) => {
      ownedGames = snapshot.docs.map(mapDoc);
      emitMerged();
    },
    (err) => console.error("Error fetching owned games:", err),
  );

  const unsubInvited = invitedQuery
    ? onSnapshot(
        invitedQuery,
        (snapshot) => {
          invitedGames = snapshot.docs.map(mapDoc);
          emitMerged();
        },
        (err) => console.error("Error fetching invited games:", err),
      )
    : () => {};

  return () => {
    unsubOwned();
    unsubInvited();
  };
};

// 2. Subscribe to Players inside selected room ('games/{gameId}/players')
export const subscribeToPlayers = (
  gameId: string,
  callback: (players: Player[]) => void,
) => {
  if (!gameId) return () => {};

  const playersRef = collection(db, "games", gameId, "players");
  return onSnapshot(
    playersRef,
    (snapshot) => {
      const list: Player[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || "",
        balance: Number(d.data().balance) || 0,
      }));
      callback(list);
    },
    (err) => console.error("Error fetching players:", err),
  );
};

export const updatePlayerBalance = async (
  gameId: string,
  playerId: string,
  newBalance: number,
) => {
  if (!gameId || !playerId) return;
  const playerRef = doc(db, "games", gameId, "players", playerId);
  await updateDoc(playerRef, { balance: newBalance });
};

// 3. Subscribe to History inside selected room ('games/{gameId}/history')
export const subscribeToHistory = (
  gameId: string,
  callback: (history: HistoryRecord[]) => void,
) => {
  if (!gameId) return () => {};

  const historyRef = collection(db, "games", gameId, "history");
  // NEW: order by createdAt descending so the latest round is always first
  const historyQuery = query(historyRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      const list: HistoryRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HistoryRecord, "id">),
      }));
      callback(list);
    },
    (err) => console.error("Error fetching history:", err),
  );
};

// 4. Create New Game Room
export const createNewGameInFirestore = async (
  name: string,
  ownerId: string,
  ownerEmail: string | null,
) => {
  const gamesRef = collection(db, "games");
  const docRef = await addDoc(gamesRef, {
    name,
    ownerId,
    ownerEmail: (ownerEmail || "").toLowerCase(),
    allowedEmails: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Invite a friend to a room by email. They'll see it in their room list the
// next time subscribeToGameSessions runs for their account (as long as they
// sign in with this same email).
export const inviteMemberToGame = async (gameId: string, email: string) => {
  if (!gameId || !email) return;
  const normalized = email.trim().toLowerCase();
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, { allowedEmails: arrayUnion(normalized) });
};

// Revoke a friend's access to a room.
export const removeMemberFromGame = async (gameId: string, email: string) => {
  if (!gameId || !email) return;
  const normalized = email.trim().toLowerCase();
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, { allowedEmails: arrayRemove(normalized) });
};

// 5. Add Player to Room
export const addPlayerToFirestore = async (
  gameId: string,
  name: string,
  startingBalance: number = 0,
) => {
  if (!gameId) return;
  const playersRef = collection(db, "games", gameId, "players");
  await addDoc(playersRef, {
    name,
    balance: startingBalance,
    createdAt: serverTimestamp(),
  });
};

// 6. Delete Player from Room
export const deletePlayerFromFirestore = async (
  gameId: string,
  playerId: string,
) => {
  if (!gameId || !playerId) return;
  const playerRef = doc(db, "games", gameId, "players", playerId);
  await deleteDoc(playerRef);
};

// Records one round. `doubledLoserIds` marks which losers pay 2x
// `amountPerLoser` instead of the normal amount; everyone else in
// `players` (other than the winner) pays the normal amount. The winner's
// balance increases by the sum of what all losers actually paid.
export const recordTurnToFirestore = async (
  gameId: string,
  winner: Player,
  players: Player[],
  amountPerLoser: number,
  doubledLoserIds: string[] = [],
) => {
  let totalWinnings = 0;

  for (const player of players) {
    if (player.id === winner.id) continue;
    const isDoubled = doubledLoserIds.includes(player.id);
    const paid = isDoubled ? amountPerLoser * 2 : amountPerLoser;
    totalWinnings += paid;

    const playerRef = doc(db, "games", gameId, "players", player.id);
    await updateDoc(playerRef, { balance: player.balance - paid });
  }

  const winnerRef = doc(db, "games", gameId, "players", winner.id);
  await updateDoc(winnerRef, { balance: winner.balance + totalWinnings });

  const historyRef = collection(db, "games", gameId, "history");
  await addDoc(historyRef, {
    winnerId: winner.id,
    winnerName: winner.name,
    amountPerLoser,
    doubledLoserIds,
    totalPlayersAtTurn: players.length,
    createdAt: serverTimestamp(),
  });
};

// 4. Edit Game Turn & Recalculate Balances Realtime
export const editTurnInFirestore = async (
  gameId: string,
  turnId: string,
  newWinnerId: string,
  newAmountPerLoser: number,
  newDoubledLoserIds: string[] = [],
) => {
  // Update turn record
  const turnRef = doc(db, "games", gameId, "history", turnId);
  const playersRef = collection(db, "games", gameId, "players");
  const playersSnap = await getDocs(playersRef);

  const playersList = playersSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));
  const newWinner = playersList.find((p) => p.id === newWinnerId);

  await updateDoc(turnRef, {
    winnerId: newWinnerId,
    winnerName: newWinner?.name || "Unknown",
    amountPerLoser: newAmountPerLoser,
    doubledLoserIds: newDoubledLoserIds,
  });

  // Re-sync all balances from history log
  await recalculateAllBalances(gameId);
};

// Helper: Recalculates total balances across all turns to ensure accurate math after edits
const recalculateAllBalances = async (gameId: string) => {
  const playersSnap = await getDocs(collection(db, "games", gameId, "players"));
  const historySnap = await getDocs(collection(db, "games", gameId, "history"));

  const balanceMap: Record<string, number> = {};
  playersSnap.docs.forEach((doc) => {
    balanceMap[doc.id] = 0;
  });

  historySnap.docs.forEach((doc) => {
    const data = doc.data();
    const amount = data.amountPerLoser || 0;
    const winnerId = data.winnerId;
    const doubledLoserIds: string[] = Array.isArray(data.doubledLoserIds)
      ? data.doubledLoserIds
      : [];

    let totalWinnings = 0;
    Object.keys(balanceMap).forEach((pId) => {
      if (pId === winnerId) return;
      const paid = doubledLoserIds.includes(pId) ? amount * 2 : amount;
      balanceMap[pId] -= paid;
      totalWinnings += paid;
    });

    if (Object.prototype.hasOwnProperty.call(balanceMap, winnerId)) {
      balanceMap[winnerId] += totalWinnings;
    }
  });

  for (const [pId, newBalance] of Object.entries(balanceMap)) {
    const playerRef = doc(db, "games", gameId, "players", pId);
    await updateDoc(playerRef, { balance: newBalance });
  }
};

export const updatePlayerBalanceWithHistory = async (
  gameId: string,
  playerId: string,
  playerName: string,
  previousBalance: number,
  newBalance: number,
) => {
  if (!gameId || !playerId) return;

  const playerRef = doc(db, "games", gameId, "players", playerId);
  await updateDoc(playerRef, { balance: newBalance });

  const historyRef = collection(db, "games", gameId, "history");
  await addDoc(historyRef, {
    type: "adjustment",
    adjustedPlayerId: playerId,
    adjustedPlayerName: playerName,
    previousBalance,
    newBalance,
    // These fields exist on every HistoryRecord for type compatibility with
    // "round" entries, but aren't meaningful for an adjustment.
    winnerId: "",
    winnerName: "",
    amountPerLoser: 0,
    totalPlayersAtTurn: 0,
    createdAt: serverTimestamp(),
  });
};
