
import React from 'react';
import { AnalysisData, RecentYearFortune } from '../types';
import { ScrollText, Briefcase, Coins, Heart, Activity, Users, Star, Info, Brain, Bitcoin, Compass, TrendingUp } from 'lucide-react';

interface AnalysisResultProps {
  analysis: AnalysisData;
}

const ScoreBar = ({ score }: { score: number }) => {
  // 自动检测评分制度：如果 score > 10，认为是百分制，需要转换为十分制
  const normalizedScore = score > 10 ? Math.round(score / 10) : score;

  // Color based on normalized score (0-10)
  let colorClass = "bg-gray-300";
  if (normalizedScore >= 9) colorClass = "bg-green-500";
  else if (normalizedScore >= 7) colorClass = "bg-indigo-500";
  else if (normalizedScore >= 5) colorClass = "bg-yellow-500";
  else if (normalizedScore >= 3) colorClass = "bg-orange-500";
  else colorClass = "bg-red-500";

  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${normalizedScore * 10}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 min-w-[2.5rem] text-right">
        {normalizedScore} / 10
      </span>
    </div>
  );
};


// 获取评分对应的颜色样式
const getScoreColor = (score: number) => {
  if (score >= 9) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: '大吉' };
  if (score >= 7) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: '吉' };
  if (score >= 5) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: '平' };
  if (score >= 3) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: '凶' };
  return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '大凶' };
};

