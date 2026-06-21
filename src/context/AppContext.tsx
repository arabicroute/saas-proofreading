import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import type { FeatureConfig } from "../types/featureConfig";
import type { MergedResult } from "../types/recommendation";
import type { ChunkProgress } from "../lib/proofreadingSession";
import { TESTING_DEFAULTS, isFeatureConfigFieldEditable } from "../config/featureConfig";

export type AppTab = "config" | "input" | "output" | "playground";

export interface AppState {
  // ── API credentials ────────────────────────────────────────────────────────
  apiKey: string;

  // ── Feature config ─────────────────────────────────────────────────────────
  cfg: FeatureConfig;

  // ── Input ──────────────────────────────────────────────────────────────────
  inputText: string;
  inputFileName: string;

  // ── Session state ──────────────────────────────────────────────────────────
  running: boolean;
  progress: ChunkProgress[];
  result: MergedResult | null;
  sessionError: string;

  // ── UI ─────────────────────────────────────────────────────────────────────
  activeTab: AppTab;

  // ── Dev: in-memory prompt override (Playground tab) ────────────────────────
  promptOverride: string | undefined;
}

export type AppAction =
  | { type: "SET_API_KEY"; key: string }
  | { type: "SET_CFG"; cfg: Partial<FeatureConfig> }
  | { type: "SET_INPUT"; text: string; fileName?: string }
  | { type: "SESSION_START" }
  | { type: "SESSION_PROGRESS"; progress: ChunkProgress }
  | { type: "SESSION_DONE"; result: MergedResult }
  | { type: "SESSION_ERROR"; message: string }
  | { type: "SET_TAB"; tab: AppTab }
  | { type: "SET_PROMPT_OVERRIDE"; prompt: string | undefined };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_API_KEY":
      return { ...state, apiKey: action.key };
    case "SET_CFG": {
      // Tier switches must always be allowed so the app can move in and out
      // of the locked production preset.
      if (action.cfg.tier) {
        return { ...state, cfg: { ...state.cfg, ...action.cfg } };
      }

      if (state.cfg.tier === "production") {
        const filtered: Partial<FeatureConfig> = {};
        const assignable = filtered as Record<keyof FeatureConfig, FeatureConfig[keyof FeatureConfig] | undefined>;

        for (const key of Object.keys(action.cfg) as Array<keyof FeatureConfig>) {
          if (isFeatureConfigFieldEditable(state.cfg.tier, key)) {
            assignable[key] = action.cfg[key];
          }
        }

        return { ...state, cfg: { ...state.cfg, ...filtered } };
      }

      return { ...state, cfg: { ...state.cfg, ...action.cfg } };
    }
    case "SET_INPUT":
      return { ...state, inputText: action.text, inputFileName: action.fileName ?? "" };
    case "SESSION_START":
      return { ...state, running: true, progress: [], result: null, sessionError: "" };
    case "SESSION_PROGRESS": {
      const updated = [...state.progress];
      updated[action.progress.index] = action.progress;
      return { ...state, progress: updated };
    }
    case "SESSION_DONE":
      return { ...state, running: false, result: action.result };
    case "SESSION_ERROR":
      return { ...state, running: false, sessionError: action.message };
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_PROMPT_OVERRIDE":
      return { ...state, promptOverride: action.prompt };
    default:
      return state;
  }
}

const initialState: AppState = {
  apiKey: import.meta.env.VITE_COHERE_API_KEY ?? "",
  cfg: TESTING_DEFAULTS,
  inputText: "",
  inputFileName: "",
  running: false,
  progress: [],
  result: null,
  sessionError: "",
  activeTab: "config",
  promptOverride: undefined,
};

const StateCtx    = createContext<AppState>(initialState);
const DispatchCtx = createContext<Dispatch<AppAction>>(() => undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useAppState    = () => useContext(StateCtx);
export const useAppDispatch = () => useContext(DispatchCtx);
