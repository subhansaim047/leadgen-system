'use client';

import React, { createContext, useContext, useState } from 'react';

interface MobileNavContextType {
  isMobileOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  isMobileOpen: false,
  toggleMobileNav: () => {},
  closeMobileNav: () => {},
});

export const MobileNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileNav = () => setIsMobileOpen(prev => !prev);
  const closeMobileNav = () => setIsMobileOpen(false);

  return (
    <MobileNavContext.Provider value={{ isMobileOpen, toggleMobileNav, closeMobileNav }}>
      {children}
    </MobileNavContext.Provider>
  );
};

export const useMobileNav = () => useContext(MobileNavContext);
