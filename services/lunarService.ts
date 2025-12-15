import { Solar, Lunar } from 'lunar-typescript';

export interface BirthDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export interface BaziResult {
  // 轉換後的日期
  solarDate: BirthDateTime;
  lunarDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
    isLeapMonth: boolean;
  };
  lunarDateString: string; // 如：庚午年 正月 十六

  // 四柱
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;

  // 大運資訊
  startAge: number;
  firstDaYun: string;
  daYunDirection: 'forward' | 'backward';
}

/**
 * 從國曆日期計算八字
 */
export function calculateFromSolar(
  date: BirthDateTime,
  gender: 'male' | 'female'
): BaziResult {
  const solar = Solar.fromYmdHms(date.year, date.month, date.day, date.hour, 0, 0);
  const lunar = solar.getLunar();

  return calculateBazi(lunar, solar, gender);
}

/**
 * 從農曆日期計算八字
 */
export function calculateFromLunar(
  date: BirthDateTime,
  isLeapMonth: boolean,
  gender: 'male' | 'female'
): BaziResult {
  // 農曆閏月用負數表示
  const month = isLeapMonth ? -date.month : date.month;
  const lunar = Lunar.fromYmdHms(date.year, month, date.day, date.hour, 0, 0);
  const solar = lunar.getSolar();

  return calculateBazi(lunar, solar, gender);
}

/**
 * 核心八字計算邏輯
 */
function calculateBazi(
  lunar: Lunar,
  solar: Solar,
  gender: 'male' | 'female'
): BaziResult {
  const eightChar = lunar.getEightChar();

  // 取得四柱
  const yearPillar = eightChar.getYear();
  const monthPillar = eightChar.getMonth();
  const dayPillar = eightChar.getDay();
  const hourPillar = eightChar.getTime();

  // 計算大運
  const yun = eightChar.getYun(gender === 'male' ? 1 : 0);
  const startAge = yun.getStartYear(); // 起運年齡
  const daYunList = yun.getDaYun();
  const firstDaYun = daYunList.length > 1 ? daYunList[1].getGanZhi() : '';

  // 判斷順逆行
  const isForward = yun.isForward();

  // 農曆日期字串
  const lunarYearGanZhi = lunar.getYearInGanZhi();
  const lunarMonthName = lunar.getMonthInChinese();
  const lunarDayName = lunar.getDayInChinese();
  // lunar-typescript 中閏月用負數表示
  const isLeapMonth = lunar.getMonth() < 0;
  const lunarDateString = `${lunarYearGanZhi}年 ${isLeapMonth ? '閏' : ''}${lunarMonthName}月 ${lunarDayName}`;

  return {
    solarDate: {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
      hour: solar.getHour(),
    },
    lunarDate: {
      year: lunar.getYear(),
      month: Math.abs(lunar.getMonth()),
      day: lunar.getDay(),
      hour: lunar.getHour(),
      isLeapMonth: isLeapMonth,
    },
    lunarDateString,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    startAge,
    firstDaYun,
    daYunDirection: isForward ? 'forward' : 'backward',
  };
}

/**
 * 驗證國曆日期是否有效
 */
export function isValidSolarDate(year: number, month: number, day: number): boolean {
  try {
    const solar = Solar.fromYmd(year, month, day);
    return solar.getYear() === year && solar.getMonth() === month && solar.getDay() === day;
  } catch {
    return false;
  }
}

/**
 * 驗證農曆日期是否有效
 */
export function isValidLunarDate(year: number, month: number, day: number, isLeapMonth: boolean): boolean {
  try {
    const m = isLeapMonth ? -month : month;
    const lunar = Lunar.fromYmd(year, m, day);
    return lunar.getYear() === year && Math.abs(lunar.getMonth()) === month && lunar.getDay() === day;
  } catch {
    return false;
  }
}

/**
 * 取得指定農曆年份的閏月（若無則返回 0）
 */
export function getLeapMonth(lunarYear: number): number {
  try {
    const lunar = Lunar.fromYmd(lunarYear, 1, 1);
    return lunar.getLeapMonth();
  } catch {
    return 0;
  }
}

/**
 * 取得農曆月份的天數
 */
export function getLunarMonthDays(lunarYear: number, lunarMonth: number, isLeapMonth: boolean): number {
  try {
    const m = isLeapMonth ? -lunarMonth : lunarMonth;
    const lunar = Lunar.fromYmd(lunarYear, m, 1);
    // lunar-typescript 不直接提供月天數，用最後一天判斷
    for (let day = 30; day >= 29; day--) {
      try {
        Lunar.fromYmd(lunarYear, m, day);
        return day;
      } catch {
        continue;
      }
    }
    return 30;
  } catch {
    return 30;
  }
}
