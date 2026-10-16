import React, { useState } from 'react';
import { Policy, UserCriteria } from '../types/policy';
import { calculateDDay, matchPolicy } from '../utils/policyHelpers';
import { Clock, AlertTriangle, ChevronRight, Sparkles, Filter } from 'lucide-react';

interface AgeTimelineViewProps {
  policies: Policy[];
  criteria: UserCriteria;
  onSelectPolicy: (policy: Policy) => void;
}

export const AgeTimelineView: React.FC<AgeTimelineViewProps> = ({
  policies,
  criteria,
  onSelectPolicy,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [showOnlyMatched, setShowOnlyMatched] = useState<boolean>(true);

  // 타임라인 기준 연령 축: 18세부터 39세까지
  const minAxisAge = 18;
  const maxAxisAge = 39;
  const totalAgeSpan = maxAxisAge - minAxisAge; // 21 years

  // 현재 사용자 나이의 퍼센트 위치
  const clampedUserAge = Math.min(Math.max(criteria.age, minAxisAge), maxAxisAge);
  const userAgePercent = ((clampedUserAge - minAxisAge) / totalAgeSpan) * 100;

  // 정책 필터링
  const processedPolicies = policies.map((policy) => {
    const match = matchPolicy(policy, criteria);
    const dday = calculateDDay(policy.applyEnd);
    const minAge = policy.targetAge?.min ?? 19;
    const maxAge = policy.targetAge?.max ?? 39;

    // 타임라인 상의 시작/너비 % 계산
    const startAgeClamped = Math.max(minAge, minAxisAge);
    const endAgeClamped = Math.min(maxAge, maxAxisAge);
    const leftPercent = ((startAgeClamped - minAxisAge) / totalAgeSpan) * 100;
    const widthPercent = Math.max(
      ((endAgeClamped - startAgeClamped) / totalAgeSpan) * 100,
      4.5 // 최소 가시성 확보
    );

    return {
      policy,
      match,
      dday,
      minAge,
      maxAge,
      leftPercent,
      widthPercent,
      isEndingSoon: match.isAgeEndingSoon && match.isMatch,
      yearsLeft: match.ageDifferenceToMax,
    };
  });

  const filtered = processedPolicies.filter((item) => {
    if (showOnlyMatched && !item.match.isMatch) return false;
    if (filterCategory !== '전체' && item.policy.category !== filterCategory) return false;
    return true;
  });

  // 곧 자격이 끝나는 긴급 정책 목록 (내 나이가 상한선 2년 이내)
  const urgentEndingPolicies = processedPolicies.filter(
    (p) => p.isEndingSoon && p.yearsLeft !== null && p.yearsLeft <= 2 && p.yearsLeft >= 0
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '일자리':
        return {
          bg: 'bg-blue-500',
          lightBg: 'bg-blue-50',
          border: 'border-blue-400',
          text: 'text-blue-700',
        };
      case '주거':
        return {
          bg: 'bg-emerald-500',
          lightBg: 'bg-emerald-50',
          border: 'border-emerald-400',
          text: 'text-emerald-700',
        };
      case '교육':
        return {
          bg: 'bg-purple-500',
          lightBg: 'bg-purple-50',
          border: 'border-purple-400',
          text: 'text-purple-700',
        };
      case '복지문화':
        return {
          bg: 'bg-amber-500',
          lightBg: 'bg-amber-50',
          border: 'border-amber-400',
          text: 'text-amber-700',
        };
      case '참여권리':
        return {
          bg: 'bg-rose-500',
          lightBg: 'bg-rose-50',
          border: 'border-rose-400',
          text: 'text-rose-700',
        };
      default:
        return {
          bg: 'bg-slate-500',
          lightBg: 'bg-slate-50',
          border: 'border-slate-400',
          text: 'text-slate-700',
        };
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all mt-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              3
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              청년 나이 타임라인 뷰 (18~39세)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            현재 내 나이(만 {criteria.age}세) 기준 지원 연령 구간과 <strong>"몇 살 전에 꼭 신청해야 하는지"</strong>를 한눈에 비교합니다.
          </p>
        </div>

        {/* 필터 제어 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyMatched(!showOnlyMatched)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              showOnlyMatched
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            {showOnlyMatched ? '내 조건 일치 정책만 보기' : '전체 정책 보기'}
          </button>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="전체">분야 전체</option>
            <option value="일자리">일자리</option>
            <option value="주거">주거</option>
            <option value="교육">교육</option>
            <option value="복지문화">복지문화</option>
            <option value="참여권리">참여권리</option>
          </select>
        </div>
      </div>

      {/* 곧 자격이 끝나는 정책 강조 알림 바 */}
      {urgentEndingPolicies.length > 0 && (
        <div className="mt-4 p-3.5 bg-linear-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-xl shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                ⏳ 나이 상한선 임박! 내 나이(만 {criteria.age}세)에서 곧 신청 기회가 끝나는 정책 ({urgentEndingPolicies.length}건)
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                청년 정책 중 <strong>만 34세</strong> 기준이 적용되는 사업이 많습니다. 나이를 넘기면 다시 신청할 수 없으니 마감 전에 우선 신청하세요!
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {urgentEndingPolicies.slice(0, 3).map((item) => (
                  <button
                    key={item.policy.id}
                    onClick={() => onSelectPolicy(item.policy)}
                    className="text-xs px-2.5 py-1 bg-white border border-amber-300 rounded-md font-medium text-amber-900 hover:bg-amber-100/70 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>{item.policy.title}</span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                      만 {item.maxAge}세까지 ({item.yearsLeft === 0 ? '올해 마감' : `${item.yearsLeft}년 남음`})
                    </span>
                    <ChevronRight className="w-3 h-3 text-amber-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 타임라인 메인 시각화 컨테이너 */}
      <div className="mt-6 overflow-x-auto pb-4">
        <div className="min-w-[680px] relative px-4">
          {/* 상단 나이 눈금 가로축 */}
          <div className="relative h-8 border-b-2 border-slate-300 mb-4 select-none">
            {Array.from({ length: totalAgeSpan + 1 }).map((_, idx) => {
              const age = minAxisAge + idx;
              const percent = (idx / totalAgeSpan) * 100;
              const isMajor = age % 5 === 0 || age === 19 || age === 34 || age === 39;
              const isCurrent = age === criteria.age;

              return (
                <div
                  key={age}
                  className="absolute transform -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${percent}%` }}
                >
                  <div
                    className={`w-0.5 ${
                      isCurrent
                        ? 'h-4 bg-blue-600 font-bold'
                        : isMajor
                        ? 'h-3 bg-slate-400'
                        : 'h-1.5 bg-slate-200'
                    }`}
                  />
                  {(isMajor || isCurrent) && (
                    <span
                      className={`text-[11px] font-mono mt-0.5 ${
                        isCurrent
                          ? 'font-extrabold text-blue-700 bg-blue-100 px-1 rounded'
                          : 'text-slate-500 font-medium'
                      }`}
                    >
                      {age}세
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 현재 내 나이 세로 강조선 (모든 막대를 관통) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center transition-all duration-300"
            style={{ left: `calc(${userAgePercent}% + 16px)` }}
          >
            {/* 상단 핀 뱃지 */}
            <div className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap transform -translate-x-1/2 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              현재 만 {criteria.age}세
            </div>
            {/* 세로선 본체 */}
            <div className="w-0.5 h-full bg-blue-500/80 dashed-line border-l-2 border-dashed border-blue-600" />
          </div>

          {/* 정책 막대 목록 */}
          <div className="space-y-3.5 pt-2 relative z-10">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                해당 조건에 맞는 정책이 없습니다. 상단의 필터를 조정해보세요.
              </div>
            ) : (
              filtered.map(({ policy, match, dday, minAge, maxAge, leftPercent, widthPercent, isEndingSoon, yearsLeft }) => {
                const colors = getCategoryColor(policy.category);

                return (
                  <div
                    key={policy.id}
                    onClick={() => onSelectPolicy(policy)}
                    className={`group relative bg-slate-50/70 hover:bg-white rounded-xl p-2.5 border transition-all cursor-pointer ${
                      isEndingSoon
                        ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/30'
                        : match.isMatch
                        ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                        : 'border-slate-100 opacity-60'
                    }`}
                  >
                    {/* 정보 텍스트 상단 줄 */}
                    <div className="flex items-center justify-between text-xs mb-1.5 px-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${colors.lightBg} ${colors.text}`}>
                          {policy.category}
                        </span>
                        <span className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {policy.title}
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          ({policy.region})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isEndingSoon && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">
                            🚨 만 {maxAge}세 마감임박 ({yearsLeft === 0 ? '올해 끝' : `${yearsLeft}년 남음`})
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            dday.isUrgent
                              ? 'bg-red-100 text-red-700'
                              : dday.isAlways
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {dday.label}
                        </span>
                      </div>
                    </div>

                    {/* 타임라인 연령 막대 트랙 */}
                    <div className="relative h-6 bg-slate-200/70 rounded-full overflow-hidden w-full">
                      {/* 정책 지원 연령 막대 */}
                      <div
                        className={`absolute top-0 bottom-0 rounded-full flex items-center justify-between px-2 text-[10px] font-bold text-white shadow-xs transition-all ${
                          colors.bg
                        } ${isEndingSoon ? 'ring-2 ring-amber-400' : ''}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <span className="truncate">{minAge}세</span>
                        <span className="truncate font-mono">{maxAge}세</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">분야 범례:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 일자리
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 주거
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> 교육
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 복지문화
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> 참여권리
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          * 막대를 클릭하면 지원 내용 및 신청 링크를 확인하실 수 있습니다.
        </div>
      </div>
    </section>
  );
};