// 近十年运势卡片组件
const YearFortuneCard = ({ fortune, isCurrentYear }: { fortune: RecentYearFortune; isCurrentYear: boolean }) => {
  const colors = getScoreColor(fortune.score);

  return (
    <div
      className={`flex-shrink-0 w-[140px] p-3 rounded-lg border-2 transition-all ${colors.bg} ${colors.border} ${
        isCurrentYear ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : ''
      }`}
    >
      {/* 年份和干支 */}
      <div className="text-center mb-2">
        <div className={`text-lg font-bold ${colors.text}`}>{fortune.year}</div>
        <div className="text-xs text-gray-600">{fortune.ganZhi}年 · {fortune.age}岁</div>
      </div>

      {/* 评分 */}
      <div className="text-center mb-2">
        <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${colors.bg} ${colors.text}`}>
          {fortune.score}分 · {colors.label}
        </span>
      </div>

      {/* 紫微流年星 */}
      <div className="text-xs text-center text-indigo-600 font-medium mb-1 truncate" title={fortune.ziWeiStar}>
        ⭐ {fortune.ziWeiStar}
      </div>

      {/* 重点提示 */}
      <div className="text-xs text-gray-700 text-center mb-1 line-clamp-2" title={fortune.highlight}>
        {fortune.highlight}
      </div>

      {/* 建议 */}
      <div className="text-xs text-gray-500 text-center italic line-clamp-2" title={fortune.advice}>
        💡 {fortune.advice}
      </div>
    </div>
  );
};

const Card = ({ title, icon: Icon, content, score, colorClass, extraBadges }: any) => {
  let displayContent: React.ReactNode;

  if (React.isValidElement(content)) {
    displayContent = content;
  } else {
    // Clean content: remove markdown bold symbols (**) to ensure uniform plain text look
    // Ensure content is a string before calling replace to avoid "content.replace is not a function" error
    let safeContent = '';

    if (typeof content === 'string') {
      safeContent = content;
    } else if (content === null || content === undefined) {
      safeContent = '';
    } else if (typeof content === 'object') {
      // If AI returns an object or array (unexpected but possible), stringify it readable
      try {
        // If it's a simple array of strings, join them
        if (Array.isArray(content)) {
          safeContent = content.map((c: any) => String(c)).join('\n');
        } else {
          // Fallback for object
          safeContent = JSON.stringify(content);
        }
      } catch (e) {
        safeContent = String(content);
      }
    } else {
      safeContent = String(content);
    }

    displayContent = safeContent.replace(/\*\*/g, '');
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden">
      <div className={`flex items-center justify-between mb-3 ${colorClass}`}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="font-serif-sc font-bold text-lg">{title}</h3>
        </div>
        <Star className="w-4 h-4 opacity-50" />
      </div>

      {/* Extra Badges for Crypto */}
      {extraBadges && (
        <div className="flex flex-wrap gap-2 mb-3">
          {extraBadges}
        </div>
      )}

      <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap flex-grow">
        {displayContent}
      </div>
      {typeof score === 'number' && (
        <div className="pt-4 mt-2 border-t border-gray-50">
          <div className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Rating</div>
          <ScoreBar score={score} />
        </div>
      )}
    </div>
  );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis }) => {
  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Bazi Pillars */}
      <div className="flex justify-center gap-2 md:gap-8 bg-gray-900 text-amber-50 p-6 rounded-xl shadow-lg overflow-x-auto">
        {analysis.bazi.map((pillar, index) => {
          const labels = ['年柱', '月柱', '日柱', '时柱'];
          return (
            <div key={index} className="text-center min-w-[60px]">
              <div className="text-xs text-gray-400 mb-1">{labels[index]}</div>
              <div className="text-xl md:text-3xl font-serif-sc font-bold tracking-widest">{pillar}</div>
            </div>
          );
        })}
      </div>

      {/* Summary with Score */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="flex items-center gap-2 font-serif-sc font-bold text-xl text-indigo-900">
            <ScrollText className="w-5 h-5" />
            命理总评
          </h3>
          <div className="w-full md:w-1/3">
            <ScoreBar score={analysis.summaryScore} />
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{analysis.summary}</p>
      </div>

      {/* 近十年運勢近況（紫微斗數）*/}
      {analysis.ziWeiCore && analysis.recentYears && analysis.recentYears.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
          {/* 标题 */}
          <h3 className="flex items-center gap-2 font-serif-sc font-bold text-xl text-purple-900 mb-4">
            <TrendingUp className="w-5 h-5" />
            近十年運勢近況（紫微斗數）
          </h3>

          {/* 紫微核心信息 */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div>
                <span className="text-gray-500">命宫：</span>
                <span className="font-bold text-purple-700">{analysis.ziWeiCore.mingGong}</span>
              </div>
              <div>
                <span className="text-gray-500">财帛宫：</span>
                <span className="font-bold text-amber-700">{analysis.ziWeiCore.caiBaiGong}</span>
              </div>
              <div>
                <span className="text-gray-500">官禄宫：</span>
                <span className="font-bold text-blue-700">{analysis.ziWeiCore.guanLuGong}</span>
              </div>
              <div>
                <span className="text-gray-500">夫妻宫：</span>
                <span className="font-bold text-pink-700">{analysis.ziWeiCore.fuQiGong}</span>
              </div>
            </div>
            <div className="text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-500">格局：</span>
              <span className="font-bold text-indigo-700">{analysis.ziWeiCore.overallPattern}</span>
            </div>
          </div>

          {/* 十年运势卡片 - 横向滚动 */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {analysis.recentYears.map((fortune, index) => (
                <YearFortuneCard
                  key={index}
                  fortune={fortune}
                  isCurrentYear={fortune.year === new Date().getFullYear()}
                />
              ))}
            </div>
          </div>

          {/* 图例说明 */}
          <div className="flex flex-wrap gap-2 mt-4 text-xs justify-center">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">9-10分 大吉</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">7-8分 吉</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">5-6分 平</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">3-4分 凶</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">1-2分 大凶</span>
          </div>
        </div>
      )}

      {/* Grid for categorical analysis with Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Crypto Analysis */}
        <Card
          title="币圈交易运势"
          icon={Bitcoin}
          content={analysis.crypto}
          score={analysis.cryptoScore}
          colorClass="text-amber-600"
          extraBadges={
            <>
              <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded border border-amber-200">
                🔥 暴富流年: {analysis.cryptoYear}
              </span>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-200">
                🎯 推荐: {analysis.cryptoStyle}
              </span>
            </>
          }
        />

        <Card
          title="性格分析"
          icon={Brain}
          content={analysis.personality}
          score={analysis.personalityScore}
          colorClass="text-teal-600"
        />
        <Card
          title="事业行业"
          icon={Briefcase}
          content={analysis.industry}
          score={analysis.industryScore}
          colorClass="text-blue-600"
        />

        {/* Feng Shui Analysis */}
        <Card
          title="发展风水"
          icon={Compass}
          content={analysis.fengShui}
          score={analysis.fengShuiScore}
          colorClass="text-cyan-700"
        />

        <Card
          title="财富层级"
          icon={Coins}
          content={analysis.wealth}
          score={analysis.wealthScore}
          colorClass="text-amber-600"
        />
        <Card
          title="婚姻情感"
          icon={Heart}
          content={analysis.marriage}
          score={analysis.marriageScore}
          colorClass="text-pink-600"
        />
        <Card
          title="身体健康"
          icon={Activity}
          content={analysis.health}
          score={analysis.healthScore}
          colorClass="text-emerald-600"
        />
        <Card
          title="六亲关系"
          icon={Users}
          content={analysis.family}
          score={analysis.familyScore}
          colorClass="text-purple-600"
        />

        {/* Static Score Explanation Card */}
        <Card
          title="评分讲解"
          icon={Info}
          colorClass="text-gray-600"
          content={
            <div className="space-y-4">
              <ul className="space-y-1.5 font-mono text-xs md:text-sm">
                <li className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span>0-2分</span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-bold">极差</span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span>3-4分</span>
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">差</span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span>5-6分</span>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-bold">一般</span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span>7-8分</span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded font-bold">好</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>9-10分</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded font-bold">极好</span>
                </li>
              </ul>
              <p className="text-xs text-black leading-relaxed border-t border-gray-100 pt-2 text-justify">
                注：命运还受环境和个人选择影响，八字趋势不能完全代表真实人生，命理学不是玄学，而是帮助我们在人生列车上做出更好选择的哲学工具。一命二运三风水 四积阴德五读书 六名七相八敬神 九遇贵人十养生。
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default AnalysisResult;
