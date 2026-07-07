// Daum(Kakao) 우편번호 서비스 로더 + 팝업 오픈 헬퍼
// docs: https://postcode.map.daum.net/guide

const SCRIPT_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: (state: 'FORCE_CLOSE' | 'COMPLETE_CLOSE') => void;
        width?: string | number;
        height?: string | number;
      }) => { open: (opts?: { popupTitle?: string }) => void };
    };
  }
}

export interface DaumPostcodeData {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  bname: string;
  userSelectedType: 'R' | 'J';
}

let loaderPromise: Promise<void> | null = null;

export function loadDaumPostcode(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.daum?.Postcode) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error('우편번호 서비스를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function openDaumPostcode(
  onComplete: (result: { zipcode: string; address: string }) => void
): Promise<void> {
  await loadDaumPostcode();
  if (!window.daum?.Postcode) throw new Error('우편번호 서비스를 사용할 수 없습니다.');

  new window.daum.Postcode({
    oncomplete: (data) => {
      const base =
        data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
      const withBuilding =
        data.userSelectedType === 'R' && data.buildingName
          ? `${base} (${data.buildingName})`
          : base;
      onComplete({ zipcode: data.zonecode, address: withBuilding });
    },
  }).open();
}
