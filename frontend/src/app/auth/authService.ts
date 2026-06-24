import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as signOutFromFirebase,
  updateProfile,
  type AuthError,
  type User,
} from "firebase/auth";
import { auth } from "../../firebase";

interface EmailAuthInput {
  email: string;
  password: string;
}

interface SignUpInput extends EmailAuthInput {
  name: string;
}

export async function signUpWithEmail({ name, email, password }: SignUpInput): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }

  return credential.user;
}

export async function loginWithEmail({ email, password }: EmailAuthInput): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  if (Capacitor.isNativePlatform()) {
    const nativeResult = await FirebaseAuthentication.signInWithGoogle();
    const idToken = nativeResult.credential?.idToken;

    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token.");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const firebaseResult = await signInWithCredential(auth, credential);
    return firebaseResult.user;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut().catch(() => undefined);
  }

  await signOutFromFirebase(auth);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as AuthError | undefined)?.code;

  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/weak-password":
      return "Use a stronger password.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return error instanceof Error && error.message
        ? error.message
        : "Authentication failed. Please try again.";
  }
}
