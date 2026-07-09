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
  apiUpdateAdminCoupon,
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
  linkedCouponIds: string[];
};

const emptyForm: BoardForm = {
  title: '',
  content: '',
  thumbnailUrl: '',
  startAt: '',
  endAt: '',
  isActive: true,
  linkedCouponIds: [],
};

function formatDate(value: string | undefined) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

function normalizeDateTime(value: string) {
  return value ? value.slice(0, 16) : '';
}

function setDatePart(value: string, date: string) {
  const current = normalizeDateTime(value);
  const time = current.includes('T') ? current.slice(11, 16) : '00:00';
  return date ? `${date}T${time}` : '';
}

function setTimePart(value: string, hour: string, minute: string) {
  const current = normalizeDateTime(value);
  const date = current.includes('T') ? current.slice(0, 10) : '';
  return date ? `${date}T${hour}:${minute}` : '';
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

  const selectableCoupons = useMemo(
    () =>
      coupons.filter(
        (coupon) =>
          coupon.issueType === 'EVENT' &&
          (!coupon.couponBoardId || coupon.couponBoardId === editingId)
      ),
    [coupons, editingId]
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

  const handleCouponToggle = (couponId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      linkedCouponIds: checked
        ? Array.from(new Set([...prev.linkedCouponIds, String(couponId)]))
        : prev.linkedCouponIds.filter((id) => id !== String(couponId)),
    }));
  };

  const buildCouponPayload = (coupon: AdminCoupon, boardId: number) => ({
    name: coupon.name,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderPrice: coupon.minOrderPrice,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    totalQuantity: coupon.totalQuantity,
    issueType: coupon.issueType,
    isActive: coupon.isActive,
    couponBoardId: boardId,
  });

  const validateForm = () => {
    if (!form.title.trim()) return '게시판 제목을 입력해 주세요.';
    if (!form.content.trim()) return '게시판 내용을 입력해 주세요.';
    if (!form.startAt || !form.endAt) return '노출 기간을 입력해 주세요.';
    if (new Date(form.startAt).getTime() > new Date(form.endAt).getTime()) {
      return '노출 시작일은 종료일보다 늦을 수 없습니다.';
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
        endAt: form.endAt,
        isActive: form.isActive,
      };

      const savedBoard = editingId
        ? await apiUpdateAdminCouponBoard(accessToken, editingId, payload)
        : await apiCreateAdminCouponBoard(accessToken, payload);

      const selectedCouponIds = new Set(form.linkedCouponIds.map(Number));
      const couponsToConnect = coupons.filter(
        (coupon) => selectedCouponIds.has(coupon.id) && coupon.couponBoardId !== savedBoard.id
      );

      await Promise.all(
        couponsToConnect.map((coupon) =>
          apiUpdateAdminCoupon(accessToken, coupon.id, buildCouponPayload(coupon, savedBoard.id))
        )
      );

      setToast({
        message: editingId ? '쿠폰 게시판이 수정되었습니다.' : '쿠폰 게시판이 등록되었습니다.',
        type: 'success',
      });
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
    const linked = coupons
      .filter((coupon) => coupon.couponBoardId === board.id)
      .map((coupon) => String(coupon.id));

    setEditingId(board.id);
    setForm({
      title: board.title,
      content: board.content,
      thumbnailUrl: board.thumbnailUrl ?? '',
      startAt: normalizeDateTime(board.startAt),
      endAt: normalizeDateTime(board.endAt),
      isActive: board.isActive,
      linkedCouponIds: linked,
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = async (board: AdminCouponBoard, isActive: boolean) => {
    if (!accessToken) return;

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
              이벤트 쿠폰 게시판을 등록하고 노출 상태를 관리합니다.
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
            <SummaryTile
              label="노출 중"
              value={boards.filter((board) => board.isActive).length.toLocaleString()}
            />
            <SummaryTile
              label="숨김"
              value={boards.filter((board) => !board.isActive).length.toLocaleString()}
            />
            <SummaryTile
              label="연결 쿠폰"
              value={coupons
                .filter((coupon) => coupon.issueType === 'EVENT' && coupon.couponBoardId)
                .length.toLocaleString()}
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

            <div className="flow-guide">
              <strong>이벤트 쿠폰 등록 순서</strong>
              <span>
                게시판을 먼저 등록한 뒤 해당 게시판과 연결할 이벤트 쿠폰을 선택하거나, 쿠폰 관리에서
                게시판을 지정해 연결할 수 있습니다.
              </span>
            </div>

            <div className="board-editor">
              <EditorRow label="제목">
                <input
                  className="admin-input"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="예: 신규가입 쿠폰 받기"
                />
              </EditorRow>

              <EditorRow label="노출 설정">
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateForm('isActive', e.target.checked)}
                  />
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
                    <div className="sub-label">종료</div>
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
                      placeholder="업로드된 썸네일 URL"
                    />
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      최대 10MB 이미지 업로드 가능. 수정 시 기존 이미지는 먼저 삭제됩니다.
                    </span>
                    {uploading && <span style={{ fontSize: 12, color: '#64748b' }}>업로드 중...</span>}
                  </div>
                  <div className="thumbnail-preview">
                    {form.thumbnailUrl ? (
                      <img src={form.thumbnailUrl} alt="썸네일 미리보기" />
                    ) : (
                      <span>이미지를 업로드해 주세요</span>
                    )}
                  </div>
                </div>
              </EditorRow>

              <EditorRow label="내용">
                <textarea
                  className="admin-input content-input"
                  value={form.content}
                  onChange={(e) => updateForm('content', e.target.value)}
                  placeholder="이벤트 설명을 입력해 주세요."
                />
              </EditorRow>

              <EditorRow label="노출 쿠폰">
                <div className="coupon-picker">
                  {selectableCoupons.length === 0 ? (
                    <div className="coupon-empty">
                      <span>연결 가능한 이벤트 쿠폰이 없습니다.</span>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/coupons?issueType=EVENT')}
                        className="text-button"
                      >
                        쿠폰 만들기
                      </button>
                    </div>
                  ) : (
                    selectableCoupons.map((coupon) => {
                      const checked = form.linkedCouponIds.includes(String(coupon.id));
                      return (
                        <label key={coupon.id} className="coupon-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleCouponToggle(coupon.id, e.target.checked)}
                          />
                          <span>
                            <strong>{coupon.name}</strong>
                            <em>
                              {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validUntil)}
                            </em>
                          </span>
                        </label>
                      );
                    })
                  )}
                  <div className="coupon-help">
                    다른 게시판에 이미 연결된 이벤트 쿠폰은 여기서 선택할 수 없습니다.
                  </div>
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
                        <th
                          key={header}
                          style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}
                        >
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
                        const endedAt = new Date(board.endAt).getTime();
                        const isExpired = Number.isFinite(endedAt) && endedAt < Date.now();
                        const hasLinkedCoupons = linkedCoupons.length > 0;
                        const deleteBlockReason = hasLinkedCoupons
                          ? '연결된 쿠폰이 있어 삭제할 수 없습니다.'
                          : null;
                        const statusBlockReason = isExpired
                          ? '노출 기간이 종료된 게시판입니다.'
                          : null;
                        const effectiveActive = isExpired ? false : board.isActive;

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
                              {isExpired ? (
                                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>
                                  노출 종료
                                </div>
                              ) : null}
                            </td>
                            <td style={{ padding: 12, fontSize: 13, color: '#334155' }}>
                              {linkedCoupons.length === 0 ? (
                                <span style={{ color: '#94a3b8' }}>없음</span>
                              ) : (
                                <span>
                                  {linkedCoupons.length}장 ({linkedCoupons.map((coupon) => coupon.name).join(', ')})
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 12 }}>
                              <select
                                className="admin-input"
                                style={{ width: 100 }}
                                value={effectiveActive ? 'ACTIVE' : 'INACTIVE'}
                                disabled={updatingId === board.id || Boolean(statusBlockReason)}
                                title={statusBlockReason ?? undefined}
                                onChange={(e) => handleStatusChange(board, e.target.value === 'ACTIVE')}
                              >
                                <option value="ACTIVE">노출</option>
                                <option value="INACTIVE">숨김</option>
                              </select>
                            </td>
                            <td style={{ padding: 12, display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleEdit(board)}
                                style={actionButtonStyle}
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
          .flow-guide {
            display: grid;
            gap: 4px;
            margin: 16px 20px 0;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            background: #eff6ff;
            padding: 12px 14px;
            color: #1d4ed8;
            font-size: 13px;
          }
          .flow-guide strong {
            color: #1e3a8a;
            font-size: 13px;
          }
          .editor-row {
            display: grid;
            grid-template-columns: 132px minmax(0, 1fr);
            gap: 18px;
            padding: 18px 20px;
            border-bottom: 1px solid #eef2f7;
          }
          .editor-row:last-child {
            border-bottom: 0;
          }
          .editor-label {
            padding-top: 10px;
            font-size: 13px;
            font-weight: 800;
            color: #334155;
          }
          .checkline {
            display: inline-flex;
            min-height: 40px;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #334155;
          }
          .period-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .sub-label {
            margin-bottom: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
          }
          .thumbnail-editor {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 260px;
            gap: 16px;
            align-items: start;
          }
          .thumbnail-controls {
            display: grid;
            gap: 8px;
          }
          .thumbnail-preview {
            display: flex;
            aspect-ratio: 4 / 3;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f8fafc;
            color: #94a3b8;
            font-size: 13px;
          }
          .thumbnail-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .content-input {
            min-height: 180px;
            padding-top: 10px;
            resize: vertical;
          }
          .coupon-picker {
            display: grid;
            gap: 8px;
          }
          .coupon-option {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 12px;
            background: #fff;
          }
          .coupon-option strong {
            display: block;
            font-size: 13px;
            color: #0f172a;
          }
          .coupon-option em {
            display: block;
            margin-top: 3px;
            font-style: normal;
            font-size: 12px;
            color: #64748b;
          }
          .coupon-empty {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 14px;
            color: #64748b;
            font-size: 13px;
          }
          .text-button {
            border: 0;
            background: transparent;
            color: #ea580c;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
          }
          .coupon-help {
            font-size: 12px;
            color: #64748b;
          }
          @media (max-width: 900px) {
            .editor-row {
              grid-template-columns: 1fr;
              gap: 8px;
              padding: 16px;
            }
            .editor-label {
              padding-top: 0;
            }
            .period-grid,
            .thumbnail-editor,
            .coupon-empty {
              grid-template-columns: 1fr;
            }
            .coupon-empty {
              display: grid;
              justify-content: stretch;
            }
          }
        `}</style>
      </div>
    </>
  );
}

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
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 22, color: '#0f172a', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function EditorRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="editor-row">
      <div className="editor-label">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function DateTimeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const current = normalizeDateTime(value);
  const date = current.includes('T') ? current.slice(0, 10) : '';
  const hour = current.includes('T') ? current.slice(11, 13) : '00';
  const minute = current.includes('T') ? current.slice(14, 16) : '00';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 76px 76px', gap: 8 }}>
      <input
        className="admin-input"
        type="date"
        value={date}
        onChange={(e) => onChange(setDatePart(value, e.target.value))}
      />
      <select
        className="admin-input"
        value={hour}
        onChange={(e) => onChange(setTimePart(value, e.target.value, minute))}
      >
        {Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')).map((option) => (
          <option key={option} value={option}>
            {option}시
          </option>
        ))}
      </select>
      <select
        className="admin-input"
        value={minute}
        onChange={(e) => onChange(setTimePart(value, hour, e.target.value))}
      >
        {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).map((option) => (
          <option key={option} value={option}>
            {option}분
          </option>
        ))}
      </select>
    </div>
  );
}
