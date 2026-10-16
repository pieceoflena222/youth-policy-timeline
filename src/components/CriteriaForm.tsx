import React from 'react';
import { UserCriteria } from '../types/policy';
import {
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Coins,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CriteriaFormProps {
  criteria: UserCriteria;
  onChange: (newCriteria: UserCriteria) => void;
  onReset: () => void;
  matchedCount: number;
  totalCount: number;
}

export const CriteriaForm: React.FC<CriteriaFormProps> = ({
  criteria,
  onChange,
  onReset,
  matchedCount,
  totalCount,
}) => {
  const applyPreset = (preset: Partial<UserCriteria>) => {
    onChange({ ...criteria, ...preset });
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              내 조건 입력 (5개 항목)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            나이·지역·취업상태·학력·소득을 입력하면 해당 정책만 실시간 선별 판정합니다.
          </p>
        </div>

        {/* 판정 결과 요약 뱃지 & 리셋 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm font-semibold text-blue-800">
            신청 가능 <span className="text-blue-600 font-bold">{matchedCount}</span>건 / 전체 {totalCount}건
          </div>
          <button
            onClick={onReset}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="조건 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 빠른 프리셋 버튼 */}
      <div className="pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>대구 청년 빠른 선택 프리셋:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              applyPreset({
                age: 25,
                region: '수성구',
                employment: '취업준비생',
                education: '대학졸업',
                income: '100이하',
              })
            }
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-transparent rounded-full font-medium text-slate-700 transition-colors cursor-pointer"
          >
            🎓 대구 수성구 취준생 (만 25세)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                age: 28,
                region: '북구',
                employment: '재직자',
                education: '대학졸업',
                income: '120이하',
              })
            }
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-transparent rounded-full font-medium text-slate-700 transition-colors cursor-pointer"
          >
            💼 대구 산단 사회초년생 (만 28세)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                age: 33,
                region: '중구',
                employment: '재직자',
                education: '무관',
                income: '150이하',
              })
            }
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-transparent rounded-full font-medium text-slate-700 transition-colors cursor-pointer"
          >
            ⏳ 만 34세 마감 직전 청년 (만 33세)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                age: 29,
                region: '달서구',
                employment: '창업가',
                education: '대학졸업',
                income: '무관',
              })
            }
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-transparent rounded-full font-medium text-slate-700 transition-colors cursor-pointer"
          >
            🚀 대구 달서구 청년 창업가 (만 29세)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                age: 24,
                region: '군위군',
                employment: '취업준비생',
                education: '무관',
                income: '무관',
              })
            }
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300 border border-transparent rounded-full font-medium text-slate-700 transition-colors cursor-pointer"
          >
            🌿 대구 군위군 정착 청년 (만 24세)
          </button>
        </div>
      </div>

      {/* 5대 조건 폼 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        {/* 1. 나이 입력 */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              ① 내 나이 (만 나이)
            </label>
            <span className="text-sm font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
              만 {criteria.age}세
            </span>
          </div>
          <input
            type="range"
            min={18}
            max={39}
            value={criteria.age}
            onChange={(e) => onChange({ ...criteria, age: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>18세</span>
            <span>25세</span>
            <span>34세</span>
            <span>39세</span>
          </div>
        </div>

        {/* 2. 거주지 선택 */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            ② 거주 지역 (대구)
          </label>
          <select
            value={criteria.region}
            onChange={(e) => onChange({ ...criteria, region: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="대구전체">대구광역시 전체</option>
            <option value="수성구">대구 수성구</option>
            <option value="달서구">대구 달서구</option>
            <option value="중구">대구 중구</option>
            <option value="동구">대구 동구</option>
            <option value="서구">대구 서구</option>
            <option value="남구">대구 남구</option>
            <option value="북구">대구 북구</option>
            <option value="달성군">대구 달성군</option>
            <option value="군위군">대구 군위군</option>
            <option value="전국">전국 (대구 외 거주)</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {criteria.region.includes('구') || criteria.region.includes('군')
              ? `대구 ${criteria.region} 자치구·군 전용 특화정책 포함`
              : '대구시 전역 지원 정책 포함'}
          </p>
        </div>

        {/* 3. 취업상태 선택 */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            ③ 취업 상태
          </label>
          <select
            value={criteria.employment}
            onChange={(e) => onChange({ ...criteria, employment: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="취업준비생">취업준비생 (미취업/구직)</option>
            <option value="재직자">재직자 (사회초년생/중소기업)</option>
            <option value="창업가">창업가 (예비창업/스타트업)</option>
            <option value="단기근로">단기근로 (알바/프리랜서)</option>
            <option value="무관">제한없음 / 무관</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            {criteria.employment === '취업준비생' ? '구직수당, 면접정장 등 매칭' : '소득세 감면, 재직자 통장 등 매칭'}
          </p>
        </div>

        {/* 4. 최종 학력 선택 */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            ④ 학력 조건
          </label>
          <select
            value={criteria.education}
            onChange={(e) => onChange({ ...criteria, education: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="대학졸업">대학(원) 졸업 / 예정</option>
            <option value="대학재학">대학(원) 재학 / 휴학</option>
            <option value="고졸이하">고졸 이하</option>
            <option value="무관">학력 제한없음</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            대부분 정책이 학력 무관으로 지원 가능
          </p>
        </div>

        {/* 5. 소득 기준 선택 */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            ⑤ 가구 소득 수준
          </label>
          <select
            value={criteria.income}
            onChange={(e) => onChange({ ...criteria, income: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="100이하">기준중위소득 100% 이하</option>
            <option value="120이하">기준중위소득 120% 이하</option>
            <option value="150이하">기준중위소득 150% 이하</option>
            <option value="무관">소득 무관 / 미확인</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            월세·자산형성은 소득기준 필수 확인
          </p>
        </div>
      </div>
    </section>
  );
};
