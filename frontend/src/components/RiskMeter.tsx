import { ThreatAnalysis, getRiskIcon } from "../lib/threatDetection";

interface RiskMeterProps {
  analysis: ThreatAnalysis;
  showDetails?: boolean;
}

export function RiskMeter({ analysis, showDetails = true }: RiskMeterProps) {
  const { riskLevel, riskScore, alerts } = analysis;

  return (
    <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-6 font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-terminal-green">
          &gt; SECURITY RISK ASSESSMENT
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border-2 border-terminal-green text-white`}
        >
          {getRiskIcon(riskLevel)} {riskLevel.toUpperCase()}
        </span>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-white mb-1">
          <span>Risk Score</span>
          <span className="font-semibold text-white">{riskScore}/100</span>
        </div>
        <div className="w-full bg-terminal-bg border-2 border-terminal-green rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              riskScore >= 70
                ? "bg-terminal-green-bright"
                : riskScore >= 40
                ? "bg-terminal-green"
                : "bg-terminal-green-dim"
            }`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>

      {/* Alerts */}
      {showDetails && alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-terminal-green">
            &gt; DETECTED ISSUES:
          </h4>
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border-l-4 border-terminal-green bg-terminal-bg`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-terminal-green">
                    {alert.message}
                  </p>
                  <p className="text-xs text-terminal-green-dim mt-1">
                    {alert.suggestion}
                  </p>
                  {alert.pattern && (
                    <p className="text-xs text-terminal-green-dark mt-1 font-mono">
                      Found: {alert.pattern.substring(0, 30)}...
                    </p>
                  )}
                </div>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium border border-terminal-green text-terminal-green`}
                >
                  {alert.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
