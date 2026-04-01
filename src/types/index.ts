export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DiagnosisResult {
  level: RiskLevel;
  reason: string;
  action: string;
  departments: string[];
  disclaimer: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: '三甲医院' | '二甲医院' | '社区诊所' | '专科医院';
  distance: string;
  address: string;
  phone: string;
  emergency: boolean;
  departments: string[];
  rating: number;
  waitTime: string;
  openNow: boolean;
  latitude: number;
  longitude: number;
}

export interface ToolCall {
  name: 'search_hospitals' | 'get_departments' | 'check_severity';
  arguments: Record<string, unknown>;
}

export interface SymptomInfo {
  id: string;
  name: string;
  aliases: string[];
  danger_signs: string[];
  departments: string[];
  self_care: string[];
  when_to_worry: string;
  default_min_level: RiskLevel;
}

export interface SymptomReport {
  id: string;
  symptoms: string[];
  level: RiskLevel;
  timestamp: string;
  region: string;
}
