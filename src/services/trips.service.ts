import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// `user_splits` documents are readable only by their owner and members, so a
// person following a QR/share link has nothing to look at before they join.
// `trip_invites/{tripId}` is the public half of that handshake: just enough to
// show "join <trip name>, owned by <someone>?" and nothing about the money.

export interface TripInvite {
  tripId: string;
  tripName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
}

// Written by the owner whenever the trip is created or its name changes.
export async function upsertTripInvite(invite: TripInvite): Promise<void> {
  await setDoc(
    doc(db, "trip_invites", invite.tripId),
    { ...invite, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getTripInvite(
  tripId: string
): Promise<TripInvite | null> {
  const snap = await getDoc(doc(db, "trip_invites", tripId));
  return snap.exists() ? (snap.data() as TripInvite) : null;
}

export async function deleteTripInvite(tripId: string): Promise<void> {
  await deleteDoc(doc(db, "trip_invites", tripId));
}
