import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { SavedGroup } from "../model/calculateModel";

// Saved groups: the same friends turn up trip after trip, so their names are
// kept once and reloaded into the setup step instead of being retyped.

const COLLECTION = "saved_groups";

// Live list of the signed-in user's groups, most recently used first.
export function subscribeToGroups(
  userId: string,
  onChange: (groups: SavedGroup[]) => void,
  onError?: (err: unknown) => void
): () => void {
  return onSnapshot(
    query(collection(db, COLLECTION), where("userId", "==", userId)),
    (snap) => {
      const groups = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as SavedGroup
      );
      groups.sort((a, b) => {
        const at = a.lastUsedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
        const bt = b.lastUsedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
        return bt - at;
      });
      onChange(groups);
    },
    (err) => {
      console.error("Error fetching saved groups:", err);
      onError?.(err);
    }
  );
}

export async function createGroup(
  userId: string,
  name: string,
  memberNames: string[]
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    name: name.trim(),
    memberNames: memberNames.map((n) => n.trim()).filter(Boolean),
    createdAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
  });
  return ref.id;
}

// Bumps the group to the top of the list when it is reused.
export async function touchGroup(groupId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, groupId), {
    lastUsedAt: serverTimestamp(),
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, groupId));
}
