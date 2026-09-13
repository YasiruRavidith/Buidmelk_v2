"use client";

import { useState, useEffect, createContext, useContext } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export type BackendUser = {
  id: number;
  username: string;
  email: string;
  role: string | null;
  phone_number: string | null;
  profile_image?: string | null;
  profile_image_url?: string | null;
};

interface AuthContextType {
  user: FirebaseUser | null;
  backendUser: BackendUser | null;
  profilePhoto: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
  uploadProfilePhoto: (file: File) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

const normalizePhotoUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") && url.includes("railway.app")) {
    return url.replace("http://", "https://");
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendOrigin = backendUrl.replace(/\/api\/?$/, "");
  if (url.startsWith("/")) {
    return `${backendOrigin}${url}`;
  }
  return `${backendOrigin}/media/${url}`;
};

const verifyTokenWithBackend = async (token: string) => {
  try {
    const response = await fetch(`${backendUrl}/users/auth/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error verifying token with backend:", error);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPhoto = localStorage.getItem("profilePhotoUrl");
      if (storedPhoto) setProfilePhoto(normalizePhotoUrl(storedPhoto));
    }

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        const res = await verifyTokenWithBackend(token);
        if (res?.user) {
          setBackendUser(res.user);
          const photoUrl = normalizePhotoUrl(res.user.profile_image_url || res.user.profile_image) || currentUser.photoURL || null;
          if (photoUrl) {
            setProfilePhoto(photoUrl);
            if (typeof window !== "undefined") {
              localStorage.setItem("profilePhotoUrl", photoUrl);
            }
          }
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("userUpdated"));
          window.dispatchEvent(new Event("ticketsUpdated"));
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else {
        setBackendUser(null);
        setProfilePhoto(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("profilePhotoUrl");
          window.dispatchEvent(new Event("userUpdated"));
          window.dispatchEvent(new Event("ticketsUpdated"));
          window.dispatchEvent(new Event("cartUpdated"));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      await sendEmailVerification(credential.user);
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      const token = await auth.currentUser.getIdToken(true);
      const res = await verifyTokenWithBackend(token);
      if (res?.user) {
        setBackendUser(res.user);
        const photoUrl = normalizePhotoUrl(res.user.profile_image_url || res.user.profile_image) || auth.currentUser.photoURL || null;
        if (photoUrl) {
          setProfilePhoto(photoUrl);
          if (typeof window !== "undefined") {
            localStorage.setItem("profilePhotoUrl", photoUrl);
          }
        }
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userUpdated"));
        window.dispatchEvent(new Event("ticketsUpdated"));
        window.dispatchEvent(new Event("cartUpdated"));
      }
      return !!auth.currentUser.emailVerified;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return false;
    }
  };

  const uploadProfilePhoto = async (file: File): Promise<string | null> => {
    if (!auth.currentUser) return null;

    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("token", token);
      formData.append("image", file);

      const response = await fetch(`${backendUrl}/users/profile/image/`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload profile photo to backend");
      }

      const photoUrl = normalizePhotoUrl(result.user?.profile_image_url || result.user?.profile_image);
      if (photoUrl) {
        setProfilePhoto(photoUrl);
        setBackendUser(result.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("profilePhotoUrl", photoUrl);
        }
        return photoUrl;
      }
      return null;
    } catch (error) {
      console.error("Error uploading profile photo to python database:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfilePhoto(null);
    setBackendUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("profilePhotoUrl");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        backendUser,
        profilePhoto,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendVerificationEmail,
        refreshUser,
        uploadProfilePhoto,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);