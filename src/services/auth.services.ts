import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "../firebase";
import {
  uploadAvatar as uploadAvatarToCloudinary,
  uploadSlip as uploadSlipToCloudinary,
} from "./cloudinary.service";

export function registerWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(
    auth,
    email,
    
    password,
  );
}

export function loginWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
}

export function loginWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

export function logout(): Promise<void> {
  return signOut(auth);
}

// Upload an avatar image to Cloudinary and return its URL.
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const result = await uploadAvatarToCloudinary(file, uid);
  return result.url;
}

// Update the signed-in user's display name and/or photo URL.
export async function updateUserProfile(profile: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> {
  if (!auth.currentUser) throw new Error("No authenticated user");
  await updateProfile(auth.currentUser, profile);
}

// Upload a payment-slip image to Cloudinary and return its URL.
export async function uploadTripSlip(
  splitId: string,
  _slipId: string,
  file: File
): Promise<string> {
  const result = await uploadSlipToCloudinary(file, splitId);
  return result.url;
}