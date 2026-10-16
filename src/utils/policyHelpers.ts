import { Policy, UserCriteria } from '../types/policy';

/**
 * D-day 계산 함수
 * referenceDate는 기준일 (현재 시간 기준)
 */
export function calculateDDay(
  applyEnd: string | null,
  referenceDateStr = '2026-10-15'
): {
  days: number | null;
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
  isAlways: boolean;
} {
  if (!applyEnd) {
    return {
      days: null,
      label: '상시모집',
      isUrgent: false,
      isExpired: false,
      isAlways: true,
    };
  }

  // 오늘 날짜 계산 (기본적으로 환경의 현재 일자 또는 시스템 일자)
  const today = new Date();
  const refDate = isNaN(today.getTime()) ? new Date(referenceDateStr) : today;
  // 시간 정규화 (자정 기준)
  const cleanToday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const endParts = applyEnd.split('-');
  if (endParts.length !== 3) {
    return {
      days: null,
      label: '상시모집',
      isUrgent: false,
      isExpired: false,
      isAlways: true,
    };
  }

  const targetDate = new Date(
    parseInt(endParts[0], 10),
    parseInt(endParts[1], 10) - 1,
    parseInt(endParts[2], 10)
  );

  const diffTime = targetDate.getTime() - cleanToday.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      label: `마감 (${Math.abs(diffDays)}일 전)`,
      isUrgent: false,
      isExpired: true,
      isAlways: false,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      label: 'D-Day (오늘마감)',
      isUrgent: true,
      isExpired: false,
      isAlways: false,
    };
  } else if (diffDays <= 7) {
    return {
      days: diffDays,
      label: `D-${diffDays} (마감임박)`,
      isUrgent: true,
      isExpired: false,
      isAlways: false,
    };
  } else {
    return {
      days: diffDays,
      label: `D-${diffDays}`,
      isUrgent: false,
      isExpired: false,
      isAlways: false,
    };
  }
}

/**
 * 5대 조건 매칭 판정기
 * ① 나이: policy.targetAge.min <= criteria.age <= policy.targetAge.max
 * ② 거주지: 울산 전체, 해당 구·군, 전국
 * ③ 취업상태: 일치 여부 또는 무관
 * ④ 학력: 일치 여부 또는 무관
 * ⑤ 소득: 일치 여부 또는 무관
 */
export interface MatchResult {
  isMatch: boolean;
  matchScore: number; // 0 ~ 100
  matchedTags: { key: string; label: string }[];
  unmatchedTags: { key: string; label: string }[];
  ageDifferenceToMax: number | null; // 정책 최대 연령과 내 나이 차이 (0 or 1이면 곧 자격 만료!)
  isAgeEndingSoon: boolean; // 내 나이가 최대 연령에 거의 다다랐는지 (0~2년 남음)
}

