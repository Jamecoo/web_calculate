import { useState, useEffect, useMemo, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { db } from "../../../firebase";
import Swal from "sweetalert2";
import useAuth from "../../../context/auth";
import { uploadTripSlip } from "../../../services/auth.services";
import {
  computeUserTotals,
  calculateSettlements,
} from "../../../utils/splitCalculations";
import {
  getTripInvite,
  upsertTripInvite,
  deleteTripInvite,
} from "../../../services/trips.service";
import { DEFAULT_CATEGORY_ID } from "../../../constants/categories";

const tsMillis = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return 0;
};

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const useHistoryController = () => {
  const { user, isAdmin } = useAuth();
  const email = (user?.email || "").toLowerCase();
  const [searchParams, setSearchParams] = useSearchParams();

  const [ownedSplits, setOwnedSplits] = useState<any[]>([]);
  const [sharedSplits, setSharedSplits] = useState<any[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [tabValue, setTabValue] = useState<number>(0);
  const [detailDialog, setDetailDialog] = useState<boolean>(false);
  const [selectedSplit, setSelectedSplit] = useState<any>(null);

  // Handle join link from QR code.
  //
  // The trip document itself is readable only by its owner and members, so the
  // preview shown here comes from the public `trip_invites` record. Joining is
  // a self-join write: the rules let a signed-in user add their own email to
  // memberEmails and change nothing else.
  const joinHandledRef = useRef<string | null>(null);

  useEffect(() => {
    const joinTripId = searchParams.get("join");
    if (!joinTripId || !user || !email) return;
    if (joinHandledRef.current === joinTripId) return;
    joinHandledRef.current = joinTripId;

    const handleJoinTrip = async () => {
      try {
        const invite = await getTripInvite(joinTripId);

        if (!invite) {
          await Swal.fire({
            icon: "error",
            title: "ບໍ່ພົບທຮິບ",
            text: "ລິ້ງທຮິບນີ້ບໍ່ຖືກຕ້ອງ ຫຼື ຖືກລຶບແລ້ວ",
            confirmButtonText: "ຕົກລົງ",
          });
          setSearchParams({});
          return;
        }

        // Already the owner.
        if (invite.ownerId === user.uid) {
          await Swal.fire({
            icon: "info",
            title: "ທ່ານເປັນເຈົ້າຢອງທຮິບນີ້",
            text: invite.tripName || "ທຮິບ",
            confirmButtonText: "ຕົກລົງ",
          });
          setSearchParams({});
          return;
        }

        // Already a member: the trip is already in the live shared list.
        if (sharedSplits.some((t) => t.id === joinTripId)) {
          await Swal.fire({
            icon: "info",
            title: "ທ່ານຢູ່ໃນທຮິບນີ້ແລ້ວ",
            text: invite.tripName || "ທຮິບ",
            confirmButtonText: "ຕົກລົງ",
          });
          setSearchParams({});
          return;
        }

        const result = await Swal.fire({
          icon: "question",
          title: "ເຂົ້າຮ່ວມທຮິບ?",
          html: `ທ່ານຕ້ອງການເຂົ້າຮ່ວມທຮິບ <strong>${invite.tripName || "ທຮິບ"}</strong> ບໍ່?`,
          showCancelButton: true,
          confirmButtonText: "ເຂົ້າຮ່ວມ",
          cancelButtonText: "ຢົກເລີກ",
        });

        if (result.isConfirmed) {
          await updateDoc(doc(db, "user_splits", joinTripId), {
            memberEmails: arrayUnion(email),
          });
          await Swal.fire({
            icon: "success",
            title: "ເຂົ້າຮ່ວມສໍາເລັບ!",
            text: `ທ່ານເຂົ້າຮ່ວມທຮິບ "${invite.tripName || "ທຮິບ"}" ແລ້ວ`,
            timer: 2000,
            showConfirmButton: false,
          });
        }

        setSearchParams({});
      } catch (err) {
        console.error("Error joining trip:", err);
        await Swal.fire({
          icon: "error",
          title: "ຂໍ້ຜິດພາດ",
          text: "ບໍ່ສາມາດເຂົ້າຮ່ວມທຮິບໄດ້",
          confirmButtonText: "ຕົກລົງ",
        });
        setSearchParams({});
      }
    };

    handleJoinTrip();
  }, [searchParams, user, email, setSearchParams, sharedSplits]);

  // Merge owned + shared trips, de-duped by id, pinned first then newest.
  const splitHistory = useMemo(() => {
    const byId = new Map<string, any>();
    [...ownedSplits, ...sharedSplits].forEach((s) => byId.set(s.id, s));
    return Array.from(byId.values()).sort((a, b) => {
      // Pinned trips come first
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      // Then sort by timestamp (newest first)
      return tsMillis(b.timestamp) - tsMillis(a.timestamp);
    });
  }, [ownedSplits, sharedSplits]);

  // Keep the open detail dialog in sync with live document updates.
  useEffect(() => {
    setSelectedSplit((prev: any) =>
      prev ? splitHistory.find((s) => s.id === prev.id) || prev : prev
    );
  }, [splitHistory]);

  const handleViewDetails = (split: any) => {
    setSelectedSplit(split);
    setDetailDialog(true);
  };

  const handleCloseDialog = () => {
    setDetailDialog(false);
    setSelectedSplit(null);
  };

  const handleTogglePayment = async (
    splitId: string,
    userId: string,
    currentStatus: boolean
  ) => {
    await updateUserPaymentStatus(splitId, userId, !currentStatus);
    // Dialog stays open (it re-syncs from live data) to allow multiple updates.
  };

  const handleDeleteHistory = async (
    id: string,
    type: "split" | "calculation"
  ) => {
    const result = await deleteHistory(id, type);
    if (result) {
      handleCloseDialog();
    }
  };

  useEffect(() => {
    if (!user) {
      setOwnedSplits([]);
      setSharedSplits([]);
      setCalculationHistory([]);
      setLoading(false);
      return;
    }

    const sortByNewest = (docs: any[]) =>
      docs.sort((a, b) => tsMillis(b.timestamp) - tsMillis(a.timestamp));
    const mapDocs = (snapshot: any) =>
      snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const unsubscribers: Array<() => void> = [];

    if (isAdmin) {
      // Admins see everyone's trips and calculations.
      unsubscribers.push(
        onSnapshot(
          query(collection(db, "user_splits")),
          (snap) => {
            setOwnedSplits(mapDocs(snap));
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching split history:", err);
            setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການຫານກັບໝູ່ໄດ້");
            setLoading(false);
          }
        )
      );
      setSharedSplits([]);
    } else {
      // Own trips.
      unsubscribers.push(
        onSnapshot(
          query(collection(db, "user_splits"), where("userId", "==", user.uid)),
          (snap) => {
            setOwnedSplits(mapDocs(snap));
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching owned trips:", err);
            setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການຫານກັບໝູ່ໄດ້");
            setLoading(false);
          }
        )
      );
      // Trips shared with me (my email is in memberEmails).
      if (email) {
        unsubscribers.push(
          onSnapshot(
            query(
              collection(db, "user_splits"),
              where("memberEmails", "array-contains", email)
            ),
            (snap) => {
              console.log("Shared trips loaded:", snap.docs.length);
              setSharedSplits(mapDocs(snap));
            },
            (err) => {
              console.error("Error fetching shared trips:", err);
              // Don't show error UI, just log it - shared trips are optional
            }
          )
        );
      }
    }

    // Calculation history: admins see all, users see their own.
    const calcQuery = isAdmin
      ? query(collection(db, "calculation_history"))
      : query(
          collection(db, "calculation_history"),
          where("userId", "==", user.uid)
        );
    unsubscribers.push(
      onSnapshot(
        calcQuery,
        (snap) => setCalculationHistory(sortByNewest(mapDocs(snap))),
        (err) => {
          console.error("Error fetching calculation history:", err);
          setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການຄິດໄລ່ໄດ້");
        }
      )
    );

    return () => unsubscribers.forEach((u) => u());
  }, [user, isAdmin, email]);

  const updateUserPaymentStatus = async (
    splitId: string,
    userId: string,
    isPaid: boolean
  ) => {
    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      const updatedUsers = split.users.map((u: any) =>
        u.userId === userId ? { ...u, isPaid } : u
      );

      await updateDoc(doc(db, "user_splits", splitId), {
        users: updatedUsers,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: isPaid ? "ອັບເດດສະຖານະເປັນຈ່າຍແລ້ວ" : "ຍົກເລີກການຈ່າຍແລ້ວ",
        timer: 1200,
        showConfirmButton: false,
      });

      return true;
    } catch (err) {
      console.error("Error updating payment status:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດອັບເດດສະຖານະໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Publish (or refresh) the public preview a share link resolves against.
  // Trips created before invites existed get one the first time their owner
  // opens the QR dialog, so old links keep working.
  const ensureTripInvite = async (splitId: string, tripName?: string) => {
    const split = splitHistory.find((s) => s.id === splitId);
    if (!split || !user) return false;
    if (split.userId !== user.uid) return false; // only the owner may write it

    try {
      await upsertTripInvite({
        tripId: splitId,
        tripName: (tripName ?? split.tripName ?? "").trim() || "ທຮິບ",
        ownerId: split.userId,
        ownerName: split.userName || split.userEmail || "",
        ownerEmail: split.userEmail || "",
        memberCount: (split.users || []).length,
      });
      return true;
    } catch (err) {
      console.error("Error publishing trip invite:", err);
      return false;
    }
  };

  // Owner-only: invite a member by email.
  const addMember = async (splitId: string, rawEmail: string) => {
    const memberEmail = rawEmail.trim().toLowerCase();
    if (!isValidEmail(memberEmail)) {
      await Swal.fire({
        icon: "warning",
        title: "ແຈ້ງເຕືອນ",
        text: "ກະລຸນາປ້ອນອີເມວທີ່ຖືກຕ້ອງ",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
    if (memberEmail === email) {
      await Swal.fire({
        icon: "info",
        title: "ແຈ້ງເຕືອນ",
        text: "ນີ້ແມ່ນອີເມວຂອງທ່ານເອງ",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
    try {
      await updateDoc(doc(db, "user_splits", splitId), {
        memberEmails: arrayUnion(memberEmail),
      });
      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: `ເພີ່ມ ${memberEmail} ເຂົ້າທຣິບແລ້ວ`,
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error adding member:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດເພີ່ມສະມາຊິກໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner-only: remove a member.
  const removeMember = async (splitId: string, memberEmail: string) => {
    try {
      await updateDoc(doc(db, "user_splits", splitId), {
        memberEmails: arrayRemove(memberEmail),
      });
      return true;
    } catch (err) {
      console.error("Error removing member:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດລົບສະມາຊິກໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner or member: append a bill to an existing trip, then recompute.
  const addExpenseToSplit = async (
    splitId: string,
    payerUserId: string,
    itemName: string,
    amount: number,
    consumerIds: string[],
    category: string = DEFAULT_CATEGORY_ID
  ) => {
    if (!itemName.trim() || amount <= 0 || consumerIds.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "ແຈ້ງເຕືອນ",
        text: "ກະລຸນາປ້ອນຂໍ້ມູນລາຍຈ່າຍໃຫ້ຄົບຖ້ວນ",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      const newPurchase = {
        id: `purchase_${Date.now()}`,
        itemName: itemName.trim(),
        amount,
        consumers: consumerIds,
        category,
        timestamp: new Date(),
      };

      const usersWithPurchase = split.users.map((u: any) =>
        u.userId === payerUserId
          ? { ...u, purchases: [...(u.purchases || []), newPurchase] }
          : u
      );

      const recomputed = computeUserTotals(usersWithPurchase);
      const settlements = calculateSettlements(recomputed);
      const totalAmount = recomputed.reduce(
        (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
        0
      );
      const perUserAmount = recomputed.length
        ? totalAmount / recomputed.length
        : 0;

      await updateDoc(doc(db, "user_splits", splitId), {
        users: recomputed,
        settlements,
        totalAmount,
        perUserAmount,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ເພີ່ມລາຍຈ່າຍເຂົ້າທຣິບແລ້ວ",
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error adding expense:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດເພີ່ມລາຍຈ່າຍໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner or member: upload a payment-slip image to the trip.
  const addSlip = async (splitId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ຮູບພາບຕ້ອງນ້ອຍກວ່າ 10MB",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
    try {
      const slipId = `slip_${Date.now()}`;
      const imageUrl = await uploadTripSlip(splitId, slipId, file);
      const slip = {
        id: slipId,
        imageUrl,
        uploadedByEmail: email,
        timestamp: new Date(),
      };
      await updateDoc(doc(db, "user_splits", splitId), {
        slips: arrayUnion(slip),
      });
      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ອັບໂຫຼດສະລິບແລ້ວ",
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error uploading slip:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດອັບໂຫຼດສະລິບໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner: add a new participant to an existing trip
  const addParticipant = async (splitId: string, participantName: string) => {
    const name = participantName.trim();
    if (!name) {
      await Swal.fire({
        icon: "warning",
        title: "ແຈ້ງເຕືອນ",
        text: "ກະລຸນາປ້ອນຊື່ຜູ້ເຂົ້າຮ່ວມ",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }

    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      // Check if name already exists
      const nameExists = split.users.some(
        (u: any) => u.userName.toLowerCase() === name.toLowerCase()
      );
      if (nameExists) {
        await Swal.fire({
          icon: "warning",
          title: "ແຈ້ງເຕືອນ",
          text: "ຊື່ນີ້ມີຢູ່ໃນທຣິບແລ້ວ",
          confirmButtonText: "ຕົກລົງ",
        });
        return false;
      }

      // Create new participant
      const newParticipant = {
        odooId: `local_${Date.now()}`,
        odooName: name,
        odooMobilePhone: null,
        userId: `user_${Date.now()}`,
        userName: name,
        purchases: [],
        isPaid: false,
      };

      const updatedUsers = [...split.users, newParticipant];
      const recomputed = computeUserTotals(updatedUsers);
      const settlements = calculateSettlements(recomputed);
      const totalAmount = recomputed.reduce(
        (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
        0
      );
      const perUserAmount = recomputed.length
        ? totalAmount / recomputed.length
        : 0;

      await updateDoc(doc(db, "user_splits", splitId), {
        users: recomputed,
        settlements,
        totalAmount,
        perUserAmount,
        totalUsers: recomputed.length,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: `ເພີ່ມ "${name}" ເຂົ້າທຣິບແລ້ວ`,
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error adding participant:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດເພີ່ມຜູ້ເຂົ້າຮ່ວມໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner: remove a participant from the trip
  const removeParticipant = async (splitId: string, participantUserId: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ຢືນຢັນການລົບ",
      text: "ທ່ານຕ້ອງການລົບຜູ້ເຂົ້າຮ່ວມນີ້ບໍ່? ລາຍຈ່າຍຂອງພວກເຂົາຈະຖືກລົບນຳ",
      showCancelButton: true,
      confirmButtonText: "ລົບ",
      cancelButtonText: "ຍົກເລີກ",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return false;

    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      // Cannot remove if only 1 or 2 participants
      if (split.users.length <= 2) {
        await Swal.fire({
          icon: "warning",
          title: "ແຈ້ງເຕືອນ",
          text: "ຕ້ອງມີຢ່າງໜ້ອຍ 2 ຄົນໃນທຣິບ",
          confirmButtonText: "ຕົກລົງ",
        });
        return false;
      }

      const updatedUsers = split.users.filter(
        (u: any) => u.userId !== participantUserId
      );

      // Also remove this participant from all expenses' consumers
      const cleanedUsers = updatedUsers.map((u: any) => ({
        ...u,
        purchases: (u.purchases || []).map((p: any) => ({
          ...p,
          consumers: (p.consumers || []).filter(
            (c: string) => c !== participantUserId
          ),
        })),
      }));

      const recomputed = computeUserTotals(cleanedUsers);
      const settlements = calculateSettlements(recomputed);
      const totalAmount = recomputed.reduce(
        (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
        0
      );
      const perUserAmount = recomputed.length
        ? totalAmount / recomputed.length
        : 0;

      await updateDoc(doc(db, "user_splits", splitId), {
        users: recomputed,
        settlements,
        totalAmount,
        perUserAmount,
        totalUsers: recomputed.length,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ລົບຜູ້ເຂົ້າຮ່ວມແລ້ວ",
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error removing participant:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດລົບຜູ້ເຂົ້າຮ່ວມໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner: update trip name
  const updateTripName = async (splitId: string, newName: string) => {
    try {
      await updateDoc(doc(db, "user_splits", splitId), {
        tripName: newName.trim(),
      });
      await ensureTripInvite(splitId, newName.trim());
      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ແກ້ໄຂຊື່ທຣິບແລ້ວ",
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error updating trip name:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດແກ້ໄຂຊື່ທຣິບໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner: edit an expense in a trip
  const editExpense = async (
    splitId: string,
    userId: string,
    purchaseId: string,
    newItemName: string,
    newAmount: number,
    newConsumerIds: string[],
    category: string = DEFAULT_CATEGORY_ID
  ) => {
    if (!newItemName.trim() || newAmount <= 0 || newConsumerIds.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "ແຈ້ງເຕືອນ",
        text: "ກະລຸນາປ້ອນຂໍ້ມູນລາຍຈ່າຍໃຫ້ຄົບຖ້ວນ",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      const usersWithEditedPurchase = split.users.map((u: any) =>
        u.userId === userId
          ? {
              ...u,
              purchases: (u.purchases || []).map((p: any) =>
                p.id === purchaseId
                  ? {
                      ...p,
                      itemName: newItemName.trim(),
                      amount: newAmount,
                      consumers: newConsumerIds,
                      category,
                    }
                  : p
              ),
            }
          : u
      );

      const recomputed = computeUserTotals(usersWithEditedPurchase);
      const settlements = calculateSettlements(recomputed);
      const totalAmount = recomputed.reduce(
        (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
        0
      );
      const perUserAmount = recomputed.length
        ? totalAmount / recomputed.length
        : 0;

      await updateDoc(doc(db, "user_splits", splitId), {
        users: recomputed,
        settlements,
        totalAmount,
        perUserAmount,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ແກ້ໄຂລາຍຈ່າຍແລ້ວ",
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error editing expense:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດແກ້ໄຂລາຍຈ່າຍໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Owner: delete an expense from a trip
  const deleteExpense = async (
    splitId: string,
    userId: string,
    purchaseId: string
  ) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ຢືນຢັນການລົບ",
      text: "ທ່ານຕ້ອງການລົບລາຍຈ່າຍນີ້ບໍ່?",
      showCancelButton: true,
      confirmButtonText: "ລົບ",
      cancelButtonText: "ຍົກເລີກ",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return false;

    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      const usersWithDeletedPurchase = split.users.map((u: any) =>
        u.userId === userId
          ? {
              ...u,
              purchases: (u.purchases || []).filter(
                (p: any) => p.id !== purchaseId
              ),
            }
          : u
      );

      const recomputed = computeUserTotals(usersWithDeletedPurchase);
      const settlements = calculateSettlements(recomputed);
      const totalAmount = recomputed.reduce(
        (sum, u) => sum + u.purchases.reduce((s, p) => s + p.amount, 0),
        0
      );
      const perUserAmount = recomputed.length
        ? totalAmount / recomputed.length
        : 0;

      await updateDoc(doc(db, "user_splits", splitId), {
        users: recomputed,
        settlements,
        totalAmount,
        perUserAmount,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ລົບລາຍຈ່າຍແລ້ວ",
        timer: 1400,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      console.error("Error deleting expense:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດລົບລາຍຈ່າຍໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  const deleteHistory = async (id: string, type: "split" | "calculation") => {
    handleCloseDialog();
    const result = await Swal.fire({
      icon: "warning",
      title: "ຢືນຢັນການລົບ",
      text: "ທ່ານຕ້ອງການລົບປະຫວັດນີ້ບໍ່?",
      showCancelButton: true,
      confirmButtonText: "ລົບ",
      cancelButtonText: "ຍົກເລີກ",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return false;

    try {
      const collectionName =
        type === "split" ? "user_splits" : "calculation_history";
      await deleteDoc(doc(db, collectionName, id));
      if (type === "split") {
        // The public invite outlives the trip otherwise.
        await deleteTripInvite(id).catch((err) =>
          console.error("Error deleting trip invite:", err)
        );
      }

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: "ລົບປະຫວັດສຳເລັດແລ້ວ",
        timer: 1500,
        showConfirmButton: false,
      });

      return true;
    } catch (err) {
      console.error("Error deleting history:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດລົບປະຫວັດໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  // Toggle pin/favorite status for a trip
  const togglePinTrip = async (splitId: string) => {
    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return;

      const newPinStatus = !split.isPinned;
      await updateDoc(doc(db, "user_splits", splitId), {
        isPinned: newPinStatus,
      });

      return true;
    } catch (err) {
      console.error("Error toggling pin:", err);
      await Swal.fire({
        icon: "error",
        title: "ຂໍ້ຜິດພາດ",
        text: "ບໍ່ສາມາດປິນທຣິບໄດ້",
        confirmButtonText: "ຕົກລົງ",
      });
      return false;
    }
  };

  return {
    tabValue,
    setTabValue,
    detailDialog,
    setDetailDialog,
    selectedSplit,
    handleViewDetails,
    handleCloseDialog,
    handleTogglePayment,
    splitHistory,
    calculationHistory,
    loading,
    error,
    updateUserPaymentStatus,
    deleteHistory,
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
  };
};

export default useHistoryController;
