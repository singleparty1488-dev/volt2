import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

import { BottomNav } from "./BottomNav";
import { CreateCellSheet } from "./CreateCellSheet";
import { LockScreen } from "./LockScreen";
import { useVolt } from "@/lib/volt/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hydrated, locked, state } = useVolt();
  const [createOpen, setCreateOpen] = React.useState(false);
  const navigate = useNavigate();

  const gated = !hydrated || locked || !state.security.onboarded;

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-md px-5 pt-6 pb-32">{children}</main>
      {!gated && <BottomNav onCreate={() => setCreateOpen(true)} />}
      <CreateCellSheet
        open={createOpen && !gated}
        onOpenChange={setCreateOpen}
        onCreated={(cellId) => navigate({ to: "/cell/$cellId", params: { cellId } })}
      />
      {hydrated && <LockScreen />}
    </div>
  );
}
