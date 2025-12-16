
import React, { useState, useMemo, useEffect } from 'react';
import { LifeDestinyResult, InputMode, CalendarType, HistoricalEvent } from '../types';
import { Copy, CheckCircle, AlertCircle, Upload, Sparkles, MessageSquare, ArrowRight, Calendar, Calculator, Edit3, Loader2, Zap, Lock, ChevronDown, ChevronUp, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { BAZI_SYSTEM_INSTRUCTION } from '../constants';
import {
    calculateFromSolar,
    calculateFromLunar,
    isValidSolarDate,
    isValidLunarDate,
    getLeapMonth,
    BaziResult,
} from '../services/lunarService';

interface ImportDataModeProps {
    onDataImport: (data: LifeDestinyResult) => void;
}

const ImportDataMode: React.FC<ImportDataModeProps> = ({ onDataImport }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [inputMode, setInputMode] = useState<InputMode>('auto');
    const [calendarType, setCalendarType] = useState<CalendarType>('solar');

    // 歷史事件校準功能狀態
    const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([]);
    const [isEventsExpanded, setIsEventsExpanded] = useState<boolean>(false);
    const [baziInfo, setBaziInfo] = useState({
        name: '',
        gender: 'Male',
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
    });
    const [jsonInput, setJsonInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
    const [calcError, setCalcError] = useState<string | null>(null);

    // 访问密码（从 localStorage 读取）
    const [accessPassword, setAccessPassword] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('life_k_password') || '';
        }
        return '';
    });
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // 保存密码到 localStorage
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pwd = e.target.value;
        setAccessPassword(pwd);
        localStorage.setItem('life_k_password', pwd);
        setApiError(null);
    };

    // 歷史事件處理函數
    const handleAddEvent = () => {
        if (historicalEvents.length >= 5) return;
        setHistoricalEvents([
            ...historicalEvents,
            { year: String(new Date().getFullYear() - 1), type: 'lucky', description: '' }
        ]);
    };

    const handleUpdateEvent = (index: number, field: keyof HistoricalEvent, value: string) => {
        const updated = [...historicalEvents];
        updated[index] = { ...updated[index], [field]: value };
        setHistoricalEvents(updated);
    };

    const handleRemoveEvent = (index: number) => {
        setHistoricalEvents(historicalEvents.filter((_, i) => i !== index));
    };

    // 生成年份選項 (用於歷史事件)
    const eventYearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (let y = currentYear; y >= 1950; y--) {
            years.push(y);
        }
        return years;
    }, []);

    // 自動計算八字
    useEffect(() => {
        if (inputMode !== 'auto') return;

        const year = parseInt(baziInfo.birthYear, 10);
        const month = parseInt(baziInfo.birthMonth, 10);
        const day = parseInt(baziInfo.birthDay, 10);
        const hour = parseInt(baziInfo.birthHour, 10);

        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour)) {
            setBaziResult(null);
            setCalcError(null);
            return;
        }

        try {
            let result: BaziResult;
            const gender = baziInfo.gender === 'Male' ? 'male' : 'female';

            if (calendarType === 'solar') {
                if (!isValidSolarDate(year, month, day)) {
                    setCalcError('無效的國曆日期');
                    setBaziResult(null);
                    return;
                }
                result = calculateFromSolar({ year, month, day, hour }, gender);
            } else {
                if (!isValidLunarDate(year, month, day, baziInfo.isLeapMonth)) {
                    setCalcError('無效的農曆日期');
                    setBaziResult(null);
                    return;
                }
                result = calculateFromLunar({ year, month, day, hour }, baziInfo.isLeapMonth, gender);
            }

            setBaziResult(result);
            setCalcError(null);

            // 更新表單數據
            setBaziInfo(prev => ({
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
        inputMode,
        calendarType,
        baziInfo.birthYear,
        baziInfo.birthMonth,
        baziInfo.birthDay,
        baziInfo.birthHour,
        baziInfo.isLeapMonth,
        baziInfo.gender,
    ]);

    // 取得當年閏月
    const leapMonth = useMemo(() => {
        if (calendarType !== 'lunar') return 0;
        const year = parseInt(baziInfo.birthYear, 10);
        if (isNaN(year)) return 0;
        return getLeapMonth(year);
    }, [calendarType, baziInfo.birthYear]);

    // 计算大运方向
    const getDaYunDirection = () => {
        if (inputMode === 'auto' && baziResult) {
            return {
                isForward: baziResult.daYunDirection === 'forward',
                text: baziResult.daYunDirection === 'forward' ? '順行 (Forward)' : '逆行 (Backward)'
            };
        }

        if (!baziInfo.yearPillar) return { isForward: true, text: '順行 (Forward)' };
        const firstChar = baziInfo.yearPillar.trim().charAt(0);
        const yangStems = ['甲', '丙', '戊', '庚', '壬'];

        const isYangYear = yangStems.includes(firstChar);
        const isForward = baziInfo.gender === 'Male' ? isYangYear : !isYangYear;

        return {
            isForward,
            text: isForward ? '順行 (Forward)' : '逆行 (Backward)'
        };
    };

    // 生成用户提示词
    const generateUserPrompt = () => {
        const { isForward, text: daYunDirectionStr } = getDaYunDirection();
        const genderStr = baziInfo.gender === 'Male' ? '男 (乾造)' : '女 (坤造)';
        const startAgeInt = parseInt(baziInfo.startAge) || 1;

        const directionExample = isForward
            ? "例如：第一步是【戊申】，第二步则是【己酉】（顺排）"
            : "例如：第一步是【戊申】，第二步则是【丁未】（逆排）";

        const yearStemPolarity = (() => {
            const firstChar = baziInfo.yearPillar.trim().charAt(0);
            const yangStems = ['甲', '丙', '戊', '庚', '壬'];
            return yangStems.includes(firstChar) ? '阳' : '阴';
        })();

        return `请根据以下**已经排好的**八字四柱和**指定的大运信息**进行分析。

【基本信息】
性别：${genderStr}
姓名：${baziInfo.name || "未提供"}
出生年份：${baziInfo.birthYear}年 (阳历)

【八字四柱】
年柱：${baziInfo.yearPillar} (天干属性：${yearStemPolarity})
月柱：${baziInfo.monthPillar}
日柱：${baziInfo.dayPillar}
时柱：${baziInfo.hourPillar}

【大运核心参数】
1. 起运年龄：${baziInfo.startAge} 岁 (虚岁)。
2. 第一步大运：${baziInfo.firstDaYun}。
3. **排序方向**：${daYunDirectionStr}。

【必须执行的算法 - 大运序列生成】
请严格按照以下步骤生成数据：

1. **锁定第一步**：确认【${baziInfo.firstDaYun}】为第一步大运。
2. **计算序列**：根据六十甲子顺序和方向（${daYunDirectionStr}），推算出接下来的 9 步大运。
   ${directionExample}
3. **填充 JSON**：
   - Age 1 到 ${startAgeInt - 1}: daYun = "童限"
   - Age ${startAgeInt} 到 ${startAgeInt + 9}: daYun = [第1步大运: ${baziInfo.firstDaYun}]
   - Age ${startAgeInt + 10} 到 ${startAgeInt + 19}: daYun = [第2步大运]
   - ...以此类推直到 100 岁。

【特别警告】
- **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
- **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。

任务：
1. 确认格局与喜忌。
2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据。
3. 在 \`reason\` 字段中提供流年详批。
4. 生成带评分的命理分析报告（包含性格分析、币圈交易分析、发展风水分析）。
${historicalEvents.length > 0 ? `
【历史吉凶事件校准】
用户提供了以下真实经历的重大吉凶事件，请据此校准喜用神/忌神判断：

${historicalEvents.map((event, index) => {
    const typeStr = event.type === 'lucky' ? '吉' : '凶';
    return `${index + 1}. ${event.year}年 - ${typeStr}：${event.description || '(未详述)'}`;
}).join('\n')}

**校准分析要求：**
1. 对照每个事件年份的流年干支与命主八字的关系
2. 分析该年五行对命主的影响（生、克、合、冲）
3. 吉年：该年旺的五行可能为喜用神
4. 凶年：该年旺的五行可能为忌神
5. 用这些「已知结果」反推验证喜用神/忌神判断
6. 如发现矛盾，优先以用户真实经历校准
7. 在 summary 中简述校准结论（如："根据用户2020年凶事校准，确认XX为忌神"）
` : ''}
请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。`;
    };

    // 直接调用 API 生成分析
    const handleDirectApiCall = async () => {
        setApiError(null);
        setIsLoading(true);

        if (!accessPassword.trim()) {
            setApiError('請輸入訪問密碼');
            setIsLoading(false);
            return;
        }

        const messages = [
            { role: "system", content: BAZI_SYSTEM_INSTRUCTION + "\n\n请务必只返回纯JSON格式数据，不要包含任何markdown代码块标记。" },
            { role: "user", content: generateUserPrompt() }
        ];

        // 基于八字信息生成 seed（同一八字产生相似结果，加入日期因子增加变化）
        const seedString = `${baziInfo.yearPillar}${baziInfo.monthPillar}${baziInfo.dayPillar}${baziInfo.hourPillar}${baziInfo.gender}${new Date().toISOString().slice(0, 10)}`;
        const seed = Array.from(seedString).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000;

        try {
            let response: Response;

            // 本地开发环境直接调用 OpenAI，生产环境使用 /api/chat
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            if (isLocalDev) {
                // 本地开发：直接调用 OpenAI（使用环境变量中的配置）
                const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
                const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
                const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-mini';
                const localPassword = import.meta.env.VITE_ACCESS_PASSWORD;

                // 本地也验证密码
                if (localPassword && accessPassword.trim() !== localPassword) {
                    throw new Error('訪問密碼錯誤');
                }

                response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        max_completion_tokens: 16384,
                        seed  // 添加 seed 参数让相同八字产生相似结果
                    })
                });
            } else {
                // 生产环境：调用 /api/chat
                response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        password: accessPassword.trim(),
                        messages,
                        seed  // 传递 seed 到服务器
                    })
                });
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API 請求失敗: ${response.status} - ${errText}`);
            }

            const jsonResult = await response.json();
            const content = jsonResult.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error("模型未返回任何內容");
            }

            // 从可能包含 markdown 代码块的内容中提取 JSON
            let jsonContent = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            } else {
                const jsonStartIndex = content.indexOf('{');
                const jsonEndIndex = content.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
                }
            }

            const data = JSON.parse(jsonContent);

            if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
                throw new Error("數據格式不正確：缺少 chartPoints");
            }

            // 验证并修正分数，确保不超过 100
            const validatedChartPoints = data.chartPoints.map((point: any) => ({
                ...point,
                open: Math.min(100, Math.max(0, point.open || 0)),
                close: Math.min(100, Math.max(0, point.close || 0)),
                high: Math.min(100, Math.max(0, point.high || 0)),
                low: Math.min(100, Math.max(0, point.low || 0)),
                score: Math.min(100, Math.max(0, point.score || 0)),
            }));

            // 转换为应用所需格式
            const result: LifeDestinyResult = {
                chartData: validatedChartPoints,
                analysis: {
                    bazi: data.bazi || [],
                    summary: data.summary || "无摘要",
                    summaryScore: data.summaryScore || 5,
                    personality: data.personality || "无性格分析",
                    personalityScore: data.personalityScore || 5,
                    industry: data.industry || "无",
                    industryScore: data.industryScore || 5,
                    fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
                    fengShuiScore: data.fengShuiScore || 5,
                    wealth: data.wealth || "无",
                    wealthScore: data.wealthScore || 5,
                    marriage: data.marriage || "无",
                    marriageScore: data.marriageScore || 5,
                    health: data.health || "无",
                    healthScore: data.healthScore || 5,
                    family: data.family || "无",
                    familyScore: data.familyScore || 5,
                    crypto: data.crypto || "暂无交易分析",
                    cryptoScore: data.cryptoScore || 5,
                    cryptoYear: data.cryptoYear || "待定",
                    cryptoStyle: data.cryptoStyle || "现货定投",
                    // 紫微斗数字段
                    ziWeiCore: data.ziWeiCore || undefined,
                    recentYears: data.recentYears || undefined,
                },
            };

            onDataImport(result);
        } catch (err: any) {
            console.error('API 調用錯誤:', err);
            setApiError(err.message || '未知錯誤');
        } finally {
            setIsLoading(false);
        }
    };

    // 复制完整提示词
    const copyFullPrompt = async () => {
        const fullPrompt = `=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generateUserPrompt()}`;

        try {
            await navigator.clipboard.writeText(fullPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    // 解析导入的 JSON
    const handleImport = () => {
        setError(null);

        if (!jsonInput.trim()) {
            setError('请粘贴 AI 返回的 JSON 数据');
            return;
        }

        try {
            // 尝试从可能包含 markdown 的内容中提取 JSON
            let jsonContent = jsonInput.trim();

            // 提取 ```json ... ``` 中的内容
            const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            } else {
                // 尝试找到 JSON 对象
                const jsonStartIndex = jsonContent.indexOf('{');
                const jsonEndIndex = jsonContent.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
                }
            }

            const data = JSON.parse(jsonContent);

            // 校验数据
            if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
                throw new Error('数据格式不正确：缺少 chartPoints 数组');
            }

            if (data.chartPoints.length < 10) {
                throw new Error('数据不完整：chartPoints 数量太少');
            }

            // 验证并修正分数，确保不超过 100
            const validatedChartPoints = data.chartPoints.map((point: any) => ({
                ...point,
                open: Math.min(100, Math.max(0, point.open || 0)),
                close: Math.min(100, Math.max(0, point.close || 0)),
                high: Math.min(100, Math.max(0, point.high || 0)),
                low: Math.min(100, Math.max(0, point.low || 0)),
                score: Math.min(100, Math.max(0, point.score || 0)),
            }));

            // 转换为应用所需格式
            const result: LifeDestinyResult = {
                chartData: validatedChartPoints,
                analysis: {
                    bazi: data.bazi || [],
                    summary: data.summary || "无摘要",
                    summaryScore: data.summaryScore || 5,
                    personality: data.personality || "无性格分析",
                    personalityScore: data.personalityScore || 5,
                    industry: data.industry || "无",
                    industryScore: data.industryScore || 5,
                    fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
                    fengShuiScore: data.fengShuiScore || 5,
                    wealth: data.wealth || "无",
                    wealthScore: data.wealthScore || 5,
                    marriage: data.marriage || "无",
                    marriageScore: data.marriageScore || 5,
                    health: data.health || "无",
                    healthScore: data.healthScore || 5,
                    family: data.family || "无",
                    familyScore: data.familyScore || 5,
                    crypto: data.crypto || "暂无交易分析",
                    cryptoScore: data.cryptoScore || 5,
                    cryptoYear: data.cryptoYear || "待定",
                    cryptoStyle: data.cryptoStyle || "现货定投",
                    // 紫微斗数字段
                    ziWeiCore: data.ziWeiCore || undefined,
                    recentYears: data.recentYears || undefined,
                },
            };

            onDataImport(result);
        } catch (err: any) {
            setError(`解析失败：${err.message}`);
        }
    };

    const handleBaziChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setBaziInfo(prev => ({ ...prev, [name]: newValue }));
    };

    const handleInputModeChange = (mode: InputMode) => {
        setInputMode(mode);
        setBaziResult(null);
        setCalcError(null);
    };

    const handleCalendarTypeChange = (type: CalendarType) => {
        setCalendarType(type);
        setBaziInfo(prev => ({ ...prev, isLeapMonth: false }));
        setBaziResult(null);
        setCalcError(null);
    };

    const isStep1Valid = inputMode === 'auto'
        ? baziResult !== null
        : baziInfo.birthYear && baziInfo.yearPillar && baziInfo.monthPillar &&
          baziInfo.dayPillar && baziInfo.hourPillar && baziInfo.startAge && baziInfo.firstDaYun;

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
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                                ? 'bg-indigo-600 text-white scale-110'
                                : step > s
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* 步骤 1: 输入八字信息 */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第一步：輸入八字信息</h2>
                        <p className="text-gray-500 text-sm">填寫您的出生資訊</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">姓名 (可選)</label>
                            <input
                                type="text"
                                name="name"
                                value={baziInfo.name}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="姓名"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">性別</label>
                            <select
                                name="gender"
                                value={baziInfo.gender}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Male">乾造 (男)</option>
                                <option value="Female">坤造 (女)</option>
                            </select>
                        </div>
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleInputModeChange('auto')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                    inputMode === 'auto'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                <Calculator className="w-4 h-4" />
                                自動計算
                            </button>
                            <button
                                type="button"
                                onClick={() => handleInputModeChange('manual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                    inputMode === 'manual'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                <Edit3 className="w-4 h-4" />
                                手動輸入
                            </button>
                        </div>
                    </div>

                    {/* Auto Mode */}
                    {inputMode === 'auto' && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                                <Calendar className="w-4 h-4" />
                                <span>出生日期時間</span>
                            </div>

                            {/* Calendar Type Toggle */}
                            <div className="flex bg-white rounded-lg p-1 mb-4 border border-amber-200">
                                <button
                                    type="button"
                                    onClick={() => handleCalendarTypeChange('solar')}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                                        calendarType === 'solar'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    國曆 (陽曆)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCalendarTypeChange('lunar')}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                                        calendarType === 'lunar'
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
                                        value={baziInfo.birthYear}
                                        onChange={handleBaziChange}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                                    >
                                        <option value="">選擇年份</option>
                                        {yearOptions.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">月</label>
                                    <select
                                        name="birthMonth"
                                        value={baziInfo.birthMonth}
                                        onChange={handleBaziChange}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                                    >
                                        <option value="">選擇月份</option>
                                        {monthOptions.map((m) => (
                                            <option key={m} value={m}>
                                                {calendarType === 'lunar'
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
                                        value={baziInfo.birthDay}
                                        onChange={handleBaziChange}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                                    >
                                        <option value="">選擇日期</option>
                                        {dayOptions.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">時 (24小時)</label>
                                    <select
                                        name="birthHour"
                                        value={baziInfo.birthHour}
                                        onChange={handleBaziChange}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                                    >
                                        <option value="">選擇時辰</option>
                                        {hourOptions.map((h) => (
                                            <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Leap Month Checkbox */}
                            {calendarType === 'lunar' && leapMonth > 0 && parseInt(baziInfo.birthMonth, 10) === leapMonth && (
                                <div className="flex items-center gap-2 mb-3 p-2 bg-amber-100 rounded-lg">
                                    <input
                                        type="checkbox"
                                        name="isLeapMonth"
                                        id="isLeapMonth"
                                        checked={baziInfo.isLeapMonth}
                                        onChange={handleBaziChange}
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

                    {/* Manual Mode */}
                    {inputMode === 'manual' && (
                        <>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                                    <Sparkles className="w-4 h-4" />
                                    <span>四柱干支</span>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">出生年份 (陽曆)</label>
                                    <input
                                        type="number"
                                        name="birthYear"
                                        value={baziInfo.birthYear}
                                        onChange={handleBaziChange}
                                        placeholder="如: 2003"
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {(['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'] as const).map((field, i) => (
                                        <div key={field}>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">{['年柱', '月柱', '日柱', '時柱'][i]}</label>
                                            <input
                                                type="text"
                                                name={field}
                                                value={baziInfo[field]}
                                                onChange={handleBaziChange}
                                                placeholder={['甲子', '乙丑', '丙寅', '丁卯'][i]}
                                                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">起運年齡 (虛歲)</label>
                                        <input
                                            type="number"
                                            name="startAge"
                                            value={baziInfo.startAge}
                                            onChange={handleBaziChange}
                                            placeholder="如: 8"
                                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">第一步大運</label>
                                        <input
                                            type="text"
                                            name="firstDaYun"
                                            value={baziInfo.firstDaYun}
                                            onChange={handleBaziChange}
                                            placeholder="如: 辛酉"
                                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-indigo-600/70 mt-2 text-center">
                                    大運方向：<span className="font-bold text-indigo-900">{getDaYunDirection().text}</span>
                                </p>
                            </div>
                        </>
                    )}

                    {/* 訪問密碼輸入 */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2 text-gray-700 text-sm font-bold">
                            <Lock className="w-4 h-4" />
                            <span>訪問密碼</span>
                        </div>
                        <input
                            type="password"
                            value={accessPassword}
                            onChange={handlePasswordChange}
                            placeholder="請輸入訪問密碼"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">首次使用請向管理員索取密碼</p>
                    </div>

                    {/* API 錯誤提示 */}
                    {apiError && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{apiError}</p>
                        </div>
                    )}

                    {/* 歷史事件校準區塊 */}
                    <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsEventsExpanded(!isEventsExpanded)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📊</span>
                                <div className="text-left">
                                    <h3 className="font-bold text-amber-800 text-sm">历史事件校准（可选）</h3>
                                    <p className="text-xs text-amber-600">输入过往重大吉凶事件，帮助 AI 更精准判断喜用神</p>
                                </div>
                            </div>
                            {isEventsExpanded ? (
                                <ChevronUp className="w-5 h-5 text-amber-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-amber-600" />
                            )}
                        </button>

                        {isEventsExpanded && (
                            <div className="p-4 space-y-3 border-t border-amber-100">
                                {historicalEvents.map((event, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <select
                                            value={event.year}
                                            onChange={(e) => handleUpdateEvent(index, 'year', e.target.value)}
                                            className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                                        >
                                            {eventYearOptions.map((y) => (
                                                <option key={y} value={String(y)}>{y}</option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => handleUpdateEvent(index, 'type', event.type === 'lucky' ? 'unlucky' : 'lucky')}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                                                event.type === 'lucky'
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}
                                        >
                                            {event.type === 'lucky' ? (
                                                <>
                                                    <TrendingUp className="w-4 h-4" />
                                                    吉
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingDown className="w-4 h-4" />
                                                    凶
                                                </>
                                            )}
                                        </button>

                                        <input
                                            type="text"
                                            value={event.description}
                                            onChange={(e) => handleUpdateEvent(index, 'description', e.target.value)}
                                            placeholder="简述事件（如：升职、车祸）"
                                            className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEvent(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {historicalEvents.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={handleAddEvent}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        添加历史事件（{historicalEvents.length}/5）
                                    </button>
                                )}

                                <p className="text-xs text-gray-500 text-center pt-2">
                                    💡 提示：填写真实经历的重大吉凶年份，AI 会据此校准喜用神判断
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 主要按鈕：直接調用 API */}
                    <button
                        onClick={handleDirectApiCall}
                        disabled={!isStep1Valid || isLoading || !accessPassword.trim()}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                AI 推演中 (3-5分鐘)...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                一鍵生成人生K線
                            </>
                        )}
                    </button>

                    {/* 分隔線 */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400">或</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* 次要按鈕：手動複製模式 */}
                    <button
                        onClick={() => setStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full bg-white border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 disabled:border-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        手動複製提示詞到其他 AI <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* 步骤 2: 复制提示词 */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第二步：複製提示詞</h2>
                        <p className="text-gray-500 text-sm">將提示詞貼到任意 AI 聊天工具</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                            <div>
                                <h3 className="font-bold text-gray-800">支持的 AI 工具</h3>
                                <p className="text-sm text-gray-600">ChatGPT、Claude、Gemini、通義千問、文心一言 等</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto mb-4">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                {generateUserPrompt().substring(0, 500)}...
                            </pre>
                        </div>

                        <button
                            onClick={copyFullPrompt}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    已複製到剪貼簿！
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    複製完整提示詞
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2">使用說明</h4>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                            <li>點擊上方按鈕複製提示詞</li>
                            <li>打開任意 AI 聊天工具（如 ChatGPT）</li>
                            <li>貼上提示詞並發送</li>
                            <li>等待 AI 生成完整的 JSON 數據</li>
                            <li>複製 AI 的回覆，回到這裡進行下一步</li>
                        </ol>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            下一步：導入數據 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* 步骤 3: 导入 JSON */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第三步：導入 AI 回覆</h2>
                        <p className="text-gray-500 text-sm">貼上 AI 返回的 JSON 數據</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Upload className="w-4 h-4 inline mr-2" />
                            貼上 AI 返回的 JSON 數據
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='將 AI 返回的 JSON 數據貼到這裡...&#10;&#10;例如:&#10;{&#10;  "bazi": ["癸未", "壬戌", "丙子", "庚寅"],&#10;  "chartPoints": [...],&#10;  ...&#10;}'
                            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            生成人生K線
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportDataMode;
