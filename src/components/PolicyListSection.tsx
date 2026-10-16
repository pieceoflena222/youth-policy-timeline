import React, { useState } from 'react';
import { Policy, UserCriteria } from '../types/policy';
import { PolicyCard } from './PolicyCard';
import { calculateDDay, matchPolicy } from '../utils/policyHelpers';
import {
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  AlertCircle,
  Inbox,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface PolicyListSectionProps {
  policies: Policy[];
  criteria: UserCriteria;
  onSelectPolicy: (policy: Policy) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onResetCriteria: () => void;
}

export const PolicyListSection: React.FC<PolicyListSectionProps> = ({
  policies,
  criteria,
  onSelectPolicy,
  isLoading,
  error,
  onRetry,
  onResetCriteria,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [onlyMatched, setOnlyMatched] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'dday' | 'age-deadline' | 'title'>('dday');

  const categories = ['전체', '일자리', '주거', '교육', '복지문화', '참여권리'];

  // 필터링 및 정렬 처리
  const processed = policies
    .map((policy) => {
      const match = matchPolicy(policy, criteria);
      const dday = calculateDDay(policy.applyEnd);
      return { policy, match, dday };
    })
    .filter(({ policy, match }) => {
      // 1. 일치 여부 필터
      if (onlyMatched && !match.isMatch) return false;

      // 2. 카테고리 필터
      if (selectedCategory !== '전체' && policy.category !== selectedCategory) return false;

      // 3. 검색어 필터
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const inTitle = policy.title.toLowerCase().includes(kw);
        const inSummary = policy.summary.toLowerCase().includes(kw);
        const inContent = policy.supportContent.toLowerCase().includes(kw);
        const inRegion = policy.region.toLowerCase().includes(kw);
        if (!inTitle && !inSummary && !inContent && !inRegion) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dday') {
        // 긴급 마감순 (오늘 마감 및 D-day 양수 중 가장 작은 수 우선, 그 다음 상시, 그 다음 마감)
        const dayA = a.dday.days !== null ? (a.dday.days < 0 ? 9999 + Math.abs(a.dday.days) : a.dday.days) : 999;
        const dayB = b.dday.days !== null ? (b.dday.days < 0 ? 9999 + Math.abs(b.dday.days) : b.dday.days) : 999;
        return dayA - dayB;
      } else if (sortBy === 'age-deadline') {
        // 나이 마감 임박순 (내 나이와 최대 나이 차이가 작은 순서)
        const diffA = a.match.ageDifferenceToMax !== null ? a.match.ageDifferenceToMax : 99;
        const diffB = b.match.ageDifferenceToMax !== null ? b.match.ageDifferenceToMax : 99;
        return diffA - diffB;
      } else {
        return a.policy.title.localeCompare(b.policy.title, 'ko');
      }
    });

  return (
    <section className="mt-8">
      {/* 섹션 헤더 & 필터 바 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                2
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                맞춤 청년정책 목록 ({processed.length}건)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              신청 자격 일치 항목과 신청 마감 D-day가 표시됩니다.
            </p>
          </div>

          {/* 검색창 */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="정책명, 지원내용, 지역 검색..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 탭 & 컨트롤 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
          {/* 카테고리 칩 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 정렬 및 일치 토글 */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setOnlyMatched(!onlyMatched)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                onlyMatched
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {onlyMatched ? '내 조건 일치만' : '전체 보기'}
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 pl-2 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" /> 정렬:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-transparent border-none text-slate-700 font-semibold py-1 pr-2 focus:outline-none cursor-pointer"
              >
                <option value="dday">신청마감 임박순</option>
                <option value="age-deadline">만 나이 마감 임박순</option>
                <option value="title">가나다순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 상태 1: 로딩 상태 */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between h-56"
            >
              <div>
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  <div className="h-5 w-20 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-md mb-2" />
                <div className="h-4 w-full bg-slate-100 rounded-md mb-1" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
              </div>
              <div className="h-9 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* 상태 2: 에러 상태 */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-red-900">정책 데이터를 불러오지 못했습니다</h3>
          <p className="text-xs sm:text-sm text-red-700 mt-1 max-w-md mx-auto">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              다시 시도하기
            </button>
            <button
              onClick={onResetCriteria}
              className="px-4 py-2 bg-white border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              조건 초기화
            </button>
          </div>
        </div>
      )}

      {/* 상태 3: 빈 결과 상태 (Empty State) */}
      {!isLoading && !error && processed.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            조건에 맞는 정책이 없습니다
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {onlyMatched
              ? '현재 입력하신 나이, 지역, 취업상태에 맞는 정책이 없습니다. "전체 보기"로 전환하거나 조건을 변경해보세요.'
              : '입력하신 검색어 또는 카테고리에 해당하는 정책이 없습니다.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            {onlyMatched && (
              <button
                type="button"
                onClick={() => setOnlyMatched(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                전체 정책 {policies.length}건 둘러보기
              </button>
            )}
            <button
              type="button"
              onClick={onResetCriteria}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              조건 초기화
            </button>
          </div>
        </div>
      )}

      {/* 정상 카드 그리드: 모바일 1열 · 태블릿 2열 · PC 3열 */}
      {!isLoading && !error && processed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processed.map(({ policy }) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              criteria={criteria}
              onSelect={onSelectPolicy}
            />
          ))}
        </div>
      )}
    </section>
  );
};
