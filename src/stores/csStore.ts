import { create } from 'zustand';

export interface Notice {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface FAQ {
  id: number;
  type: 'ORDER' | 'SHIPPING' | 'PRODUCT' | 'OTHER';
  title: string;
  content: string;
}

export interface QNA {
  id: number;
  type: 'ORDER' | 'SHIPPING' | 'PRODUCT' | 'OTHER';
  title: string;
  content: string;
  attachment_url?: string;
  is_answered: boolean;
  member_id: number;
  created_at: string;
  answer?: {
    content: string;
    answered_at: string;
  };
}

const NOTICES: Notice[] = [
  {
    id: 1,
    title: '7월 서버 점검 안내',
    content: '더 나은 서비스를 위해 7월 15일 00:00~02:00에 서버 점검이 있습니다.',
    is_pinned: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: '배송료 정책 변경 안내',
    content: '7월부터 50,000원 이상 구매 시 배송료가 무료입니다.',
    is_pinned: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: '여름 신상 상품 입고',
    content: '시원한 여름 과자가 대량 입고되었습니다. 지금 확인해보세요!',
    is_pinned: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FAQS: FAQ[] = [
  {
    id: 1,
    type: 'ORDER',
    title: '주문 후 취소는 어떻게 하나요?',
    content: '결제 완료 후 결제 상태가 "결제완료"인 경우 주문 취소가 가능합니다. 마이페이지 > 주문내역에서 취소 버튼을 클릭하면 됩니다.',
  },
  {
    id: 2,
    type: 'SHIPPING',
    title: '배송은 얼마나 걸리나요?',
    content: '주문 후 1~2일 내에 배송됩니다. 주말/공휴일은 배송이 진행되지 않습니다.',
  },
  {
    id: 3,
    type: 'PRODUCT',
    title: '제품이 손상된 상태로 도착했어요.',
    content: '죄송합니다. 고객센터 > 문의하기에서 상세 내용과 사진을 첨부해주시면 빠르게 처리해드리겠습니다.',
  },
  {
    id: 4,
    type: 'OTHER',
    title: '쿠폰은 어디서 받나요?',
    content: '마이페이지 또는 이벤트 페이지에서 쿠폰을 받을 수 있습니다.',
  },
];

interface CSState {
  notices: Notice[];
  faqs: FAQ[];
  qnas: QNA[];
  getNotices: () => Notice[];
  getFAQs: (type?: FAQ['type']) => FAQ[];
  getQNAs: (memberId?: number) => QNA[];
  addQNA: (qna: Omit<QNA, 'id' | 'created_at'>) => void;
}

let nextQNAId = 1;

export const useCSStore = create<CSState>((set, get) => ({
  notices: NOTICES,
  faqs: FAQS,
  qnas: [],

  getNotices: () => {
    const { notices } = get();
    return notices.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  },

  getFAQs: (type) => {
    const { faqs } = get();
    if (!type) return faqs;
    return faqs.filter((f) => f.type === type);
  },

  getQNAs: (memberId) => {
    const { qnas } = get();
    if (!memberId) return qnas;
    return qnas.filter((q) => q.member_id === memberId);
  },

  addQNA: (qna) => {
    set((state) => ({
      qnas: [
        ...state.qnas,
        {
          id: nextQNAId++,
          created_at: new Date().toISOString(),
          ...qna,
        },
      ],
    }));
  },
}));
