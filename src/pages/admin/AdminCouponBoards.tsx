import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { AdminPagination, type AdminPageSize } from '@/components/admin/Pagination';
import {
  apiCreateAdminCouponBoard,
  apiDeleteAdminCouponBoard,
  apiDeleteFile,
  apiGetAdminCouponBoards,
  apiGetAdminCoupons,
  apiUpdateAdminCouponBoard,
  apiUploadFile,
  type AdminCoupon,
  type AdminCouponBoard,
  type ApiError,
} from '@/lib/api';
import { prepareImageForUpload } from '@/lib/imageFile';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

type BoardForm = {
  title: string;
  content: string;
  thumbnailUrl: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
};

const emptyForm: BoardForm = {
  title: '',
  content: '',
  thumbnailUrl: '',
  startAt: '',
  endAt: '',
  isActive: true,
};

function formatDate(value: string | null | undefined) {
  if (!value) return '상시';
  return value.replace('T', ' ').slice(0, 16);
}

function normalizeDateTime(value: string | null | undefined) {
  return value ? value.slice(0, 16) : '';
}

function setDatePart(value: string, date: string) {
  if (!date) return '';
  const current = normalizeDateTime(value);
  const time = current.includes('T') ? current.slice(11, 16) : '00:00';
  return `${date}T${time}`;
}

function setTimePart(value: string, hour: string, minute: string) {
  const current = normalizeDateTime(value);
  const date = current.includes('T') ? current.slice(0, 10) : '';
  if (!date) return '';
  return `${date}T${hour}:${minute}`;
}

function hasBoardDisplayEnded(board: AdminCouponBoard) {
  if (!board.endAt) return false;
  const endsAt = new Date(board.endAt).getTime();
  return Number.isFinite(endsAt) && endsAt < Date.now();
}

function canEditBoard(board: AdminCouponBoard) {
  return !hasBoardDisplayEnded(board);
}

