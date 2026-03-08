// SnowQuery Core Types

export interface QueryRequest {
  question: string;
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  timestamp: number;
}

export interface DashboardPanel {
  id: string;
  title: string;
  sql: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  chartRecommendation: ChartRecommendation;
  explanation: string;
}

export interface QueryResult {
  panels: DashboardPanel[];
  suggestedFollowUps: string[];
  totalExecutionTime: number;
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  isNumeric: boolean;
  isDate: boolean;
  isCategorical: boolean;
}

export interface ChartRecommendation {
  type: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string | string[];
  series?: string;
  reasoning: string;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'scatter'
  | 'area'
  | 'heatmap'
  | 'map'
  | 'treemap'
  | 'radar'
  | 'table';

export interface TableMeta {
  tableName: string;
  columns: {
    name: string;
    dataType: string;
    isNullable: boolean;
  }[];
  rowCount?: number;
}

export interface HistoryEntry {
  id: string;
  question: string;
  panelsCount: number;
  timestamp: number;
  result?: QueryResult;
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  currentResult: QueryResult | null;
  history: HistoryEntry[];
}
