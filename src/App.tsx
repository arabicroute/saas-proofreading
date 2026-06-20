import { AppProvider, useAppState, useAppDispatch, type AppTab } from "./context/AppContext";
import { ConfigTab }     from "./components/tabs/ConfigTab";
import { InputTab }      from "./components/tabs/InputTab";
import { OutputTab }     from "./components/tabs/OutputTab";
import { PlaygroundTab } from "./components/tabs/PlaygroundTab";

const IS_DEV = import.meta.env.DEV;

const TABS: Array<{ id: AppTab; label: string; devOnly?: boolean }> = [
  { id: "config",     label: "⚙ Config"     },
  { id: "input",      label: "✏ Input"      },
  { id: "output",     label: "📄 Output"     },
  { id: "playground", label: "🛠 Playground", devOnly: true },
];

function Shell() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { activeTab, result } = state;

  const visibleTabs = TABS.filter(t => !t.devOnly || IS_DEV);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#1c2b4a] tracking-tight">
            Arabic Text Proofreader
          </h1>
          <p className="arabic-text text-lg text-gray-500 mt-1">مدقق النصوص العربية</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-3 py-1 font-medium">
              Powered by Cohere · command-r7b-arabic
            </span>
            {IS_DEV && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-1 font-bold">
                DEV
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white rounded-t-xl shadow-sm border-b border-gray-100 overflow-hidden mb-0">
          {visibleTabs.map(tab => {
            const active = activeTab === tab.id;
            const hasResult = tab.id === "output" && result && result.clean.length + result.flagged.length > 0;
            return (
              <button
                key={tab.id}
                onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors relative
                  ${active
                    ? "border-[#1c2b4a] text-[#1c2b4a]"
                    : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                {tab.label}
                {hasResult && !active && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-gray-100 rounded-b-xl pt-4">
          {activeTab === "config"     && <ConfigTab />}
          {activeTab === "input"      && <InputTab />}
          {activeTab === "output"     && <OutputTab />}
          {activeTab === "playground" && IS_DEV && <PlaygroundTab />}
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
