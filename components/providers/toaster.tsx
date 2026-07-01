"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#1a2f4a",
          color: "#fff",
          border: "1px solid #334155",
          fontSize: "16px",
        },
      }}
      richColors
    />
  );
}
