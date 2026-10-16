import React, { useState } from 'react';
import { UserCriteria } from '../types/policy';
import { Sparkles, Search, Compass, MapPin } from 'lucide-react';

interface HeaderProps {
  onApplyParsedQuery: (parsed: Partial<UserCriteria>, keyword?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onApplyParsedQuery }) => {
  const [nlQuery, setNlQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  /**
   * 자연어 규칙 기반 파서 (외부 연동 축소 규칙: AI 챗봇 대신 가벼운 규칙 파서로 필터 자동 세팅)
   */
  const handleParseQuery = (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    const parsed: Partial<UserCriteria> = {};
    const appliedHighlights: string[] = [];

    // 1. 나이 파싱 (예: "25세", "만 26살", "31세")
    const ageMatch = text.match(/만?\s*(\d{1,2})\s*(?:세|살)/);
    if (ageMatch) {
      const ageNum = parseInt(ageMatch[1], 10);
      if (ageNum >= 18 && ageNum <= 39) {
        parsed.age = ageNum;
        appliedHighlights.push(`나이 만 ${ageNum}세`);
      }
    }

    // 2. 지역 파싱
    if (text.includes('수성') || text.includes('수성구')) {
      parsed.region = '수성구';
      appliedHighlights.push('대구 수성구');
    } else if (text.includes('달서') || text.includes('달서구')) {
      parsed.region = '달서구';
      appliedHighlights.push('대구 달서구');
    } else if (text.includes('달성') || text.includes('달성군')) {
      parsed.region = '달성군';
      appliedHighlights.push('대구 달성군');
    } else if (text.includes('군위') || text.includes('군위군')) {
      parsed.region = '군위군';
      appliedHighlights.push('대구 군위군');
    } else if (text.includes('중구')) {
      parsed.region = '중구';
      appliedHighlights.push('대구 중구');
    } else if (text.includes('동구')) {
      parsed.region = '동구';
      appliedHighlights.push('대구 동구');
    } else if (text.includes('서구')) {
      parsed.region = '서구';
      appliedHighlights.push('대구 서구');
    } else if (text.includes('남구')) {
      parsed.region = '남구';
      appliedHighlights.push('대구 남구');
    } else if (text.includes('북구')) {
      parsed.region = '북구';
      appliedHighlights.push('대구 북구');
    } else if (text.includes('대구')) {
      parsed.region = '대구전체';
      appliedHighlights.push('대구 전체');
    }

    // 3. 취업상태 파싱
    if (text.includes('취준') || text.includes('구직') || text.includes('미취업') || text.includes('백수')) {
      parsed.employment = '취업준비생';
      appliedHighlights.push('취업준비생');
    } else if (text.includes('재직') || text.includes('직장') || text.includes('회사') || text.includes('사회초년')) {
      parsed.employment = '재직자';
      appliedHighlights.push('재직자(사회초년생)');
    } else if (text.includes('창업') || text.includes('스타트업')) {
      parsed.employment = '창업가';
      appliedHighlights.push('청년 창업가');
    } else if (text.includes('알바') || text.includes('프리랜서')) {
      parsed.employment = '단기근로';
      appliedHighlights.push('단기근로/알바');
    }

    onApplyParsedQuery(parsed, text);

    if (appliedHighlights.length > 0) {
      setFeedback(`[자동 인식] ${appliedHighlights.join(', ')} 조건이 반영되었습니다.`);
    } else {
      setFeedback(`"${text}" 키워드로 정책을 검색합니다.`);
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParseQuery(nlQuery);
  };

  return (
    <header className="bg-white border-b border-slate-200 pt-7 pb-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                대구 2030 청년 맞춤 판정기
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                대구광역시 & 전국 온통청년
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              내 정책 타임라인
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              나이·거주지·취업상태를 입력하면 나에게 꼭 맞는 정책과 마감 D-day를 계산하고,
              <strong> 18~39세 나이 타임라인</strong> 위에서 언제까지 신청해야 하는지 한눈에 보여줍니다.
            </p>
          </div>

          {/* 청년포털 외부 링크 */}
          <div className="flex items-center gap-2 text-xs">
            <a
              href="https://www.youthcenter.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              온통청년 공식 포털
            </a>
            <a
              href="https://youth.daegu.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold transition-colors"
            >
              대구청년커뮤니티포털
            </a>
          </div>
        </div>

        {/* 자연어 빠른 조건 파서 입력창 (축소 구현) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="예: '만 26세 대구 수성구 취준생 월세 지원', '28살 북구 직장인'"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              자연어로 조건 자동완성
            </button>
          </form>

          {/* 파서 결과 피드백 뱃지 */}
          {feedback && (
            <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-block animate-in fade-in">
              {feedback}
            </div>
          )}

          {/* 예시 쿼리 태그 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-500">
            <span className="font-medium text-slate-400">추천 검색:</span>
            <button
              type="button"
              onClick={() => {
                setNlQuery('만 25세 대구 취준생 면접');
                handleParseQuery('만 25세 대구 취준생 면접');
              }}
              className="hover:text-blue-600 underline underline-offset-2 cursor-pointer"
            >
              # 만 25세 대구 취준생 면접
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => {
                setNlQuery('만 29세 대구 수성구 월세지원');
                handleParseQuery('만 29세 대구 수성구 월세지원');
              }}
              className="hover:text-blue-600 underline underline-offset-2 cursor-pointer"
            >
              # 만 29세 대구 수성구 월세지원
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => {
                setNlQuery('만 28세 대구 달서구 창업지원');
                handleParseQuery('만 28세 대구 달서구 창업지원');
              }}
              className="hover:text-blue-600 underline underline-offset-2 cursor-pointer"
            >
              # 만 28세 대구 달서구 창업지원
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
