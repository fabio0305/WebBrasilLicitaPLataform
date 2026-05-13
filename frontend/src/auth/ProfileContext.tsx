import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type ActiveProfile = "citizen" | "supplier";

interface ProfileContextValue {
  activeProfile: ActiveProfile;
  canSwitchProfile: boolean;
  switchProfile: (p: ActiveProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: "citizen",
  canSwitchProfile: false,
  switchProfile: () => {},
});

const STORAGE_KEY = "licita-brasil:active-profile";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canSwitchProfile = user?.role === "SUPPLIER";

  const [activeProfile, setActiveProfileState] = useState<ActiveProfile>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ActiveProfile | null;
    if (stored === "citizen" || stored === "supplier") return stored;
    return "citizen";
  });

  useEffect(() => {
    if (!canSwitchProfile) {
      setActiveProfileState("citizen");
    }
  }, [canSwitchProfile]);

  const switchProfile = (p: ActiveProfile) => {
    setActiveProfileState(p);
    localStorage.setItem(STORAGE_KEY, p);
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, canSwitchProfile, switchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
