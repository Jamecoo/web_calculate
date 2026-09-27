import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import useAuth from "../../../context/auth";
import {
  computeUserTotals,
  calculateSettlements,
} from "../../../utils/splitCalculations";
import type { UserShare } from "../../../model/calculateModel";
import type { DocumentData, QuerySnapshot, Timestamp } from "firebase/firestore";

// The shape of a trip document as this page reads it.
interface TripDoc {
  id: string;
  tripName?: string;
  timestamp?: Timestamp;
  users?: (UserShare & { isPaid?: boolean })[];
}

// Cross-trip balances.
//
// Settlements are worked out per trip, which is fine for one dinner but hides
// the thing people actually want to know: "after everything we have done
// together, who owes who?" This nets every unsettled trip into a single figure
// per pair of people, so three trips where A owes B and one where B owes A come
// out as one transfer.
//
// People are matched by the name typed into the trip, because that is the only
// identity a participant has — someone spelled two ways is two people here.

export interface TripContribution {
  tripId: string;
  tripName: string;
  amount: number; // signed against the pair's direction
  timestamp: number;
}

export interface PairBalance {
  key: string;
  from: string; // pays
  to: string; // receives
  amount: number;
  trips: TripContribution[];
}

export interface PersonBalance {
  name: string;
  owes: number; // total this person still has to hand over
  isOwed: number; // total still coming to them
  net: number; // owes - isOwed  (>0 => net debtor)
}

const tsMillis = (ts?: Timestamp): number => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
};

const useBalancesController = () => {
  const { user } = useAuth();
  const email = (user?.email || "").toLowerCase();

  const [ownedSplits, setOwnedSplits] = useState<TripDoc[]>([]);
  const [sharedSplits, setSharedSplits] = useState<TripDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Trips where everybody has been ticked off as paid add nothing but noise.
  const [includeSettled, setIncludeSettled] = useState(false);

  useEffect(() => {
    if (!user) {
      setOwnedSplits([]);
      setSharedSplits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const mapDocs = (snap: QuerySnapshot<DocumentData>): TripDoc[] =>
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TripDoc);
    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(
      onSnapshot(
        query(collection(db, "user_splits"), where("userId", "==", user.uid)),
        (snap) => {
          setOwnedSplits(mapDocs(snap));
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching trips for balances:", err);
          setError("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນທຣິບໄດ້");
          setLoading(false);
        }
      )
    );

    if (email) {
      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, "user_splits"),
            where("memberEmails", "array-contains", email)
          ),
          (snap) => setSharedSplits(mapDocs(snap)),
          (err) => console.error("Error fetching shared trips:", err)
        )
      );
    }

    return () => unsubscribers.forEach((u) => u());
  }, [user, email]);

  const trips = useMemo(() => {
    const byId = new Map<string, TripDoc>();
    [...ownedSplits, ...sharedSplits].forEach((t) => byId.set(t.id, t));
    return Array.from(byId.values());
  }, [ownedSplits, sharedSplits]);

  const { pairs, people, tripsCounted } = useMemo(() => {
    const pairMap = new Map<string, PairBalance>();
    let counted = 0;

    trips.forEach((trip) => {
      const users: (UserShare & { isPaid?: boolean })[] = computeUserTotals(
        trip.users || []
      );
      if (users.length === 0) return;

      const paidOff = new Set(
        users.filter((u) => u.isPaid).map((u) => u.userName)
      );
      const settlements = calculateSettlements(users).filter(
        (s) => includeSettled || !paidOff.has(s.from)
      );
      if (settlements.length === 0) return;

      counted += 1;
      const when = tsMillis(trip.timestamp);

      settlements.forEach((s) => {
        // One key per unordered pair; the sign carries the direction.
        const [a, b] = [s.from, s.to].sort();
        const key = JSON.stringify([a, b]);
        const signed = s.from === a ? s.amount : -s.amount;

        const existing = pairMap.get(key);
        if (existing) {
          existing.amount += signed;
          existing.trips.push({
            tripId: trip.id,
            tripName: trip.tripName || "ທຣິບບໍ່ມີຊື່",
            amount: signed,
            timestamp: when,
          });
        } else {
          pairMap.set(key, {
            key,
            from: a,
            to: b,
            amount: signed,
            trips: [
              {
                tripId: trip.id,
                tripName: trip.tripName || "ທຣິບບໍ່ມີຊື່",
                amount: signed,
                timestamp: when,
              },
            ],
          });
        }
      });
    });

    // Flip any pair whose net went negative so `from` always pays `to`, and
    // re-sign each trip with it: a positive contribution now always means
    // "this trip pushed the balance in the direction shown".
    const pairs: PairBalance[] = Array.from(pairMap.values())
      .map((p) => {
        if (p.amount >= 0) return p;
        return {
          ...p,
          from: p.to,
          to: p.from,
          amount: -p.amount,
          trips: p.trips.map((t) => ({ ...t, amount: -t.amount })),
        };
      })
      .filter((p) => p.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    pairs.forEach((p) =>
      p.trips.sort((a, b) => b.timestamp - a.timestamp)
    );

    const personMap = new Map<string, PersonBalance>();
    const bump = (name: string, owes: number, isOwed: number) => {
      const entry = personMap.get(name) || {
        name,
        owes: 0,
        isOwed: 0,
        net: 0,
      };
      entry.owes += owes;
      entry.isOwed += isOwed;
      entry.net = entry.owes - entry.isOwed;
      personMap.set(name, entry);
    };
    pairs.forEach((p) => {
      bump(p.from, p.amount, 0);
      bump(p.to, 0, p.amount);
    });

    const people = Array.from(personMap.values()).sort(
      (a, b) => b.net - a.net
    );

    return { pairs, people, tripsCounted: counted };
  }, [trips, includeSettled]);

  const totalOutstanding = useMemo(
    () => pairs.reduce((sum, p) => sum + p.amount, 0),
    [pairs]
  );

  return {
    loading,
    error,
    pairs,
    people,
    tripsCounted,
    totalTrips: trips.length,
    totalOutstanding,
    includeSettled,
    setIncludeSettled,
  };
};

export default useBalancesController;
