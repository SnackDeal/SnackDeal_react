import type { Notice, Faq, Qna, QnaAnswer } from '@/types';

export const notices: Notice[] = [
  {
    id: 1,
    title: '[공지] 여름 배송 안내',
    content: '폭염으로 인해 신선 배송이 지연될 수 있습니다.',
    is_pinned: true,
    deleted_at: null,
    created_at: '2026-07-01T09:00:00',
  },
  {
    id: 2,
    title: '개인정보 처리방침 개정 안내',
    content: '2026년 7월 15일부터 적용됩니다.',
    is_pinned: false,
    deleted_at: null,
    created_at: '2026-06-20T09:00:00',
  },
];

export const faqs: Faq[] = [
  { id: 1, type: 'ORDER', title: '주문 취소는 어떻게 하나요?', content: '배송 준비 전까지 주문내역에서 취소 가능합니다.' },
  { id: 2, type: 'SHIPPING', title: '배송비는 얼마인가요?', content: '3만원 이상 무료, 미만 시 3,000원입니다.' },
  { id: 3, type: 'PRODUCT', title: '유통기한은 어디서 확인하나요?', content: '상품 상세 페이지에서 확인할 수 있습니다.' },
];

export const qnas: Qna[] = [
  {
    id: 1,
    type: 'ORDER',
    title: '주문이 두 번 결제된 것 같아요',
    content: '결제 내역이 중복으로 보입니다. 확인 부탁드립니다.',
    attachment_url: null,
    is_answered: true,
    member_id: 1,
    created_at: '2026-07-01T11:00:00',
  },
  {
    id: 2,
    type: 'PRODUCT',
    title: '재입고 예정 문의',
    content: '다크 초콜릿 70% 재입고 언제 되나요?',
    attachment_url: null,
    is_answered: false,
    member_id: 1,
    created_at: '2026-07-02T15:30:00',
  },
];

export const qnaAnswers: QnaAnswer[] = [
  {
    id: 1,
    content: '중복 결제 건은 자동 취소 처리되었습니다. 3~5일 내 환불됩니다.',
    answered_at: '2026-07-01T14:00:00',
    qna_id: 1,
  },
];
