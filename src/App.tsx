import React, { useState, useEffect, useCallback, useMemo } from 'react';
import samplePolicies from './data/sample-policies.json';
import { Policy, UserCriteria } from './types/policy';
import { normalizePolicies } from './utils/normalizePolicy';
import {
  loadCriteriaFromStorage,
  saveCriteriaToStorage,
  matchPolicy,
} from './utils/policyHelpers';
import { Banner } from './components/Banner';
import { Header } from './components/Header';
import { CriteriaForm } from './components/CriteriaForm';
import { AgeTimelineView } from './components/AgeTimelineView';
import { PolicyListSection } from './components/PolicyListSection';
import { PolicyDetailModal } from './components/PolicyDetailModal';
import {
  Clock,
  LayoutGrid,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function App() {
  const [criteria, setCriteria] = useState<UserCriteria>(() => loadCriteriaFromStorage());
  const [policies, setPolicies] = useState<Policy[]>(() => normalizePolicies(samplePolicies));
  const [isSample, setIsSample] = useState<boolean>(true);
  const [bannerMessage, setBannerMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'timeline' | 'cards'>('all');

  // 저장 상태 동기화
  const handleCriteriaChange = (newCriteria: UserCriteria) => {
    setCriteria(newCriteria);
    saveCriteriaToStorage(newCriteria);
  };

  const handleResetCriteria = () => {
    const defaultCriteria: UserCriteria = {
      age: 27,
      region: '대구전체',
      employment: '취업준비생',
      education: '대학졸업',
      income: '120이하',
    };
    handleCriteriaChange(defaultCriteria);
  };

  // 자연어 파서 결과 적용
  const handleApplyParsedQuery = (parsed: Partial<UserCriteria>) => {
    const updated = { ...criteria, ...parsed };
    handleCriteriaChange(updated);
  };

  // 정책 데이터 가져오기 (데이터 흐름: 화면 -> /api/policies -> 실패 시 sample-policies.json 폴백)
  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: '1',
        pageSize: '30',
        region: criteria.region,
      });

      const res = await fetch(`/api/policies?${queryParams.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${res.status})`);
      }

      const data = await res.json();

      if (data && Array.isArray(data.policies) && data.policies.length > 0) {
        setPolicies(data.policies);
        setIsSample(Boolean(data.isSample));
        setBannerMessage(data.message || '');
      } else {
        // 응답 내용이 비었거나 비정상일 경우 안전하게 샘플 데이터 적용
        setPolicies(normalizePolicies(samplePolicies));
        setIsSample(true);
        setBannerMessage('온통청년 API 응답 데이터가 없어 검증된 샘플 정책 20건을 표시합니다.');
      }
    } catch (err: any) {
      console.warn('[Fetch Policies Warning] API 호출 실패, 샘플 데이터로 폴백:', err);
      // 폴백 규칙: 어떤 오류가 나도 sample-policies.json 사용
      setPolicies(normalizePolicies(samplePolicies));
      setIsSample(true);
      setBannerMessage(
        'API 서버에 연결할 수 없거나 키 검증 대기 상태이므로, 대구 청년정책 샘플 20건을 표시합니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [criteria.region]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // 일치하는 정책 수 계산
  const matchedCount = useMemo(() => {
    return policies.filter((p) => matchPolicy(p, criteria).isMatch).length;
  }, [policies, criteria]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* 최상단 샘플 / 정상 연동 알림 배너 (폴백 규칙 준수) */}
      <Banner
        isSample={isSample}
        message={bannerMessage}
        onRefresh={fetchPolicies}
        isLoading={isLoading}
      />

      {/* 헤더 및 빠른 자연어 파서 */}
      <Header onApplyParsedQuery={handleApplyParsedQuery} />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* 1. 조건 입력 폼 (나이·지역·취업상태·학력·소득 5개) */}
        <CriteriaForm
          criteria={criteria}
          onChange={handleCriteriaChange}
          onReset={handleResetCriteria}
          matchedCount={matchedCount}
          totalCount={policies.length}
        />

        {/* 뷰 모드 탭 (통합 뷰 / 타임라인 중심 / 카드 목록 중심) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              통합 뷰 (전체 보기)
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              나이 타임라인 뷰
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              정책 카드 목록
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            기준일: 2026년 10월 현재
          </div>
        </div>

        {/* 2. 나이 타임라인 뷰 (19~39세 가로축, 내 나이 세로선, 연령 구간 막대, 마감 임박 강조) */}
        {(activeTab === 'all' || activeTab === 'timeline') && (
          <AgeTimelineView
            policies={policies}
            criteria={criteria}
            onSelectPolicy={setSelectedPolicy}
          />
        )}

        {/* 3. 조건에 맞는 정책 카드 목록 (일치 항목 표시 + 신청 마감 D-day 표시) */}
        {(activeTab === 'all' || activeTab === 'cards') && (
          <PolicyListSection
            policies={policies}
            criteria={criteria}
            onSelectPolicy={setSelectedPolicy}
            isLoading={isLoading}
            error={error}
            onRetry={fetchPolicies}
            onResetCriteria={handleResetCriteria}
          />
        )}
      </main>

      {/* 정책 상세 정보 모달 */}
      <PolicyDetailModal
        policy={selectedPolicy}
        criteria={criteria}
        onClose={() => setSelectedPolicy(null)}
      />

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-semibold text-slate-700">
            [내 정책 타임라인] 대구 청년 맞춤형 정책 탐색 판정기
          </p>
          <p>
            데이터 출처: 국무조정실·청년재단 온통청년(youthcenter.go.kr) 오픈API 및 대구광역시 청년정책포털
          </p>
          <p className="text-[11px] text-slate-400">
            본 서비스는 청년들의 신청 기회 유실 방지를 돕기 위한 판정 도구이며, 실제 신청 자격 및 예산 현황은 주관 기관의 최신 공고문을 반드시 확인하시기 바랍니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
