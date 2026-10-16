export interface PolicyAge {
  min: number | null;
  max: number | null;
}

export interface Policy {
  id: string;
  title: string;
  category: string; // 대분류: 일자리, 주거, 교육, 복지문화, 참여권리 등
  subCategory: string;
  region: string;
  summary: string;
  supportContent: string;
  applyStart: string | null; // YYYY-MM-DD 또는 null
  applyEnd: string | null; // YYYY-MM-DD 또는 null
  targetAge: PolicyAge | null;
  targetCondition: string;
  applyUrl: string;
  raw: Record<string, unknown>;
  // 파싱된 보조 속성 (매칭 및 필터링용)
  employmentCondition?: string;
  educationCondition?: string;
  incomeCondition?: string;
}

export interface UserCriteria {
  age: number; // 만 나이 (예: 27)
  region: string; // '대구전체' | '중구' | '동구' | '서구' | '남구' | '북구' | '수성구' | '달서구' | '달성군' | '군위군' | '전국'
  employment: string; // '취업준비생' | '재직자' | '창업가' | '단기근로' | '무관'
  education: string; // '고졸이하' | '대학재학' | '대학졸업' | '무관'
  income: string; // '100이하' | '120이하' | '150이하' | '무관'
}

export type CategoryFilter = '전체' | '일자리' | '주거' | '교육' | '복지문화' | '참여권리';
export type SortOption = 'dday' | 'age-deadline' | 'title';
export type ViewMode = 'timeline' | 'cards' | 'urgent';
