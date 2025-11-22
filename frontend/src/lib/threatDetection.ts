/**
 * Client-Side AI Threat Detection
 * Pattern-based detection of sensitive data using regex rules
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ThreatAlert {
  level: RiskLevel;
  category: string;
  message: string;
  suggestion: string;
  pattern?: string;
}

export interface ThreatAnalysis {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  alerts: ThreatAlert[];
  maskedContent?: string;
}

// Pattern definitions for sensitive data
const patterns = [
  {
    name: 'Credit Card',
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    level: 'critical' as RiskLevel,
    category: 'Financial',
    message: 'Credit card number detected',
    suggestion: 'Never share credit card numbers. Use secure payment gateways instead.',
  },
  {
    name: 'SSN',
    regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    level: 'critical' as RiskLevel,
    category: 'Identity',
    message: 'Social Security Number detected',
    suggestion: 'SSNs are highly sensitive. Consider using alternative identifiers.',
  },
  {
    name: 'Email with Password',
    regex: /(?:password|pwd|pass)[\s:=]+[\w@$%]+/gi,
    level: 'critical' as RiskLevel,
    category: 'Credentials',
    message: 'Password in plain text detected',
    suggestion: 'Never share passwords in plain text. Use password managers.',
  },
  {
    name: 'API Key',
    regex: /(?:api[_-]?key|apikey|secret[_-]?key)[\s:=]+[\w-]{20,}/gi,
    level: 'critical' as RiskLevel,
    category: 'Credentials',
    message: 'API key or secret detected',
    suggestion: 'API keys should be kept secret. Regenerate if exposed.',
  },
  {
    name: 'Bearer Token',
    regex: /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi,
    level: 'critical' as RiskLevel,
    category: 'Credentials',
    message: 'Bearer token detected',
    suggestion: 'Authentication tokens are sensitive. Revoke if exposed.',
  },
  {
    name: 'Bank Account',
    regex: /\b\d{8,17}\b/g, // Generic account number pattern
    level: 'high' as RiskLevel,
    category: 'Financial',
    message: 'Possible bank account number detected',
    suggestion: 'Bank account numbers are sensitive. Verify the recipient before sharing.',
  },
  {
    name: 'Phone Number',
    regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    level: 'medium' as RiskLevel,
    category: 'Personal',
    message: 'Phone number detected',
    suggestion: 'Consider if the phone number needs to be shared.',
  },
  {
    name: 'IP Address',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    level: 'medium' as RiskLevel,
    category: 'Network',
    message: 'IP address detected',
    suggestion: 'IP addresses can reveal location information. Share with caution.',
  },
  {
    name: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    level: 'low' as RiskLevel,
    category: 'Personal',
    message: 'Email address detected',
    suggestion: 'Email addresses are generally safe to share, but be aware of privacy.',
  },
];

/**
 * Analyze content for sensitive data patterns
 */
export function analyzeThreats(content: string): ThreatAnalysis {
  const alerts: ThreatAlert[] = [];
  let maxRiskScore = 0;

  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      const riskScore = getRiskScore(pattern.level);
      maxRiskScore = Math.max(maxRiskScore, riskScore);

      alerts.push({
        level: pattern.level,
        category: pattern.category,
        message: pattern.message,
        suggestion: pattern.suggestion,
        pattern: matches[0],
      });
    }
  }

  // Determine overall risk level
  const riskLevel = getRiskLevelFromScore(maxRiskScore);
  
  // Generate masked content if high risk
  let maskedContent: string | undefined;
  if (maxRiskScore >= 70) {
    maskedContent = maskSensitiveData(content, alerts);
  }

  return {
    riskLevel,
    riskScore: maxRiskScore,
    alerts,
    maskedContent,
  };
}

/**
 * Get risk score from risk level
 */
function getRiskScore(level: RiskLevel): number {
  const scores = {
    low: 20,
    medium: 40,
    high: 70,
    critical: 100,
  };
  return scores[level];
}

/**
 * Get risk level from score
 */
function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Mask sensitive data in content
 */
function maskSensitiveData(content: string, alerts: ThreatAlert[]): string {
  let masked = content;

  for (const alert of alerts) {
    if (alert.level === 'critical' || alert.level === 'high') {
      if (alert.pattern) {
        // Replace with masked version
        const maskLength = Math.min(alert.pattern.length, 12);
        const mask = '*'.repeat(maskLength);
        masked = masked.replace(new RegExp(escapeRegex(alert.pattern), 'g'), mask);
      }
    }
  }

  return masked;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get risk color for UI
 */
export function getRiskColor(level: RiskLevel): string {
  const colors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };
  return colors[level];
}

/**
 * Get risk icon for UI
 */
export function getRiskIcon(level: RiskLevel): string {
  const icons = {
    low: '✓',
    medium: '⚠',
    high: '⚡',
    critical: '🚨',
  };
  return icons[level];
}


