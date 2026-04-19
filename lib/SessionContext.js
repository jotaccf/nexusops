"use client";

import { createContext, useContext } from "react";

const SessionContext = createContext(null);

/**
 * SessionProvider — envolve o layout do dashboard.
 * O `user` é injectado pelo layout server-side (já verificado via JWT).
 */
export function SessionProvider({ user, children }) {
  return (
    <SessionContext.Provider value={user}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSession — devolve o utilizador autenticado.
 * Lança erro se usado fora do SessionProvider.
 */
export function useSession() {
  const user = useContext(SessionContext);
  if (user === undefined) {
    throw new Error("useSession deve ser usado dentro de SessionProvider");
  }
  return user;
}
