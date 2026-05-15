import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type ActiveProfile = "citizen" | "supplier" | "organization";

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
  const isSupplierUser = user?.role === "SUPPLIER";
  const isAgencyUser = Boolean(
    user?.permissions?.includes("agencies.dashboard.read") && user?.agency
  );
  const canSwitchProfile = isSupplierUser || isAgencyUser;

  const [activeProfile, setActiveProfileState] = useState<ActiveProfile>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ActiveProfile | null;
    if (stored === "citizen" || stored === "supplier" || stored === "organization") return stored;
    return "citizen";
  });

  useEffect(() => {
    if (!canSwitchProfile) {
      setActiveProfileState("citizen");
    } else if (isSupplierUser && activeProfile === "organization") {
      setActiveProfileState("citizen");
      localStorage.setItem(STORAGE_KEY, "citizen");
    } else if (isAgencyUser && activeProfile === "supplier") {
      setActiveProfileState("citizen");
      localStorage.setItem(STORAGE_KEY, "citizen");
    } else if (isAgencyUser && !localStorage.getItem(STORAGE_KEY)) {
      setActiveProfileState("organization");
      localStorage.setItem(STORAGE_KEY, "organization");
    }
  }, [canSwitchProfile, isSupplierUser, isAgencyUser, activeProfile]);

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
