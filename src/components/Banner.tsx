import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface BannerProps {
  isSample: boolean;
  message?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const Banner: React.FC<BannerProps> = ({
  isSample,
  message,
  onRefresh,
  isLoading,
}) => {
  if (!isSample) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs sm:text-sm text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>온통청년 실시간 연동 중:</strong> 대한민국 정부 온통청년(youthcenter.go.kr) 오픈API와 실시간 동기화되었습니다.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-300 px-4 py-3 text-xs sm:text-sm text-amber-900 shadow-xs">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded mr-1.5 text-xs">
              샘플 데이터로 표시 중
            </span>
            <span>
              {message || '온통청년 API 호출 대기 또는 키 미설정 상태로, 검증된 대구·전국 청년정책 20건 샘플을 표시하고 있습니다.'}
            </span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-medium text-xs rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '연결 중...' : 'API 다시 시도'}
          </button>
        )}
      </div>
    </div>
  );
};
