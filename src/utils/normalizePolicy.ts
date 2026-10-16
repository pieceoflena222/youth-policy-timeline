import { Policy, PolicyAge } from '../types/policy';

/**
 * 텍스트나 숫자에서 연령 범위 (최소~최대) 파싱
 */
function parseAgeRange(ageStr: unknown, minProp?: unknown, maxProp?: unknown): PolicyAge | null {
  if (typeof minProp === 'number' && typeof maxProp === 'number') {
    return { min: minProp, max: maxProp };
  }
  if (!ageStr || typeof ageStr !== 'string') return null;

  // 정규식: "만 19세 ~ 34세", "19~39세", "19세 이상 34세 이하", "만 19세" 등
  const rangeMatch = ageStr.match(/(\d{1,2})\s*세?\s*[~-]\s*(\d{1,2})\s*세?/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  const singleMatch = ageStr.match(/만\s*(\d{1,2})\s*세/);
  if (singleMatch) {
    const age = parseInt(singleMatch[1], 10);
    return { min: age, max: age };
  }

  return { min: 19, max: 39 }; // 기본 청년 연령 범위
}

/**
 * 날짜 문자열에서 YYYY-MM-DD 추출
 */
function extractDate(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null;
  const match = val.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * 기간 문자열("2026.10.01 ~ 2026.10.22" 또는 "상시접수")에서 시작일/종료일 파싱
 */
function parseDateRange(periodStr: unknown): { start: string | null; end: string | null } {
  if (!periodStr || typeof periodStr !== 'string') {
    return { start: null, end: null };
  }
  if (periodStr.includes('상시') || periodStr.includes('연중')) {
    return { start: null, end: null };
  }

  // 여러 날짜 찾기
  const dates = [...periodStr.matchAll(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/g)];
  if (dates.length >= 2) {
    const start = `${dates[0][1]}-${dates[0][2].padStart(2, '0')}-${dates[0][3].padStart(2, '0')}`;
    const end = `${dates[1][1]}-${dates[1][2].padStart(2, '0')}-${dates[1][3].padStart(2, '0')}`;
    return { start, end };
  } else if (dates.length === 1) {
    const single = `${dates[0][1]}-${dates[0][2].padStart(2, '0')}-${dates[0][3].padStart(2, '0')}`;
    return { start: single, end: single };
  }

  return { start: null, end: null };
}

/**
 * 원본 객체에서 있을 법한 필드명 후보를 순서대로 찾아 첫 번째 존재하는 값 반환
 */
function pickFirst<T = string>(obj: Record<string, unknown>, keys: string[], defaultValue: T): T {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      return val as unknown as T;
    }
  }
  return defaultValue;
}

/**
 * 카테고리 정규화
 */
function normalizeCategory(rawCat: string): string {
  if (!rawCat) return '일자리';
  if (rawCat.includes('일자리') || rawCat.includes('취업') || rawCat.includes('창업')) return '일자리';
  if (rawCat.includes('주거') || rawCat.includes('주택') || rawCat.includes('월세')) return '주거';
  if (rawCat.includes('교육') || rawCat.includes('역량') || rawCat.includes('학습') || rawCat.includes('훈련')) return '교육';
  if (rawCat.includes('복지') || rawCat.includes('문화') || rawCat.includes('건강') || rawCat.includes('자산')) return '복지문화';
  if (rawCat.includes('참여') || rawCat.includes('권리') || rawCat.includes('거버넌스')) return '참여권리';
  return '일자리';
}

/**
 * 정책 정규화 함수 (API 규격 A/B 및 커스텀 객체 모두 호환)
 */
export function normalizePolicy(item: unknown, index = 0): Policy {
  const raw = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;

  // 1. ID 후보
  const id = String(
    pickFirst(raw, ['plcyNo', 'polyBizSecd', 'bizId', 'id', 'plcyId', 'idx'], `policy-${index + 1}`)
  );

  // 2. 제목 후보
  const title = String(
    pickFirst(raw, ['plcyNm', 'polyBizSjnm', 'title', 'bizNm', 'polySj'], '청년 지원 정책')
  );

  // 3. 카테고리 후보
  const rawCat = String(pickFirst(raw, ['lclsfNm', 'polyBizTy', 'category', 'polyItcnTy'], '일자리'));
  const category = normalizeCategory(rawCat);

  // 4. 서브카테고리 후보
  const subCategory = String(
    pickFirst(raw, ['polyBizTy', 'mclsfNm', 'subCategory', 'bizTycd'], rawCat)
  );

  // 5. 지역 후보
  const region = String(
    pickFirst(raw, ['regionNm', 'polyBizSecd', 'cnsgNmor', 'region', 'areaNm'], '대구광역시')
  );

  // 6. 요약 후보
  const summary = String(
    pickFirst(raw, ['polyItcnCn', 'plcyExplnCn', 'summary', 'polyExpln', 'bizPrdCn'], '')
  );

  // 7. 지원 내용 후보
  const supportContent = String(
    pickFirst(raw, ['sprtCn', 'sporCn', 'supportContent', 'sprtScvl', 'polyItcnCn'], summary)
  );

  // 8. 신청 기간 및 마감일 후보
  let applyStart: string | null = extractDate(pickFirst(raw, ['applyStart', 'rqutPrdBgngDt'], null));
  let applyEnd: string | null = extractDate(pickFirst(raw, ['applyEnd', 'rqutPrdEndDt'], null));

  if (!applyStart || !applyEnd) {
    const periodText = pickFirst(raw, ['rqutPrdCn', 'bizPrdCn', 'applyPeriod'], '');
    const parsedRange = parseDateRange(periodText);
    if (!applyStart) applyStart = parsedRange.start;
    if (!applyEnd) applyEnd = parsedRange.end;
  }

  // 9. 대상 연령
  const targetAge = parseAgeRange(
    pickFirst(raw, ['ageInfo', 'age', 'targetAge', 'ageCn'], null),
    raw.minAge,
    raw.maxAge
  );

  // 10. 대상 요건
  const targetCondition = String(
    pickFirst(
      raw,
      ['prcpCn', 'splzRlmRqisCn', 'targetCondition', 'targetCn', 'ptcpCn'],
      '세부 요건은 상세 공고를 확인하세요'
    )
  );

  // 11. 신청 링크
  let applyUrl = String(
    pickFirst(raw, ['refUrlAddr1', 'rqutUrla', 'applyUrl', 'url', 'refUrl'], '')
  );
  if (!applyUrl || !applyUrl.startsWith('http')) {
    applyUrl = 'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch';
  }

  // 부가 요건들
  const employmentCondition = String(pickFirst(raw, ['empmSttsCn', 'employment', 'empmStts'], ''));
  const educationCondition = String(pickFirst(raw, ['accrRqisCn', 'education', 'accrRqis'], ''));
  const incomeCondition = String(pickFirst(raw, ['prcpCn', 'income', 'incomeCn'], ''));

  return {
    id,
    title,
    category,
    subCategory,
    region,
    summary,
    supportContent,
    applyStart,
    applyEnd,
    targetAge,
    targetCondition,
    applyUrl,
    raw,
    employmentCondition,
    educationCondition,
    incomeCondition,
  };
}

/**
 * 리스트 전체 정규화
 */
export function normalizePolicies(items: unknown[]): Policy[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => normalizePolicy(item, index));
}