export function AdminCouponBoards() {
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();
  const [boards, setBoards] = useState<AdminCouponBoard[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState<BoardForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const totalPages = Math.max(Math.ceil(boards.length / pageSize), 1);
  const clampedPage = Math.min(page, totalPages - 1);
  const pagedBoards = useMemo(
    () => boards.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize),
    [boards, clampedPage, pageSize]
  );

  const loadBoards = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const [boardRows, couponRows] = await Promise.all([
        apiGetAdminCouponBoards(accessToken),
        apiGetAdminCoupons(accessToken),
      ]);
      setBoards(boardRows);
      setCoupons(couponRows);
    } catch (e) {
      const apiError = e as ApiError;
      setError(apiError.message ?? '쿠폰 게시판 목록을 불러오지 못했습니다.');
      setBoards([]);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminSession) return;
    void loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, accessToken]);

  if (!adminSession) return null;

  const updateForm = <K extends keyof BoardForm>(key: K, value: BoardForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.title.trim()) return '게시판 제목을 입력해 주세요.';
    if (!form.content.trim()) return '게시판 내용을 입력해 주세요.';
    if (!form.startAt) return '노출 시작일을 입력해 주세요.';
    if (form.endAt && new Date(form.startAt).getTime() > new Date(form.endAt).getTime()) {
      return '노출 종료일은 시작일보다 빠를 수 없습니다.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const validationError = validateForm();
    if (validationError) {
      setToast({ message: validationError, type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        startAt: form.startAt,
        endAt: form.endAt || null,
        isActive: form.isActive,
      };

      if (editingId) {
        await apiUpdateAdminCouponBoard(accessToken, editingId, payload);
        setToast({ message: '쿠폰 게시판이 수정되었습니다.', type: 'success' });
      } else {
        await apiCreateAdminCouponBoard(accessToken, payload);
        setToast({ message: '쿠폰 게시판이 등록되었습니다.', type: 'success' });
      }

      resetForm();
      await loadBoards();
    } catch (e) {
      const apiError = e as ApiError;
      setToast({ message: apiError.message ?? '쿠폰 게시판 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (board: AdminCouponBoard) => {
    if (!canEditBoard(board)) {
      setToast({ message: '노출 기간이 지난 게시판은 수정할 수 없습니다.', type: 'error' });
      return;
    }

    setEditingId(board.id);
    setForm({
      title: board.title,
      content: board.content,
      thumbnailUrl: board.thumbnailUrl ?? '',
      startAt: normalizeDateTime(board.startAt),
      endAt: normalizeDateTime(board.endAt),
      isActive: board.isActive,
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = async (board: AdminCouponBoard, isActive: boolean) => {
    if (!accessToken) return;
    if (!canEditBoard(board)) {
      setToast({ message: '노출 기간이 지난 게시판은 노출 상태를 변경할 수 없습니다.', type: 'error' });
      return;
    }

    const previous = boards;
    setBoards((rows) => rows.map((row) => (row.id === board.id ? { ...row, isActive } : row)));
    setUpdatingId(board.id);

    try {
      await apiUpdateAdminCouponBoard(accessToken, board.id, {
        title: board.title,
        content: board.content,
        thumbnailUrl: board.thumbnailUrl,
        startAt: board.startAt,
        endAt: board.endAt,
        isActive,
      });
      await loadBoards();
    } catch (e) {
      const apiError = e as ApiError;
      setBoards(previous);
      setToast({ message: apiError.message ?? '노출 상태 변경에 실패했습니다.', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (board: AdminCouponBoard) => {
    if (!accessToken) return;
    if (!window.confirm(`"${board.title}" 게시판을 삭제하시겠습니까?`)) return;

    setDeletingId(board.id);
    try {
      await apiDeleteAdminCouponBoard(accessToken, board.id);
      setToast({ message: '게시판이 삭제되었습니다.', type: 'success' });
      if (editingId === board.id) resetForm();
      await loadBoards();
    } catch (e) {
      const apiError = e as ApiError;
      setToast({ message: apiError.message ?? '게시판 삭제에 실패했습니다.', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleThumbnailUpload = async (file: File | undefined) => {
    if (!file || !accessToken) return;

    const previousUrl = form.thumbnailUrl.trim();
    setUploading(true);

    try {
      const uploadFile = await prepareImageForUpload(file);
      if (previousUrl) {
        await apiDeleteFile(accessToken, previousUrl).catch(() => null);
      }

      const uploaded = await apiUploadFile(accessToken, uploadFile, 'event');
      updateForm('thumbnailUrl', uploaded.url);
      setToast({ message: '썸네일이 업로드되었습니다.', type: 'success' });
    } catch (e) {
      const apiError = e as ApiError;
      setToast({ message: apiError.message ?? '썸네일 업로드에 실패했습니다.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 16,
            alignItems: 'center',
            marginBottom: 20,
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 18,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>쿠폰 게시판 관리</h1>
            <p style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
              게시판은 노출 영역만 담당합니다. 이벤트 쿠폰 연결은 쿠폰 등록 화면에서 진행합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={loadBoards} disabled={loading}>
              새로고침
            </Button>
            <Button onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}>
              {isFormOpen ? '닫기' : '게시판 등록'}
            </Button>
          </div>
        </div>

        {!isFormOpen && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <SummaryTile label="전체 게시판" value={boards.length.toLocaleString()} />
            <SummaryTile label="노출 중" value={boards.filter((board) => board.isActive).length.toLocaleString()} />
            <SummaryTile label="비노출" value={boards.filter((board) => !board.isActive).length.toLocaleString()} />
            <SummaryTile
              label="연결 이벤트 쿠폰"
              value={coupons.filter((coupon) => coupon.issueType === 'EVENT' && coupon.couponBoardId).length.toLocaleString()}
            />
          </div>
        )}

        {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}

        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 24,
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                {editingId ? '게시판 수정' : '게시판 등록'}
              </div>
            </div>

            <div style={guideStyle}>
              <strong>운영 흐름</strong>
              <span>게시판을 먼저 만들고, 쿠폰 등록 화면에서 `EVENT` 쿠폰에 게시판을 연결합니다.</span>
            </div>

            <div className="board-editor">
              <EditorRow label="제목">
                <input className="admin-input" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
              </EditorRow>

              <EditorRow label="노출 여부">
                <label className="checkline">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => updateForm('isActive', e.target.checked)} />
                  게시판 노출
                </label>
              </EditorRow>

              <EditorRow label="노출 기간">
                <div className="period-grid">
                  <div>
                    <div className="sub-label">시작</div>
                    <DateTimeSelect value={form.startAt} onChange={(value) => updateForm('startAt', value)} />
                  </div>
                  <div>
                    <div className="sub-label">종료(선택)</div>
                    <DateTimeSelect value={form.endAt} onChange={(value) => updateForm('endAt', value)} />
                  </div>
                </div>
              </EditorRow>

              <EditorRow label="썸네일">
                <div className="thumbnail-editor">
                  <div className="thumbnail-controls">
                    <input
                      className="admin-input"
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => {
                        void handleThumbnailUpload(e.target.files?.[0]);
                        e.currentTarget.value = '';
                      }}
                    />
                    <input
                      className="admin-input"
                      value={form.thumbnailUrl}
                      onChange={(e) => updateForm('thumbnailUrl', e.target.value)}
                      placeholder="썸네일 URL"
                    />
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      업로드 후 URL이 자동 입력됩니다. 수정 시 기존 이미지는 삭제됩니다.
                    </span>
                    {uploading && <span style={{ fontSize: 12, color: '#64748b' }}>업로드 중...</span>}
                  </div>
                  <div className="thumbnail-preview">
                    {form.thumbnailUrl ? <img src={form.thumbnailUrl} alt="썸네일 미리보기" /> : <span>이미지를 업로드해 주세요.</span>}
                  </div>
                </div>
              </EditorRow>

              <EditorRow label="내용">
                <textarea
                  className="admin-input content-input"
                  value={form.content}
                  onChange={(e) => updateForm('content', e.target.value)}
                  placeholder="이벤트 내용을 입력해 주세요."
                />
              </EditorRow>

              <EditorRow label="이벤트 쿠폰 연결">
                <div className="coupon-link-guide">
                  <div>이 화면에서는 쿠폰을 직접 연결하지 않습니다.</div>
                  <button type="button" onClick={() => navigate('/admin/coupons?issueType=EVENT')} className="text-button">
                    이벤트 쿠폰 만들러 가기
                  </button>
                </div>
              </EditorRow>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                padding: '14px 20px',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '저장 중...' : editingId ? '수정 저장' : '등록'}
              </Button>
            </div>
          </form>
        )}

        {!isFormOpen && (
          <>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>로딩 중...</div>
            ) : (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflowX: 'auto', background: '#fff' }}>
                <table style={{ width: '100%', minWidth: 960, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                      {['제목', '노출 기간', '연결 쿠폰', '노출 상태', '관리'].map((header) => (
                        <th key={header} style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {boards.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                          등록된 쿠폰 게시판이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      pagedBoards.map((board) => {
                        const linkedCoupons = coupons.filter((coupon) => coupon.couponBoardId === board.id);
                        const hasLinkedCoupons = linkedCoupons.length > 0;
                        const editable = canEditBoard(board);
                        const deleteBlockReason = hasLinkedCoupons ? '연결된 쿠폰이 있어 삭제할 수 없습니다.' : null;

                        const editBlockReason = editable ? null : '노출 기간이 지난 게시판은 수정하거나 노출 상태를 변경할 수 없습니다.';

                        return (
                          <tr key={board.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: 12, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              <div>{board.title}</div>
                              {board.thumbnailUrl ? (
                                <div style={{ marginTop: 4, fontSize: 11, color: '#94a3b8' }}>썸네일 등록됨</div>
                              ) : null}
                            </td>
                            <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>
                              {formatDate(board.startAt)} ~ {formatDate(board.endAt)}
                            </td>
                            <td style={{ padding: 12, fontSize: 13, color: '#334155' }}>
                              {linkedCoupons.length === 0 ? (
                                <span style={{ color: '#94a3b8' }}>없음</span>
                              ) : (
                                <span>{linkedCoupons.length}개 ({linkedCoupons.map((coupon) => coupon.name).join(', ')})</span>
                              )}
                            </td>
                            <td style={{ padding: 12 }}>
                              <select
                                className="admin-input"
                                style={{ width: 100 }}
                                value={board.isActive ? 'ACTIVE' : 'INACTIVE'}
                                disabled={updatingId === board.id || !editable}
                                title={editBlockReason ?? undefined}
                                onChange={(e) => handleStatusChange(board, e.target.value === 'ACTIVE')}
                              >
                                <option value="ACTIVE">노출</option>
                                <option value="INACTIVE">비노출</option>
                              </select>
                            </td>
                            <td style={{ padding: 12, display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleEdit(board)}
                                disabled={!editable}
                                title={editBlockReason ?? undefined}
                                style={{
                                  ...actionButtonStyle,
                                  background: editable ? '#fff' : '#f1f5f9',
                                  color: editable ? '#334155' : '#94a3b8',
                                  cursor: editable ? 'pointer' : 'not-allowed',
                                }}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(board)}
                                disabled={Boolean(deleteBlockReason) || deletingId === board.id}
                                title={deleteBlockReason ?? undefined}
                                style={{
                                  ...dangerButtonStyle,
                                  background: deleteBlockReason ? '#f1f5f9' : '#fef2f2',
                                  color: deleteBlockReason ? '#94a3b8' : '#dc2626',
                                  cursor: deleteBlockReason ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {deletingId === board.id ? '삭제 중...' : '삭제'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && boards.length > 0 && (
              <AdminPagination
                page={clampedPage}
                totalPages={totalPages}
                total={boards.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(0);
                }}
                unitLabel="개"
              />
            )}
          </>
        )}

        <style>{`
          .admin-input {
            width: 100%;
            min-height: 40px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 0 10px;
            font-size: 13px;
            box-sizing: border-box;
            background: white;
          }
          .board-editor {
            display: grid;
          }
          .period-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .sub-label {
            margin-bottom: 8px;
            font-size: 12px;
            color: #64748b;
            font-weight: 700;
          }
          .thumbnail-editor {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 200px;
            gap: 16px;
            align-items: start;
          }
          .thumbnail-controls {
            display: grid;
            gap: 8px;
          }
          .thumbnail-preview {
            min-height: 160px;
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            overflow: hidden;
          }
          .thumbnail-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .content-input {
            min-height: 180px;
            padding: 12px;
            resize: vertical;
          }
          .coupon-link-guide {
            display: grid;
            gap: 8px;
            padding: 14px;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
            font-size: 13px;
            color: #475569;
          }
          .text-button {
            width: fit-content;
            border: none;
            background: transparent;
            padding: 0;
            color: #2563eb;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }
          .checkline {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
          }
          .datetime-select {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 76px 76px;
            gap: 8px;
          }
          @media (max-width: 900px) {
            .thumbnail-editor,
            .period-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 700px) {
            .datetime-select {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </>
  );
}

const guideStyle = {
  display: 'grid',
  gap: 4,
  margin: '16px 20px 0',
  border: '1px solid #dbeafe',
  borderRadius: 8,
  background: '#eff6ff',
  padding: '12px 14px',
  color: '#1d4ed8',
  fontSize: 13,
} satisfies React.CSSProperties;

const actionButtonStyle = {
  height: 34,
  padding: '0 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: 'white',
  color: '#334155',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
} satisfies React.CSSProperties;

const dangerButtonStyle = {
  height: 34,
  padding: '0 12px',
  border: '1px solid #fecaca',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
} satisfies React.CSSProperties;

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        background: '#fff',
        padding: '16px 18px',
        display: 'grid',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <strong style={{ fontSize: 24, color: '#0f172a' }}>{value}</strong>
    </div>
  );
}

function EditorRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px minmax(0, 1fr)',
        gap: 20,
        padding: '20px',
        borderTop: '1px solid #f1f5f9',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function DateTimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const current = normalizeDateTime(value);
  const date = current.includes('T') ? current.slice(0, 10) : '';
  const hour = current.includes('T') ? current.slice(11, 13) : '00';
  const minute = current.includes('T') ? current.slice(14, 16) : '00';

  return (
    <div className="datetime-select">
      <input className="admin-input" type="date" value={date} onChange={(e) => onChange(setDatePart(value, e.target.value))} />
      <select className="admin-input" value={hour} disabled={!date} onChange={(e) => onChange(setTimePart(value, e.target.value, minute))}>
        {Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')).map((option) => (
          <option key={option} value={option}>
            {option}시
          </option>
        ))}
      </select>
      <select className="admin-input" value={minute} disabled={!date} onChange={(e) => onChange(setTimePart(value, hour, e.target.value))}>
        {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).map((option) => (
          <option key={option} value={option}>
            {option}분
          </option>
        ))}
      </select>
    </div>
  );
}
