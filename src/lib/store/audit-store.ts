"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuditInput, ToolEntry, UseCase, Tool } from "@/engine/types";

interface AuditFormState {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
  setTools: (tools: ToolEntry[]) => void;
  addTool: (entry: ToolEntry) => void;
  updateTool: (index: number, entry: Partial<ToolEntry>) => void;
  removeTool: (index: number) => void;
  setTeamSize: (n: number) => void;
  setUseCase: (uc: UseCase) => void;
  reset: () => void;
  toAuditInput: () => AuditInput;
}

const DEFAULT_TOOL: ToolEntry = {
  tool: "cursor" as Tool,
  plan: "pro",
  monthlySpend: 0,
  seats: 1,
};

export const useAuditForm = create<AuditFormState>()(
  persist(
    (set, get) => ({
      tools: [{ ...DEFAULT_TOOL }],
      teamSize: 5,
      useCase: "coding",
      setTools: (tools) => set({ tools }),
      addTool: (entry) => set({ tools: [...get().tools, entry] }),
      updateTool: (index, entry) =>
        set({
          tools: get().tools.map((t, i) => (i === index ? { ...t, ...entry } : t)),
        }),
      removeTool: (index) => set({ tools: get().tools.filter((_, i) => i !== index) }),
      setTeamSize: (n) => set({ teamSize: n }),
      setUseCase: (uc) => set({ useCase: uc }),
      reset: () =>
        set({
          tools: [{ ...DEFAULT_TOOL }],
          teamSize: 5,
          useCase: "coding",
        }),
      toAuditInput: () => ({
        tools: get().tools,
        teamSize: get().teamSize,
        useCase: get().useCase,
      }),
    }),
    {
      name: "spendlens-audit-form",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
