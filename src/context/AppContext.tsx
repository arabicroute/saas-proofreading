import React, { createContext, useContext, useEffect, useReducer, type Dispatch } from "react";
import type { FeatureConfig } from "../types/featureConfig";
import type { MergedResult } from "../types/recommendation";
import type { ChunkProgress } from "../lib/proofreadingSession";
import { TESTING_DEFAULTS, isFeatureConfigFieldEditable } from "../config/featureConfig";
import { UI_DEFAULTS, loadStoredUiPrefs, saveUiPrefs } from "../config/uiConfig";
import type { PanelId, UiDirOverride, UiState } from "../types/uiConfig";

export type AppTab = "config" | "input" | "output" | "playground";

export interface AppState {
  apiKey: string;
  cfg: FeatureConfig;
  inputText: string;
  inputFileName: string;
  running: boolean;
  progress: ChunkProgress[];
  result: MergedResult | null;
  sessionError: string;
  activeTab: AppTab;
  promptOverride: string | undefined;
  ui: UiState;
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
  | { type: "SET_PROMPT_OVERRIDE"; prompt: string | undefined }
  | { type: "SET_UI_SKIN"; skin: UiState["skin"] }
  | { type: "SET_UI_DENSITY"; density: UiState["density"] }
  | { type: "SET_UI_DIR"; dir: UiState["dir"]["global"] }
  | { type: "SET_UI_DIR_OVERRIDE"; tab: AppTab; dir: UiDirOverride }
  | { type: "SET_PANEL_HIDDEN"; panelId: PanelId; hidden: boolean }
  | { type: "RESET_UI" };

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
    case "SET_UI_SKIN":
      return { ...state, ui: { ...state.ui, skin: action.skin } };
    case "SET_UI_DENSITY":
      return { ...state, ui: { ...state.ui, density: action.density } };
    case "SET_UI_DIR":
      return { ...state, ui: { ...state.ui, dir: { ...state.ui.dir, global: action.dir } } };
    case "SET_UI_DIR_OVERRIDE":
      return {
        ...state,
        ui: {
          ...state.ui,
          dir: {
            ...state.ui.dir,
            pageOverride: { ...state.ui.dir.pageOverride, [action.tab]: action.dir },
          },
        },
      };
    case "SET_PANEL_HIDDEN":
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [action.panelId]: { ...state.ui.panels[action.panelId], hidden: action.hidden },
          },
        },
      };
    case "RESET_UI":
      return { ...state, ui: UI_DEFAULTS };
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
  ui: loadStoredUiPrefs(),
};

const StateCtx = createContext<AppState>(initialState);
const DispatchCtx = createContext<Dispatch<AppAction>>(() => undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    saveUiPrefs(state.ui);
  }, [state.ui]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useAppState = () => useContext(StateCtx);
export const useAppDispatch = () => useContext(DispatchCtx);
