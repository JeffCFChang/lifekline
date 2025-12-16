
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

// 歷史吉凶事件（用於校準喜用神）
export interface HistoricalEvent {
  year: string;                    // 發生年份 (如 "2020")
  type: 'lucky' | 'unlucky';       // 吉 或 凶
  description: string;             // 簡短描述 (如 "父親過世"、"升職加薪")
}

// 輸入模式：自動計算或手動輸入
export type InputMode = 'auto' | 'manual';

// 曆法類型：國曆或農曆
export type CalendarType = 'solar' | 'lunar';

export interface UserInput {
  name?: string;
  gender: Gender;

  // 輸入模式
  inputMode: InputMode;

  // 自動計算模式用欄位
  calendarType: CalendarType;  // 國曆或農曆
  birthYear: string;           // 出生年份 (如 1990)
  birthMonth: string;          // 出生月份 (1-12)
  birthDay: string;            // 出生日期 (1-31)
  birthHour: string;           // 出生時辰 (0-23，24小時制)
  isLeapMonth: boolean;        // 是否閏月（僅農曆）

  // 四柱（自動計算時由系統填入，手動模式時由用戶輸入）
  yearPillar: string;  // 年柱
  monthPillar: string; // 月柱
  dayPillar: string;   // 日柱
  hourPillar: string;  // 时柱

  // 大運資訊（自動計算時由系統填入）
  startAge: string;    // 起运年龄 (虚岁)
  firstDaYun: string;  // 第一步大运干支

  // API Configuration Fields
  modelName: string;   // 使用的模型名称
  apiBaseUrl: string;
  apiKey: string;

  // 歷史吉凶事件（可選，用於校準喜用神）
  historicalEvents?: HistoricalEvent[];
}

export interface KLinePoint {
  age: number;
  year: number;
  ganZhi: string; // 当年的流年干支 (如：甲辰)
  daYun?: string; // 当前所在的大运（如：甲子大运），用于图表标记
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string; // 这里现在需要存储详细的流年描述
}

// 紫微斗数核心信息
export interface ZiWeiCore {
  mingGong: string;       // 命宫主星 (如"紫微、天府")
  caiBaiGong: string;     // 财帛宫主星
  guanLuGong: string;     // 官禄宫主星
  fuQiGong: string;       // 夫妻宫主星
  overallPattern: string; // 格局评价 (如"紫府同宫格，主富贵双全")
}

// 近十年运势
export interface RecentYearFortune {
  year: number;           // 公历年份 (如 2024)
  ganZhi: string;         // 流年干支 (如 "甲辰")
  age: number;            // 虚岁
  score: number;          // 运势评分 (0-10)
  highlight: string;      // 重点提示 (15字内)
  ziWeiStar: string;      // 紫微流年主星 (如"太阳化禄")
  advice: string;         // 简短建议 (20字内)
}

export interface AnalysisData {
  bazi: string[]; // [Year, Month, Day, Hour] pillars
  summary: string;
  summaryScore: number; // 0-10
  
  personality: string;      // 性格分析
  personalityScore: number; // 0-10
  
  industry: string;
  industryScore: number; // 0-10

  fengShui: string;       // 发展风水 (New)
  fengShuiScore: number;  // 0-10 (New)
  
  wealth: string;
  wealthScore: number; // 0-10
  
  marriage: string;
  marriageScore: number; // 0-10
  
  health: string;
  healthScore: number; // 0-10
  
  family: string;
  familyScore: number; // 0-10

  // Crypto / Web3 Specifics
  crypto: string;       // 币圈交易分析
  cryptoScore: number;  // 投机运势评分
  cryptoYear: string;   // 暴富流年 (e.g., 2025 乙巳)
  cryptoStyle: string;  // 适合流派 (现货/合约/链上Alpha)

  // 紫微斗数分析
  ziWeiCore?: ZiWeiCore;              // 紫微核心信息
  recentYears?: RecentYearFortune[];  // 近十年运势 (10条)
}

export interface LifeDestinyResult {
  chartData: KLinePoint[];
  analysis: AnalysisData;
}
