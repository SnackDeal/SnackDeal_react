import type { ID, ISODate } from './common';

// 고객센터 도메인 — notice / faq / qna / qna_answer
export type QnaType = 'ORDER' | 'SHIPPING' | 'PRODUCT' | 'OTHER';

export interface NoticeSummaryResponse {
  id: ID;
  title: string;
  pinned?: boolean;
  is_pinned?: boolean;
  createdAt?: ISODate;
  created_at?: ISODate;
}

export interface NoticeResponse extends NoticeSummaryResponse {
  content: string;
}

export interface Notice {
  id: ID;
  title: string;
  content: string;
  is_pinned: boolean;
  deleted_at: ISODate | null;
  created_at: ISODate;
}

export interface Faq {
  id: ID;
  type: QnaType;
  title: string;
  content: string;
}

export interface Qna {
  id: ID;
  type: QnaType;
  title: string;
  content: string;
  attachment_url: string | null;
  is_answered: boolean; // 불리언 (상태 enum 아님)
  member_id: ID;
  created_at: ISODate;
}

// qna_answer 테이블 — qna당 1건 (qna_id UNIQUE)
export interface QnaAnswer {
  id: ID;
  content: string;
  answered_at: ISODate;
  qna_id: ID;
}
