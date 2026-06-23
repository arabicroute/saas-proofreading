import { useEffect, useState } from "react";
import { AppProvider, useAppDispatch, useAppState, type AppTab } from "./context/AppContext";
import { ConfigTab } from "./components/tabs/ConfigTab";
import { InputTab } from "./components/tabs/InputTab";
import { OutputTab } from "./components/tabs/OutputTab";
import { PlaygroundTab } from "./components/tabs/PlaygroundTab";
import { AppConfigTab } from "./components/tabs/AppConfigTab";
import { UiTab } from "./components/tabs/UiTab";
import { CLS, DATA, IDS } from "./lib/uiSelectors";

const IS_DEV = import.meta.env.DEV;

type DisplayTab = AppTab | "appearance";

const TABS: Array<{ id: DisplayTab; label: string; devOnly?: boolean }> = [
  { id: "ai-config", label: "⚙ AI Config" },
  { id: "input", label: "✏ Input" },
  { id: "output", label: "📄 Output" },
  { id: "playground", label: "🛠 Playground", devOnly: true },
  { id: "appearance", label: "🎨 Appearance", devOnly: true },
  { id: "app-config", label: "🔧 App Config" },
];

function Shell() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { activeTab, result, ui } = state;
  const [displayTab, setDisplayTab] = useState<DisplayTab>(activeTab);

  useEffect(() => {
    if (displayTab !== "appearance") {
      setDisplayTab(activeTab);
    }
  }, [activeTab, displayTab]);

  const visibleTabs = TABS.filter((tab) => !tab.devOnly || IS_DEV);

  const handleTabClick = (tab: DisplayTab) => {
    setDisplayTab(tab);
    if (tab !== "appearance") {
      dispatch({ type: "SET_TAB", tab });
    }
  };

  const resolveDir = (tab: DisplayTab): "ltr" | "rtl" => {
    if (tab === "appearance" || tab === "playground") return "ltr";
    const override = ui.dir.pageOverride[tab];
    if (override && override !== "inherit") return override;
    return ui.dir.global;
  };

  const activeDir = resolveDir(displayTab);

  return (
    <div
      id={IDS.appShell}
      className={`${CLS.appShell} min-h-screen bg-[--color-surface-soft] font-sans`}
      {...DATA.skin(ui.skin)}
      {...DATA.density(ui.density)}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div id={IDS.appHeader} className={`${CLS.appHeader} mb-6 text-center`}>
          <h1 className="text-2xl font-extrabold tracking-tight text-[--color-brand-900]">
            Arabic Text Proofreader
          </h1>
          <p className="arabic-text mt-1 text-lg text-gray-500">مدقق النصوص العربية</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
              Powered by Cohere · command-r7b-arabic
            </span>
            {IS_DEV && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                DEV
              </span>
            )}
          </div>
        </div>

        <div id={IDS.appTabBar} className={CLS.appTabBar} role="tablist" aria-label="Application tabs">
          {visibleTabs.map((tab) => {
            const active = displayTab === tab.id;
            const hasResult =
              tab.id === "output" && !!result && result.clean.length + result.flagged.length > 0;

            return (
              <button
                key={tab.id}
                id={IDS.tabButton(tab.id)}
                className={`${CLS.tabButton} ${active ? CLS.tabButtonActive : ""}`}
                onClick={() => handleTabClick(tab.id)}
                aria-selected={active}
                aria-controls={IDS.tabPanel(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
                {hasResult && !active && (
                  <span
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500"
                    aria-label="has results"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          id={IDS.tabPanel(displayTab)}
          className={`${CLS.appContent} rounded-b-xl bg-[--color-surface-soft] pt-4`}
          dir={activeDir}
          role="tabpanel"
          aria-labelledby={IDS.tabButton(displayTab)}
        >
          {displayTab === "ai-config" && <ConfigTab />}
          {displayTab === "input" && <InputTab />}
          {displayTab === "output" && <OutputTab />}
          {displayTab === "playground" && IS_DEV && <PlaygroundTab />}
          {displayTab === "appearance" && IS_DEV && <UiTab />}
          {displayTab === "app-config" && <AppConfigTab />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
