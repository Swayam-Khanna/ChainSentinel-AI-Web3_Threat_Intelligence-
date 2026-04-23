export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasLimit: string;
  data: string;
  timestamp: number;
  status: 'pending' | 'flagged' | 'safe';
}

export interface Alert {
  id: string;
  txHash: string;
  contract: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  reason: string;
  type: string;
  timestamp: number;
  defended: boolean;
}

export interface DashboardStats {
  totalTx: number;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  avgGasPrice: number;
  avgRiskScore: number;
  txPerMinute: number;
  topContracts: Array<{ address: string; count: number }>;
  recentRiskScores: number[];
  uptimeMs: number;
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed';
