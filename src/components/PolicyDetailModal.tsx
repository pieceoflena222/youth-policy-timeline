import React from 'react';
import { Policy, UserCriteria } from '../types/policy';
import { calculateDDay, downloadIcsCalendar, matchPolicy } from '../utils/policyHelpers';
import {
  X,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building2,
  Home,
  Briefcase,
  Share2,
} from 'lucide-react';

interface PolicyDetailModalProps {
  policy: Policy | null;
  criteria: UserCriteria;
  onClose: () => void;
}

export const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policy,
  criteria,
  onClose,
}) => {
  if (!policy) return null;

  const match = matchPolicy(policy, criteria);
  const dday = calculateDDay(policy.applyEnd);

  // 대구 구·군 또는 정책 지역 기준 지도 검색 링크 (외부 연동 축소 규칙)
  const mapSearchUrl = `https://map.kakao.com/link/search/${encodeURIComponent(
    policy.region?.includes('대구') ? policy.region : '대구광역시 청년센터'
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* 모달 상단 헤더 */}
        <div className="p-6 pb-4 bg-linear-to-b from-slate-50 to-white border-b border-slate-100 relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              {policy.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {policy.region || '대구광역시'}
            </span>
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                dday.isUrgent
                  ? 'bg-red-500 text-white'
                  : dday.isAlways
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {dday.label}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pr-8">
            {policy.title}
          </h2>

          {policy.subCategory && (
            <p className="text-xs text-slate-500 mt-1">분류: {policy.subCategory}</p>
          )}
        </div>

        {/* 모달 본문 */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 내 조건 적합도 판정 박스 */}
          <div
            className={`p-4 rounded-2xl border ${
              match.isMatch
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${match.isMatch ? 'text-emerald-600' : 'text-amber-600'}`}
                />
                내 조건 맞춤 판정 결과 ({match.matchScore}% 적합)
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-white/80">
                {match.isMatch ? '신청 권장' : '일부 요건 확인 필요'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {match.matchedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-white rounded-md font-medium text-emerald-800 border border-emerald-200/60 shadow-2xs"
                >
                  ✓ {tag.label}
                </span>
              ))}
              {match.unmatchedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-amber-100 rounded-md font-medium text-amber-900 border border-amber-200 shadow-2xs"
                >
                  ✕ {tag.label}
                </span>
              ))}
            </div>

            {match.isAgeEndingSoon && match.isMatch && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>나이 마감 주의:</strong> 귀하의 연령(만 {criteria.age}세)은 해당 사업 상한(만{' '}
                  {policy.targetAge?.max}세)에 도달하여 마감 임박 상태입니다.
                </span>
              </div>
            )}
          </div>

          {/* 지원 내용 상세 */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-600" />
              지원 내용 & 혜택
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-200/70 whitespace-pre-line">
              {policy.supportContent || policy.summary || '상세 공고 내용을 확인해주세요.'}
            </div>
          </div>

          {/* 신청 자격 및 요건 */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              신청 자격 & 대상자 요건
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-200/70 space-y-2">
              <div>
                <strong className="text-slate-900">연령 기준: </strong>
                <span>
                  {policy.targetAge
                    ? `만 ${policy.targetAge.min ?? 18}세 ~ ${policy.targetAge.max ?? 39}세`
                    : '연령 제한 없음'}
                </span>
              </div>
              <div>
                <strong className="text-slate-900">거주지/참여 요건: </strong>
                <span>{policy.targetCondition}</span>
              </div>
              {policy.employmentCondition && (
                <div>
                  <strong className="text-slate-900">취업 상태: </strong>
                  <span>{policy.employmentCondition}</span>
                </div>
              )}
              {policy.educationCondition && (
                <div>
                  <strong className="text-slate-900">학력 요건: </strong>
                  <span>{policy.educationCondition}</span>
                </div>
              )}
            </div>
          </div>

          {/* 신청 기간 & 일정 */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              신청 기간
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span>시작: {policy.applyStart || '공고시'}</span>
                <span className="mx-2 text-slate-400">~</span>
                <span>
                  마감: <strong>{policy.applyEnd || '상시접수(예산 소진 시까지)'}</strong>
                </span>
              </div>
              {policy.applyEnd && (
                <button
                  type="button"
                  onClick={() => downloadIcsCalendar(policy)}
                  className="text-xs px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  캘린더 등록 (.ics)
                </button>
              )}
            </div>
          </div>

          {/* 외부 축소 연동 링크 (공공데이터 포털 & 지도 & LH) */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              관할 기관 위치 지도 검색 (카카오맵)
            </a>
            {policy.category === '주거' && (
              <a
                href="https://www.myhome.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                마이홈 청년임대주택 공공데이터 포털
              </a>
            )}
          </div>
        </div>

        {/* 모달 하단 버튼 */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            닫기
          </button>

          <a
            href={policy.applyUrl || 'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>공식 사이트에서 신청하기</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
