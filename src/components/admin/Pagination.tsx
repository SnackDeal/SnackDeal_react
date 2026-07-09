export const ADMIN_PAGE_SIZE_OPTIONS = [10, 15, 20] as const;
export type AdminPageSize = typeof ADMIN_PAGE_SIZE_OPTIONS[number];

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: AdminPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: AdminPageSize) => void;
  unitLabel?: string;
};

export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  unitLabel = '건',
}: Props) {
  const displayTotalPages = Math.max(totalPages, 1);
  const displayPage = Math.min(page, displayTotalPages - 1);
  const canPrev = displayPage > 0;
  const canNext = displayPage < displayTotalPages - 1;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginTop: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
        <span>페이지당</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value) as AdminPageSize)}
          style={{
            height: 32,
            padding: '0 8px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            background: 'white',
            fontSize: 12,
          }}
        >
          {ADMIN_PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>개</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => canPrev && onPageChange(displayPage - 1)}
          disabled={!canPrev}
          style={buttonStyle(canPrev)}
        >
          이전
        </button>
        <span style={{ padding: '6px 12px', fontSize: 12, color: '#475569' }}>
          {displayPage + 1} / {displayTotalPages} (총 {total.toLocaleString()}
          {unitLabel})
        </span>
        <button
          type="button"
          onClick={() => canNext && onPageChange(displayPage + 1)}
          disabled={!canNext}
          style={buttonStyle(canNext)}
        >
          다음
        </button>
      </div>
    </div>
  );
}

function buttonStyle(enabled: boolean): React.CSSProperties {
  return {
    height: 32,
    padding: '0 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    background: 'white',
    color: enabled ? '#334155' : '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
    cursor: enabled ? 'pointer' : 'not-allowed',
  };
}
