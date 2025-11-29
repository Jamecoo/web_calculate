import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import Swal from "sweetalert2";

const useHistoryController = () => {
  const [splitHistory, setSplitHistory] = useState<any[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
    const [tabValue, setTabValue] = useState<number>(0);
    const [detailDialog, setDetailDialog] = useState<boolean>(false);
    const [selectedSplit, setSelectedSplit] = useState<any>(null);
  
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
      // Dialog stays open to allow multiple updates
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
    const splitQuery = query(
      collection(db, "user_splits"),
      orderBy("timestamp", "desc")
    );

    const unsubscribeSplit = onSnapshot(
      splitQuery,
      (snapshot) => {
        const splits = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSplitHistory(splits);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching split history:", err);
        setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການແບ່ງຜູ້ໃຊ້ໄດ້");
        setLoading(false);
      }
    );

    // Fetch calculation history
    const calcQuery = query(
      collection(db, "calculation_history"),
      orderBy("timestamp", "desc")
    );

    const unsubscribeCalc = onSnapshot(
      calcQuery,
      (snapshot) => {
        const calcs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCalculationHistory(calcs);
      },
      (err) => {
        console.error("Error fetching calculation history:", err);
        setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການຄິດໄລ່ໄດ້");
      }
    );

    return () => {
      unsubscribeSplit();
      unsubscribeCalc();
    };
  }, []);

  const updateUserPaymentStatus = async (
    splitId: string,
    userId: string,
    isPaid: boolean
  ) => {
    handleCloseDialog();
    try {
      const split = splitHistory.find((s) => s.id === splitId);
      if (!split) return false;

      const updatedUsers = split.users.map((user: any) =>
        user.userId === userId ? { ...user, isPaid } : user
      );

      await updateDoc(doc(db, "user_splits", splitId), {
        users: updatedUsers,
      });

      await Swal.fire({
        icon: "success",
        title: "ສຳເລັດ",
        text: isPaid ? "ອັບເດດສະຖານະເປັນຈ່າຍແລ້ວ" : "ຍົກເລີກການຈ່າຍແລ້ວ",
        timer: 1500,
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
    handleDeleteHistory
  };
};

export default useHistoryController;
