import type { IncomingMessage, ServerResponse } from 'http';
import samplePolicies from '../src/data/sample-policies.json';
import { normalizePolicies } from '../src/utils/normalizePolicy';

interface QueryParams {
  page?: string | number;
  pageSize?: string | number;
  keyword?: string;
  category?: string;
  region?: string;
}

export async function fetchYouthPolicies(query: QueryParams = {}) {
  const apiKey = process.env.YOUTH_API_KEY?.trim();
  const pageNum = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const keyword = query.keyword ? String(query.keyword).trim() : '';
  const category = query.category ? String(query.category).trim() : '';
  const region = query.region ? String(query.region).trim() : '';

  // API 키가 없으면 즉시 샘플 데이터 사용
  if (!apiKey) {
    console.log('[YouthCenter API] YOUTH_API_KEY가 설정되지 않아 샘플 데이터를 사용합니다.');
    return {
      isSample: true,
      source: 'sample_no_key',
      policies: normalizePolicies(samplePolicies),
      totalCount: samplePolicies.length,
      message: 'YOUTH_API_KEY 환경변수가 설정되지 않아 대구·전국 청년정책 20건 샘플을 표시합니다.',
    };
  }

  // 1. 규격 A 시도 (신규 온통청년 OpenAPI)
  try {
    const urlA = new URL('https://www.youthcenter.go.kr/go/ythip/getPlcy');
    urlA.searchParams.set('apiKeyNm', apiKey);
    urlA.searchParams.set('pageNum', String(pageNum));
    urlA.searchParams.set('pageSize', String(pageSize));
    urlA.searchParams.set('rtnType', 'json');

    if (keyword) urlA.searchParams.set('plcyNm', keyword);
    if (category && category !== '전체') urlA.searchParams.set('lclsfNm', category);
    // 대구 법정 시도코드: 27
    if (region && (region.includes('대구') || region.includes('수성') || region.includes('달서') || region.includes('달성') || region.includes('군위'))) {
      urlA.searchParams.set('zipCd', '27000');
    }

    const controllerA = new AbortController();
    const timeoutIdA = setTimeout(() => controllerA.abort(), 4000);

    const resA = await fetch(urlA.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controllerA.signal,
    });
    clearTimeout(timeoutIdA);

    if (resA.ok) {
      const text = await resA.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON response (HTML error or XML), proceed to spec B
        data = null;
      }

      if (data && (data.result?.youthPolicyList || Array.isArray(data.youthPolicyList))) {
        const list = data.result?.youthPolicyList || data.youthPolicyList || [];
        if (list.length > 0) {
          // 응답 원본 1건 로그 (키 제외)
          const sampleItem = { ...list[0] };
          delete sampleItem.apiKeyNm;
          delete sampleItem.openApiVlak;
          console.log('[YouthCenter API Spec A] 성공! 첫 번째 항목 구조:', JSON.stringify(sampleItem, null, 2));

          const normalized = normalizePolicies(list);
          const totalCount = Number(data.result?.pagging?.totCount || data.totCount) || normalized.length;

          return {
            isSample: false,
            source: 'spec_a',
            policies: normalized,
            totalCount,
            message: '온통청년 신규 규격(Spec A) 정상 연동 성공',
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[YouthCenter API] Spec A 호출 실패, Spec B로 전환:', err?.message || err);
  }

  // 2. 규격 B 시도 (구 온통청년 OpenAPI)
  try {
    const urlB = new URL('https://www.youthcenter.go.kr/opi/youthPlcyList.do');
    urlB.searchParams.set('openApiVlak', apiKey);
    urlB.searchParams.set('pageIndex', String(pageNum));
    urlB.searchParams.set('display', String(pageSize));

    if (keyword) urlB.searchParams.set('query', keyword);
    if (region && (region.includes('대구') || region.includes('수성') || region.includes('달서') || region.includes('달성') || region.includes('군위'))) {
      urlB.searchParams.set('srchPolyBizSecd', '003002003'); // 대구 지역코드
    }

    const controllerB = new AbortController();
    const timeoutIdB = setTimeout(() => controllerB.abort(), 4000);

    const resB = await fetch(urlB.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controllerB.signal,
    });
    clearTimeout(timeoutIdB);

    if (resB.ok) {
      const text = await resB.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      const list = data?.youthPolicyList || data?.result?.youthPolicyList || (Array.isArray(data) ? data : null);
      if (Array.isArray(list) && list.length > 0) {
        const sampleItem = { ...list[0] };
        delete sampleItem.apiKeyNm;
        delete sampleItem.openApiVlak;
        console.log('[YouthCenter API Spec B] 성공! 첫 번째 항목 구조:', JSON.stringify(sampleItem, null, 2));

        const normalized = normalizePolicies(list);
        const totalCount = Number(data?.totalCnt || data?.totCount) || normalized.length;

        return {
          isSample: false,
          source: 'spec_b',
          policies: normalized,
          totalCount,
          message: '온통청년 구 규격(Spec B) 정상 연동 성공',
        };
      }
    }
  } catch (err: any) {
    console.warn('[YouthCenter API] Spec B 호출 실패, 샘플 데이터로 폴백:', err?.message || err);
  }

  // 3. 둘 다 실패하면 샘플 데이터 사용 (규칙 C)
  console.log('[YouthCenter API] API 연동 불가 또는 오류로 샘플 데이터로 폴백합니다.');
  return {
    isSample: true,
    source: 'sample_fallback',
    policies: normalizePolicies(samplePolicies),
    totalCount: samplePolicies.length,
    message: '온통청년 API 호출 실패 또는 연결 불가로 대구 청년정책 샘플 20건을 표시합니다.',
  };
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req: any, res: any) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = req.query || {};
    const result = await fetchYouthPolicies(query);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[YouthCenter Serverless Handler] 에러:', error);
    // 예외를 던지지 않고 샘플 데이터 반환 (폴백 규칙 준수)
    return res.status(200).json({
      isSample: true,
      source: 'sample_exception_fallback',
      policies: normalizePolicies(samplePolicies),
      totalCount: samplePolicies.length,
      message: '일시적인 서버 처리 오류로 샘플 데이터를 표시합니다.',
    });
  }
}