export function matchPolicy(policy: Policy, criteria: UserCriteria): MatchResult {
  const matchedTags: { key: string; label: string }[] = [];
  const unmatchedTags: { key: string; label: string }[] = [];

  // 1. 나이 판정
  let ageMatch = true;
  let ageDiff: number | null = null;
  let isAgeEndingSoon = false;

  if (policy.targetAge) {
    const min = policy.targetAge.min ?? 0;
    const max = policy.targetAge.max ?? 100;
    if (criteria.age >= min && criteria.age <= max) {
      ageMatch = true;
      ageDiff = max - criteria.age;
      // 나이가 만 34세 이하인 정책에 33~34세이거나, 39세 정책에 38~39세인 경우 곧 만료
      if (ageDiff <= 2) {
        isAgeEndingSoon = true;
      }
      matchedTags.push({
        key: 'age',
        label: `나이 충족 (만 ${min}~${max}세)`,
      });
    } else {
      ageMatch = false;
      unmatchedTags.push({
        key: 'age',
        label: criteria.age < min ? `최소 연령(만 ${min}세) 미달` : `최대 연령(만 ${max}세) 초과`,
      });
    }
  } else {
    matchedTags.push({ key: 'age', label: '연령 무관' });
  }

  // 2. 지역 판정
  let regionMatch = true;
  const policyRegion = (policy.region || '').toLowerCase();
  const policyTarget = (policy.targetCondition || '').toLowerCase();
  const userRegion = criteria.region;

  if (userRegion === '전국') {
    regionMatch = true;
    matchedTags.push({ key: 'region', label: '전국 대상' });
  } else if (policyRegion.includes('전국') || policyTarget.includes('전국')) {
    regionMatch = true;
    matchedTags.push({ key: 'region', label: '전국 공통 혜택' });
  } else if (policyRegion.includes('대구') || policyTarget.includes('대구')) {
    // 세부 구/군 체크 (중구, 동구, 서구, 남구, 북구, 수성구, 달서구, 달성군, 군위군)
    if (userRegion === '대구전체') {
      regionMatch = true;
      matchedTags.push({ key: 'region', label: '대구 거주 충족' });
    } else if (policyRegion.includes(userRegion) || policyTarget.includes(userRegion)) {
      regionMatch = true;
      matchedTags.push({ key: 'region', label: `대구 ${userRegion} 관내 일치` });
    } else if (!policyRegion.includes('구') && !policyRegion.includes('군')) {
      // 대구광역시 전체 대상
      regionMatch = true;
      matchedTags.push({ key: 'region', label: '대구 전역 공통 지원' });
    } else {
      regionMatch = false;
      unmatchedTags.push({ key: 'region', label: `지역 불일치 (${policy.region})` });
    }
  } else {
    // 타 지역 전용 정책인 경우
    regionMatch = false;
    unmatchedTags.push({ key: 'region', label: `타 지역 정책 (${policy.region})` });
  }

  // 3. 취업상태 판정
  let empMatch = true;
  const empCondition = (policy.employmentCondition || '') + ' ' + (policy.targetCondition || '');
  const empLower = empCondition.toLowerCase();

  if (criteria.employment === '무관' || empLower.includes('제한없음') || empLower.includes('무관') || empLower.length < 5) {
    matchedTags.push({ key: 'employment', label: '취업상태 무관' });
  } else if (criteria.employment === '취업준비생') {
    if (empLower.includes('미취업') || empLower.includes('구직') || empLower.includes('취준') || empLower.includes('실업') || empLower.includes('졸업예정')) {
      matchedTags.push({ key: 'employment', label: '미취업·구직자 자격 일치' });
    } else if (empLower.includes('재직') && !empLower.includes('미취업')) {
      empMatch = false;
      unmatchedTags.push({ key: 'employment', label: '재직자 전용 정책' });
    } else {
      matchedTags.push({ key: 'employment', label: '신청 가능' });
    }
  } else if (criteria.employment === '재직자') {
    if (empLower.includes('재직') || empLower.includes('근로') || empLower.includes('중소기업') || empLower.includes('직장인')) {
      matchedTags.push({ key: 'employment', label: '재직자 요건 충족' });
    } else if (empLower.includes('미취업') && !empLower.includes('재직')) {
      empMatch = false;
      unmatchedTags.push({ key: 'employment', label: '미취업 구직자 전용' });
    } else {
      matchedTags.push({ key: 'employment', label: '신청 가능' });
    }
  } else if (criteria.employment === '창업가') {
    if (empLower.includes('창업') || empLower.includes('스타트업') || empLower.includes('사업자')) {
      matchedTags.push({ key: 'employment', label: '창업가 요건 충족' });
    } else {
      matchedTags.push({ key: 'employment', label: '신청 가능' });
    }
  } else {
    matchedTags.push({ key: 'employment', label: '신청 가능' });
  }

  // 4. 학력 판정
  let eduMatch = true;
  const eduCondition = (policy.educationCondition || '') + ' ' + (policy.targetCondition || '');
  if (criteria.education === '무관' || eduCondition.includes('제한없음') || eduCondition.length < 3) {
    matchedTags.push({ key: 'education', label: '학력 제한없음' });
  } else if (criteria.education === '고졸이하') {
    if (eduCondition.includes('대학') && eduCondition.includes('전용')) {
      eduMatch = false;
      unmatchedTags.push({ key: 'education', label: '대학생 이상 전용' });
    } else {
      matchedTags.push({ key: 'education', label: '학력 요건 충족' });
    }
  } else {
    matchedTags.push({ key: 'education', label: '학력 요건 충족' });
  }

  // 5. 소득 판정
  let incMatch = true;
  const incCondition = (policy.incomeCondition || '') + ' ' + (policy.targetCondition || '');
  if (criteria.income === '무관' || !incCondition.includes('중위소득')) {
    matchedTags.push({ key: 'income', label: '소득 무관/추가 확인' });
  } else if (criteria.income === '100이하') {
    matchedTags.push({ key: 'income', label: '소득 기준 충족 (중위 100% 이하)' });
  } else if (criteria.income === '120이하') {
    if (incCondition.includes('100%')) {
      // 100% 이하 전용인 경우 불일치 가능성
      matchedTags.push({ key: 'income', label: '소득 기준 충족 검토 요망' });
    } else {
      matchedTags.push({ key: 'income', label: '소득 기준 충족' });
    }
  } else {
    matchedTags.push({ key: 'income', label: '소득 기준 부합' });
  }

  const isMatch = ageMatch && regionMatch && empMatch && eduMatch && incMatch;
  const matchScore = Math.round(
    ((ageMatch ? 30 : 0) +
      (regionMatch ? 30 : 0) +
      (empMatch ? 20 : 0) +
      (eduMatch ? 10 : 0) +
      (incMatch ? 10 : 0))
  );

  return {
    isMatch,
    matchScore,
    matchedTags,
    unmatchedTags,
    ageDifferenceToMax: ageDiff,
    isAgeEndingSoon,
  };
}

