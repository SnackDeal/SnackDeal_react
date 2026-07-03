// 공통 enum / 유틸 타입 — DB DDL 기준. 지어내지 말 것.

/** BIGINT PK — 모든 ID는 정수 (문서 규칙: uuid/문자열 금지) */
export type ID = number;

/** ISO 날짜/시각 문자열 (mock에서 string으로 표현) */
export type ISODate = string;
