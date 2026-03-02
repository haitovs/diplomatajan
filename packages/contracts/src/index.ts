export type LocaleCode = 'en-US' | 'tk-TM' | 'ru-RU';

export type AttackTypeId =
  | 'dictionary'
  | 'credential_stuffing'
  | 'password_spray'
  | 'distributed'
  | 'reverse_brute';

export type TargetSurface = 'login' | 'api' | 'mixed';
export type BusinessProfile = 'retail' | 'fintech' | 'education' | 'saas';

export type DefenseId =
  | 'rate_limit'
  | 'ip_blacklist'
  | 'captcha'
  | 'account_lockout'
  | 'progressive_delay'
  | 'geo_blocking'
  | 'honeypot'
  | 'behavioral';

export type RecommendationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationEffort = 'low' | 'medium' | 'high';

export interface DefenseConfig {
  id: DefenseId;
  enabled: boolean;
  params: Record<string, string | number | boolean | string[]>;
}

export interface ScenarioConfig {
  name: string;
  attackType: AttackTypeId;
  intensity: number;
  targetSurface: TargetSurface;
  businessProfile: BusinessProfile;
  defenses: DefenseConfig[];
}

export interface ScenarioRecord extends ScenarioConfig {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface RunEvent {
  runId: string;
  ts: number;
  kind: 'traffic' | 'defense_action' | 'alert' | 'kpi';
  rps: number;
  blockedRate: number;
  authFailureRate: number;
  topOrigins: Array<{ country: string; count: number }>;
}

export interface RunSnapshot {
  label: 'baseline' | 'hardened';
  ts: number;
  totalRequests: number;
  blockedRequests: number;
  failedAuth: number;
  successfulLogins: number;
  peakRps: number;
  attackDuration: number;
  defenseStats?: Record<string, number>;
}

export interface RunRecord {
  id: string;
  scenarioId: string;
  startedAt: number;
  endedAt?: number;
  status: 'running' | 'stopped' | 'completed';
  snapshots: RunSnapshot[];
}

export interface RecommendationItem {
  id: string;
  severity: RecommendationSeverity;
  actionKey: string;
  expectedRiskDropPct: number;
  implementationEffort: RecommendationEffort;
}