/**
 * 캘린더 파일 (.ics) 생성 및 브라우저 다운로드
 * 외부 연동 축소 규칙: 카카오톡/문자 대신 .ics 파일 다운로드 버튼 제공
 */
export function downloadIcsCalendar(policy: Policy) {
  const title = `[마감알림] ${policy.title}`;
  const description = `${policy.summary || policy.supportContent}\n\n신청링크: ${policy.applyUrl}\n출처: 온통청년`;
  const location = policy.region || '대구광역시';

  let startDateStr = '20261020T090000Z';
  let endDateStr = '20261020T180000Z';

  if (policy.applyEnd) {
    const clean = policy.applyEnd.replace(/-/g, '');
    startDateStr = `${clean}T090000Z`;
    endDateStr = `${clean}T180000Z`;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//My Youth Policy Timeline//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${title.replace(/[\r\n]+/g, ' ')}`,
    `DESCRIPTION:${description.replace(/[\r\n]+/g, '\\n')}`,
    `LOCATION:${location.replace(/[\r\n]+/g, ' ')}`,
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `URL:${policy.applyUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${policy.title.slice(0, 20)}_마감일정.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 로컬스토리지 안전 접근 (try/catch 준수)
 */
export function saveCriteriaToStorage(criteria: UserCriteria) {
  try {
    localStorage.setItem('my_youth_policy_criteria', JSON.stringify(criteria));
  } catch (err) {
    console.warn('localStorage 저장 실패:', err);
  }
}

export function loadCriteriaFromStorage(): UserCriteria {
  const defaultCriteria: UserCriteria = {
    age: 27,
    region: '대구전체',
    employment: '취업준비생',
    education: '대학졸업',
    income: '120이하',
  };

  try {
    const raw = localStorage.getItem('my_youth_policy_criteria');
    if (!raw) return defaultCriteria;
    const parsed = JSON.parse(raw);
    return {
      age: typeof parsed.age === 'number' ? parsed.age : 27,
      region: parsed.region || '대구전체',
      employment: parsed.employment || '취업준비생',
      education: parsed.education || '대학졸업',
      income: parsed.income || '120이하',
    };
  } catch (err) {
    console.warn('localStorage 불러오기 실패:', err);
    return defaultCriteria;
  }
}
