import React from 'react';
import { Policy, UserCriteria } from '../types/policy';
import { calculateDDay, downloadIcsCalendar, matchPolicy } from '../utils/policyHelpers';
import {
  Calendar,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface PolicyCardProps {
  policy: Policy;
  criteria: UserCriteria;
  onSelect: (policy: Policy) => void;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({ policy, criteria, onSelect }) => {
  const match = matchPolicy(policy, criteria);
  const dday = calculateDDay(policy.applyEnd);

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case '일자리':
        return { badge: 'bg-blue-100 text-blue-700 border-blue-200', border: 'hover:border-blue-300' };
      case '주거':
        return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', border: 'hover:border-emerald-300' };
      case '교육':
        return { badge: 'bg-purple-100 text-purple-700 border-purple-200', border: 'hover:border-purple-300' };
      case '복지문화':
        return { badge: 'bg-amber-100 text-amber-700 border-amber-200', border: 'hover:border-amber-300' };
      case '참여권리':
        return { badge: 'bg-rose-100 text-rose-700 border-rose-200', border: 'hover:border-rose-300' };
      default:
        return { badge: 'bg-slate-100 text-slate-700 border-slate-200', border: 'hover:border-slate-300' };
    }
  };

  const theme = getCategoryTheme(policy.category);

  return (
    <article
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
        match.isAgeEndingSoon && match.isMatch
          ? 'border-amber-300 ring-2 ring-amber-200/70'
          : match.isMatch
          ? 'border-slate-200 ' + theme.border
          : 'border-slate-200/80 opacity-75'
      }`}
    >
      {/* 상단 헤더: 카테고리 + 지역 + D-day 배지 */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}>
              {policy.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              {policy.region || '전국/대구'}
            </span>
          </div>

          {/* D-day 배지 */}
          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 ${
              dday.isUrgent
                ? 'bg-red-500 text-white animate-pulse shadow-xs'
                : dday.isAlways
                ? 'bg-slate-100 text-slate-600'
                : dday.isExpired
                ? 'bg-slate-200 text-slate-500'
                : 'bg-blue-600 text-white shadow-xs'
            }`}
          >
            <Clock className="w-3 h-3" />
            {dday.label}
          </span>
        </div>

        {/* 정책 제목 */}
        <h3
          onClick={() => onSelect(policy)}
          className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
        >
          {policy.title}
        </h3>

        {/* 요약 설명 */}
        <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {policy.summary || policy.supportContent}
        </p>

        {/* 만 나이 자격 마감 경고 (만약 곧 나이가 끝나는 경우) */}
        {match.isAgeEndingSoon && match.isMatch && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              만 {policy.targetAge?.max}세 마감까지 {match.ageDifferenceToMax === 0 ? '올해 마지막!' : `${match.ageDifferenceToMax}년 남음!`}
            </span>
          </div>
        )}

        {/* 일치 조건 태그 리스트 */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            내 조건 일치 판정:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-medium border border-emerald-200/60"
              >
                ✓ {tag.label}
              </span>
            ))}
            {match.unmatchedTags.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                {match.unmatchedTags[0].label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 하단 액션 버튼 그룹 */}
      <div className="p-4 pt-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(policy)}
          className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center"
        >
          자세히 보기
        </button>

        {/* 캘린더(.ics) 다운로드 버튼 (외부 연동 축소 규칙) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadIcsCalendar(policy);
          }}
          title="캘린더 일정에 마감일 추가 (.ics 파일 다운로드)"
          className="p-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* 공식 신청 링크 바로가기 */}
        <a
          href={policy.applyUrl || 'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch'}
          target="_blank"
          rel="noopener noreferrer"
          title="공식 신청 사이트로 이동"
          className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
};
