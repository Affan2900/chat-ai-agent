'use client'
import { useState, createContext } from "react"

interface NavigationContextType {
  isMobileNavOpen: boolean;
  setisMobileNavOpen: (open: boolean) => void;
  closeMobileNav: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  isMobileNavOpen: false,
  setisMobileNavOpen: () => {},
  closeMobileNav: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {

  const [  isMobileNavOpen, setisMobileNavOpen ] = useState(false);

  const closeMobileNav = () => {
    setisMobileNavOpen(false);
  }
  return <NavigationContext
  value={{ isMobileNavOpen, setisMobileNavOpen, closeMobileNav }}
  >{children}</NavigationContext>
}