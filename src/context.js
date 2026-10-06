import { createContext, useContext } from "react";

export const StateContext = createContext(null);

export function useNpaid() {
  const value = useContext(StateContext);
  if (!value) throw new Error("useNpaid was used outside the provider.");
  return value;
}
