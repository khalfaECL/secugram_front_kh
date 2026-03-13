import React, { createContext, useContext, useState } from 'react';
import { DarkColors, LightColors } from '../theme';

const ThemeCtx = createContext(null);

const EPHEMERAL_MIN = 1;
const EPHEMERAL_MAX = 10;

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [ephemeralDuration, setEphemeralDurationRaw] = useState(5); // secondes

  const colors = isDark ? DarkColors : LightColors;
  const toggleTheme = () => setIsDark(d => !d);

  const setEphemeralDuration = (val) => {
    const clamped = Math.max(EPHEMERAL_MIN, Math.min(EPHEMERAL_MAX, Math.round(val)));
    setEphemeralDurationRaw(clamped);
  };

  return (
    <ThemeCtx.Provider value={{
      colors, isDark, toggleTheme,
      ephemeralDuration, setEphemeralDuration,
      EPHEMERAL_MIN, EPHEMERAL_MAX,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
