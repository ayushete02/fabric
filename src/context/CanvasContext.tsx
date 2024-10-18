// src/context/CanvasContext.tsx
"use client";

import { Store } from "@/store/Store";
import React, { createContext, useContext, useState } from "react";

export const CanvasContext = createContext<Store>(new Store());

export const useCanvasStore = () => {
  const store = useContext(CanvasContext);
  if (!store) {
    throw new Error("useCanvasStore must be used within a CanvasProvider");
  }
  return store;
};

export const CanvasProvider = ({ children }: { children: React.ReactNode }) => {
  const [store] = useState(() => new Store());

  return (
    <CanvasContext.Provider value={store}>{children}</CanvasContext.Provider>
  );
};
