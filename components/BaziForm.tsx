
import React, { useState, useMemo, useEffect } from 'react';
import { UserInput, Gender, InputMode, CalendarType } from '../types';
import { Loader2, Sparkles, TrendingUp, Settings, Calendar, Calculator, Edit3 } from 'lucide-react';
import {
  calculateFromSolar,
  calculateFromLunar,
  isValidSolarDate,
  isValidLunarDate,
  getLeapMonth,
  BaziResult,
} from '../services/lunarService';

interface BaziFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const BaziForm: React.FC<BaziFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserInput>({
    name: '',
    gender: Gender.MALE,
    inputMode: 'auto',
    calendarType: 'solar',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    isLeapMonth: false,
    yearPillar: '',
    monthPillar: '',
    dayPillar: '',
    hourPillar: '',
    startAge: '',
    firstDaYun: '',
    modelName: 'gemini-3-pro-preview',
    apiBaseUrl: 'https://max.openai365.top/v1',
    apiKey: '',
  });

  const [formErrors, setFormErrors] = useState<{ modelName?: string; apiBaseUrl?: string; apiKey?: string }>({});
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    // Clear error when user types
    if (name === 'apiBaseUrl' || name === 'apiKey' || name === 'modelName') {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const setInputMode = (mode: InputMode) => {
    setFormData((prev) => ({ ...prev, inputMode: mode }));
    setBaziResult(null);
    setCalcError(null);
  };

  const setCalendarType = (type: CalendarType) => {
    setFormData((prev) => ({ ...prev, calendarType: type, isLeapMonth: false }));
    setBaziResult(null);
    setCalcError(null);
  };

  // 自動計算八字
  useEffect(() => {
    if (formData.inputMode !== 'auto') return;

    const year = parseInt(formData.birthYear, 10);
    const month = parseInt(formData.birthMonth, 10);
    const day = parseInt(formData.birthDay, 10);
    const hour = parseInt(formData.birthHour, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour)) {
      setBaziResult(null);
      setCalcError(null);
      return;
    }

    try {
      let result: BaziResult;
      const gender = formData.gender === Gender.MALE ? 'male' : 'female';

      if (formData.calendarType === 'solar') {
        if (!isValidSolarDate(year, month, day)) {
          setCalcError('無效的國曆日期');
          setBaziResult(null);
          return;
        }
        result = calculateFromSolar({ year, month, day, hour }, gender);
      } else {
        if (!isValidLunarDate(year, month, day, formData.isLeapMonth)) {
          setCalcError('無效的農曆日期');
          setBaziResult(null);
          return;
        }
        result = calculateFromLunar({ year, month, day, hour }, formData.isLeapMonth, gender);
      }

      setBaziResult(result);
      setCalcError(null);

      // 更新表單數據
      setFormData((prev) => ({
        ...prev,
        yearPillar: result.yearPillar,
        monthPillar: result.monthPillar,
        dayPillar: result.dayPillar,
        hourPillar: result.hourPillar,
        startAge: result.startAge.toString(),
        firstDaYun: result.firstDaYun,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('八字計算錯誤:', err);
      setCalcError(`計算錯誤: ${errorMsg}`);
      setBaziResult(null);
    }
  }, [
    formData.inputMode,
    formData.calendarType,
    formData.birthYear,
    formData.birthMonth,
    formData.birthDay,
    formData.birthHour,
    formData.isLeapMonth,
    formData.gender,
  ]);

  // 取得當年閏月
  const leapMonth = useMemo(() => {
    if (formData.calendarType !== 'lunar') return 0;
    const year = parseInt(formData.birthYear, 10);
    if (isNaN(year)) return 0;
    return getLeapMonth(year);
  }, [formData.calendarType, formData.birthYear]);

  // Calculate direction for UI feedback (手動模式用)
  const daYunDirectionInfo = useMemo(() => {
    if (formData.inputMode === 'auto' && baziResult) {
      return baziResult.daYunDirection === 'forward' ? '順行 (陽男/陰女)' : '逆行 (陰男/陽女)';
    }

    if (!formData.yearPillar) return '等待輸入年柱...';

    const firstChar = formData.yearPillar.trim().charAt(0);
    const yinStems = ['乙', '丁', '己', '辛', '癸'];

    let isYangYear = true;
    if (yinStems.includes(firstChar)) isYangYear = false;

    let isForward = false;
    if (formData.gender === Gender.MALE) {
      isForward = isYangYear;
    } else {
      isForward = !isYangYear;
    }

    return isForward ? '順行 (陽男/陰女)' : '逆行 (陰男/陽女)';
  }, [formData.yearPillar, formData.gender, formData.inputMode, baziResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate API Config
    const errors: { modelName?: string; apiBaseUrl?: string; apiKey?: string } = {};
    if (!formData.modelName.trim()) {
      errors.modelName = '請輸入模型名稱';
    }
    if (!formData.apiBaseUrl.trim()) {
      errors.apiBaseUrl = '請輸入 API Base URL';
    }
    if (!formData.apiKey.trim()) {
      errors.apiKey = '請輸入 API Key';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // 自動模式需要計算結果
    if (formData.inputMode === 'auto' && !baziResult) {
      setCalcError('請先輸入完整的出生日期時間');
      return;
    }

    onSubmit(formData);
  };

  // 生成年份選項
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1900; y--) {
      years.push(y);
    }
    return years;
  }, []);

  // 生成月份選項
  const monthOptions = useMemo(() => {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      months.push(m);
    }
    return months;
  }, []);

  // 生成日期選項
  const dayOptions = useMemo(() => {
    const days = [];
    for (let d = 1; d <= 31; d++) {
      days.push(d);
    }
    return days;
  }, []);

  // 生成時辰選項 (24小時制)
  const hourOptions = useMemo(() => {
    const hours = [];
    for (let h = 0; h <= 23; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-gray-800 mb-2">八字排盤</h2>
        <p className="text-gray-500 text-sm">輸入出生資訊以生成人生 K 線分析</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (可選)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.MALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                  formData.gender === Gender.MALE
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                乾造 (男)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.FEMALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                  formData.gender === Gender.FEMALE
                    ? 'bg-white text-pink-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                坤造 (女)
              </button>
            </div>
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode('auto')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                formData.inputMode === 'auto'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              自動計算
            </button>
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                formData.inputMode === 'manual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              手動輸入
            </button>
          </div>
        </div>

        {/* Auto Mode: Birth Date Input */}
        {formData.inputMode === 'auto' && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
              <Calendar className="w-4 h-4" />
              <span>出生日期時間</span>
            </div>

            {/* Calendar Type Toggle */}
            <div className="flex bg-white rounded-lg p-1 mb-4 border border-amber-200">
              <button
                type="button"
                onClick={() => setCalendarType('solar')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                  formData.calendarType === 'solar'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                國曆 (陽曆)
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('lunar')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                  formData.calendarType === 'lunar'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                農曆 (陰曆)
              </button>
            </div>

            {/* Date & Time Selectors */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">年</label>
                <select
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                >
                  <option value="">選擇年份</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">月</label>
                <select
                  name="birthMonth"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                >
                  <option value="">選擇月份</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {formData.calendarType === 'lunar'
                        ? `${['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'][m - 1]}月`
                        : `${m} 月`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">日</label>
                <select
                  name="birthDay"
                  value={formData.birthDay}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                >
                  <option value="">選擇日期</option>
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">時 (24小時)</label>
                <select
                  name="birthHour"
                  value={formData.birthHour}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                >
                  <option value="">選擇時辰</option>
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leap Month Checkbox (Lunar only) */}
            {formData.calendarType === 'lunar' && leapMonth > 0 && parseInt(formData.birthMonth, 10) === leapMonth && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-amber-100 rounded-lg">
                <input
                  type="checkbox"
                  name="isLeapMonth"
                  id="isLeapMonth"
                  checked={formData.isLeapMonth}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isLeapMonth" className="text-xs font-medium text-amber-800">
                  閏{['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'][leapMonth - 1]}月
                </label>
              </div>
            )}

            {/* Calculation Result */}
            {calcError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{calcError}</div>
            )}

            {baziResult && (
              <div className="mt-3 p-3 bg-white border border-amber-200 rounded-lg">
                <div className="text-xs text-gray-500 mb-2">自動計算結果</div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">國曆：</span>
                    <span className="font-bold">
                      {baziResult.solarDate.year}/{baziResult.solarDate.month}/{baziResult.solarDate.day}{' '}
                      {baziResult.solarDate.hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">農曆：</span>
                    <span className="font-bold">{baziResult.lunarDateString}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-amber-100 rounded p-2">
                    <div className="text-[10px] text-gray-500">年柱</div>
                    <div className="font-serif-sc font-bold text-amber-900">{baziResult.yearPillar}</div>
                  </div>
                  <div className="bg-amber-100 rounded p-2">
                    <div className="text-[10px] text-gray-500">月柱</div>
                    <div className="font-serif-sc font-bold text-amber-900">{baziResult.monthPillar}</div>
                  </div>
                  <div className="bg-amber-100 rounded p-2">
                    <div className="text-[10px] text-gray-500">日柱</div>
                    <div className="font-serif-sc font-bold text-amber-900">{baziResult.dayPillar}</div>
                  </div>
                  <div className="bg-amber-100 rounded p-2">
                    <div className="text-[10px] text-gray-500">時柱</div>
                    <div className="font-serif-sc font-bold text-amber-900">{baziResult.hourPillar}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-center text-amber-700">
                  起運 <span className="font-bold">{baziResult.startAge}</span> 歲 | 第一大運{' '}
                  <span className="font-bold font-serif-sc">{baziResult.firstDaYun}</span> |{' '}
                  <span className="font-bold">{baziResult.daYunDirection === 'forward' ? '順行' : '逆行'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode: Four Pillars Input */}
        {formData.inputMode === 'manual' && (
          <>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>輸入四柱干支 (必填)</span>
              </div>

              {/* Birth Year Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1">出生年份 (陽曆)</label>
                <input
                  type="number"
                  name="birthYear"
                  required
                  min="1900"
                  max="2100"
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="如: 1990"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">年柱 (Year)</label>
                  <input
                    type="text"
                    name="yearPillar"
                    required
                    value={formData.yearPillar}
                    onChange={handleChange}
                    placeholder="如: 甲子"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">月柱 (Month)</label>
                  <input
                    type="text"
                    name="monthPillar"
                    required
                    value={formData.monthPillar}
                    onChange={handleChange}
                    placeholder="如: 丙寅"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">日柱 (Day)</label>
                  <input
                    type="text"
                    name="dayPillar"
                    required
                    value={formData.dayPillar}
                    onChange={handleChange}
                    placeholder="如: 戊辰"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">時柱 (Hour)</label>
                  <input
                    type="text"
                    name="hourPillar"
                    required
                    value={formData.hourPillar}
                    onChange={handleChange}
                    placeholder="如: 壬戌"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Da Yun Manual Input */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-800 text-sm font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>大運排盤信息 (必填)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">起運年齡 (虛歲)</label>
                  <input
                    type="number"
                    name="startAge"
                    required
                    min="1"
                    max="100"
                    value={formData.startAge}
                    onChange={handleChange}
                    placeholder="如: 3"
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">第一步大運</label>
                  <input
                    type="text"
                    name="firstDaYun"
                    required
                    value={formData.firstDaYun}
                    onChange={handleChange}
                    placeholder="如: 丁卯"
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
              </div>
              <p className="text-xs text-indigo-600/70 mt-2 text-center">
                當前大運排序規則：
                <span className="font-bold text-indigo-900">{daYunDirectionInfo}</span>
              </p>
            </div>
          </>
        )}

        {/* API Configuration Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3 text-gray-700 text-sm font-bold">
            <Settings className="w-4 h-4" />
            <span>模型接口設置 (必填)</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">使用模型</label>
              <input
                type="text"
                name="modelName"
                value={formData.modelName}
                onChange={handleChange}
                placeholder="gemini-3-pro-preview"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${
                  formErrors.modelName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'
                }`}
              />
              {formErrors.modelName && <p className="text-red-500 text-xs mt-1">{formErrors.modelName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Base URL</label>
              <input
                type="text"
                name="apiBaseUrl"
                value={formData.apiBaseUrl}
                onChange={handleChange}
                placeholder="https://max.openai365.top/v1"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${
                  formErrors.apiBaseUrl
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-2 focus:ring-gray-400'
                }`}
              />
              {formErrors.apiBaseUrl && <p className="text-red-500 text-xs mt-1">{formErrors.apiBaseUrl}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${
                  formErrors.apiKey ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'
                }`}
              />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-900 to-gray-900 hover:from-black hover:to-black text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>大師推演中(3-5分鐘)</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>生成人生K線</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BaziForm;
