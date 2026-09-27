import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import useAuth from "../../../context/auth";
import { EXPENSE_CATEGORIES, getCategory } from "../../../constants/categories";
import type { Purchase, UserShare } from "../../../model/calculateModel";

interface UserCost {
  userName: string;
  totalPaid: number;
  totalConsumed: number;
  tripCount: number;
}

// What the money went ON, as opposed to who spent it.
export interface CategoryCost {
  id: string;
  label: string;
  emoji: string;
  color: string;
  total: number;
  count: number;
}

interface CostSummary {
  totalAmount: number;
  userCosts: UserCost[];
  categoryCosts: CategoryCost[];
  tripCount: number;
}

const getWeekRange = (weeksAgo: number = 0) => {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayOffset - weeksAgo * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

const getMonthRange = (monthsAgo: number = 0) => {
  const now = new Date();
  const targetMonth = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo,
    1,
  );

  const startOfMonth = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    1,
  );
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0,
  );
  endOfMonth.setHours(23, 59, 59, 999);

  return { start: startOfMonth, end: endOfMonth };
};

const formatDateRange = (start: Date, end: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-GB", options)} - ${end.toLocaleDateString("en-GB", options)}`;
};

const formatMonthYear = (date: Date) => {
  const months = [
    "ມັງກອນ",
    "ກຸມພາ",
    "ມີນາ",
    "ເມສາ",
    "ພຶດສະພາ",
    "ມິຖຸນາ",
    "ກໍລະກົດ",
    "ສິງຫາ",
    "ກັນຍາ",
    "ຕຸລາ",
    "ພະຈິກ",
    "ທັນວາ",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const useCostReportController = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [splits, setSplits] = useState<any[]>([]);
  const [reportType, setReportType] = useState<"week" | "month">("week");
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, 1 = last, etc.

  // Fetch all splits for the user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "user_splits"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSplits(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching splits:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  // Calculate date range based on report type and offset
  const dateRange = useMemo(() => {
    if (reportType === "week") {
      return getWeekRange(periodOffset);
    } else {
      return getMonthRange(periodOffset);
    }
  }, [reportType, periodOffset]);

  // Filter splits within the date range
  const filteredSplits = useMemo(() => {
    return splits.filter((split) => {
      if (!split.timestamp) return false;
      const splitDate = split.timestamp.toDate
        ? split.timestamp.toDate()
        : new Date(split.timestamp);
      return splitDate >= dateRange.start && splitDate <= dateRange.end;
    });
  }, [splits, dateRange]);

  // Calculate cost summary
  const costSummary: CostSummary = useMemo(() => {
    const userMap = new Map<string, UserCost>();

    filteredSplits.forEach((split) => {
      (split.users || []).forEach((u: any) => {
        const key = u.userName;
        const existing = userMap.get(key) || {
          userName: u.userName,
          totalPaid: 0,
          totalConsumed: 0,
          tripCount: 0,
        };

        // Calculate paid amount (sum of purchases)
        const paidAmount = (u.purchases || []).reduce(
          (sum: number, p: any) => sum + (p.amount || 0),
          0,
        );

        // Calculate consumed amount
        const consumedAmount = u.consumed ?? 0;

        existing.totalPaid += paidAmount;
        existing.totalConsumed += consumedAmount;
        existing.tripCount += 1;

        userMap.set(key, existing);
      });
    });

    const userCosts = Array.from(userMap.values()).sort(
      (a, b) => b.totalConsumed - a.totalConsumed,
    );

    // Category totals come straight off the purchases, so every kip is counted
    // once no matter how it was shared out.
    const categoryTotals = new Map<string, { total: number; count: number }>();
    filteredSplits.forEach((split) => {
      (split.users || []).forEach((u: UserShare) => {
        (u.purchases || []).forEach((p: Purchase) => {
          const id = getCategory(p.category).id;
          const entry = categoryTotals.get(id) || { total: 0, count: 0 };
          entry.total += p.amount || 0;
          entry.count += 1;
          categoryTotals.set(id, entry);
        });
      });
    });

    const categoryCosts: CategoryCost[] = EXPENSE_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      color: c.color,
      total: categoryTotals.get(c.id)?.total ?? 0,
      count: categoryTotals.get(c.id)?.count ?? 0,
    }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.total - a.total);

    const totalAmount = userCosts.reduce((sum, u) => sum + u.totalConsumed, 0);

    return {
      totalAmount,
      userCosts,
      categoryCosts,
      tripCount: filteredSplits.length,
    };
  }, [filteredSplits]);

  // Period label
  const periodLabel = useMemo(() => {
    if (reportType === "week") {
      if (periodOffset === 0) return "ອາທິດນີ້";
      if (periodOffset === 1) return "ອາທິດກ່ອນ";
      return `${periodOffset} ອາທິດກ່ອນ`;
    } else {
      if (periodOffset === 0) return "ເດືອນນີ້";
      if (periodOffset === 1) return "ເດືອນກ່ອນ";
      return `${periodOffset} ເດືອນກ່ອນ`;
    }
  }, [reportType, periodOffset]);

  const dateRangeLabel = useMemo(() => {
    if (reportType === "week") {
      return formatDateRange(dateRange.start, dateRange.end);
    } else {
      return formatMonthYear(dateRange.start);
    }
  }, [reportType, dateRange]);

  const goToPreviousPeriod = () => {
    setPeriodOffset((prev) => prev + 1);
  };

  const goToNextPeriod = () => {
    setPeriodOffset((prev) => Math.max(0, prev - 1));
  };

  const goToCurrentPeriod = () => {
    setPeriodOffset(0);
  };

  return {
    loading,
    reportType,
    setReportType,
    periodOffset,
    periodLabel,
    dateRangeLabel,
    costSummary,
    filteredSplits,
    goToPreviousPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
  };
};

export default useCostReportController;
