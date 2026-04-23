import { useReducer, useCallback } from 'react';
import { Transaction, Alert, DashboardStats, ConnectionStatus } from '../types';

const MAX_TX = 100;
const MAX_ALERTS = 50;

interface State {
  transactions: Transaction[];
  alerts: Alert[];
  stats: DashboardStats;
  connectionStatus: ConnectionStatus;
  newAlertId: string | null;
}

type Action = 
  | { type: 'INIT'; payload: { transactions: Transaction[]; alerts: Alert[]; stats: DashboardStats } }
  | { type: 'NEW_TX'; payload: Transaction }
  | { type: 'NEW_ALERT'; payload: Alert }
  | { type: 'STATS_UPDATE'; payload: DashboardStats }
  | { type: 'SET_CONNECTION'; payload: ConnectionStatus }
  | { type: 'DEFEND_ALERT'; payload: string };

const initialState: State = {
  transactions: [],
  alerts: [],
  stats: {
    totalTx: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    avgGasPrice: 0,
    avgRiskScore: 0,
    txPerMinute: 0,
    topContracts: [],
    recentRiskScores: [],
    uptimeMs: 0,
  },
  connectionStatus: 'connecting',
  newAlertId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        transactions: action.payload.transactions.slice(0, MAX_TX),
        alerts: action.payload.alerts.slice(0, MAX_ALERTS),
        stats: action.payload.stats,
      };
    case 'NEW_TX':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions].slice(0, MAX_TX),
      };
    case 'NEW_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts].slice(0, MAX_ALERTS),
        newAlertId: action.payload.id,
      };
    case 'STATS_UPDATE':
      return { ...state, stats: action.payload };
    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.payload };
    case 'DEFEND_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a => a.id === action.payload ? { ...a, defended: true } : a),
      };
    default:
      return state;
  }
}

export function useSentinelStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === 'INIT' || msg.type === 'NEW_TX' || msg.type === 'NEW_ALERT' || msg.type === 'STATS_UPDATE') {
      dispatch({ type: msg.type, payload: msg.payload });
    }
  }, []);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION', payload: status });
  }, []);

  const defendAlert = useCallback((alertId: string) => {
    dispatch({ type: 'DEFEND_ALERT', payload: alertId });
  }, []);

  return { state, handleWsMessage, setConnectionStatus, defendAlert };
}
