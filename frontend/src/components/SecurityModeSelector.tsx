import { useSecurityStore } from "../store/securityStore";

export function SecurityModeSelector() {
  const { mode, setMode } = useSecurityStore();

  return (
    <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-4 mb-6 font-mono">
      <label className="block text-sm font-medium text-terminal-green mb-2">
        Security Mode
      </label>
      <div className="flex space-x-4">
        <button
          onClick={() => setMode("warnings")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors border-2 font-mono ${
            mode === "warnings"
              ? "bg-terminal-bg text-terminal-green border-terminal-green"
              : "bg-terminal-bg text-terminal-green-dim border-terminal-green-dark hover:border-terminal-green"
          }`}
        >
          &gt; WARNINGS
          <span className="block text-xs mt-1 opacity-75 text-white">
            Show alerts but allow sharing
          </span>
        </button>
        <button
          onClick={() => setMode("strict")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors border-2 font-mono ${
            mode === "strict"
              ? "bg-terminal-bg text-terminal-green border-terminal-green"
              : "bg-terminal-bg text-terminal-green-dim border-terminal-green-dark hover:border-terminal-green"
          }`}
        >
          &gt; STRICT
          <span className="block text-xs mt-1 opacity-75 text-white">
            Block high-risk content
          </span>
        </button>
      </div>
    </div>
  );
}
