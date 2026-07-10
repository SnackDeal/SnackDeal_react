import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminPagination, type AdminPageSize } from '@/components/admin/Pagination';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
  apiCreateAdminCoupon,
  apiGetAdminCouponBoards,
  apiGetAdminCoupons,
  apiUpdateAdminCoupon,
  apiUpdateAdminCouponStatus,
  type AdminCoupon,
  type AdminCouponBoard,
  type AdminCouponDiscountType,
  type AdminCouponIssueType,
  type ApiError,
} from '@/lib/api';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

type CouponForm = {
  name: string;
  discountType: AdminCouponDiscountType;
  discountValue: string;
  minOrderPrice: string;
  validFrom: string;
  validUntil: string;
  totalQuantity: string;
  issueType: AdminCouponIssueType;
  couponBoardId: string;
  isActive: boolean;
};

const emptyForm: CouponForm = {
  name: '',
  discountType: 'FIXED',
  discountValue: '',
  minOrderPrice: '0',
  validFrom: '',
  validUntil: '',
  totalQuantity: '',
  issueType: 'SIGNIN',
  couponBoardId: '',
  isActive: true,
};

function formatDate(value: string | null | undefined) {
  if (!value) return '기한 없음';
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

function formatDiscount(coupon: AdminCoupon) {
  return coupon.discountType === 'FIXED'
    ? `정액 ₩${coupon.discountValue.toLocaleString()}`
    : `정률 ${coupon.discountValue}%`;
}

function formatQuantity(coupon: AdminCoupon) {
  if (coupon.totalQuantity === 0) return '무제한';
  return `${coupon.issuedQuantity.toLocaleString()} / ${coupon.totalQuantity.toLocaleString()}`;
}

function couponStatusLabel(coupon: AdminCoupon) {
  if (coupon.status === 'EXPIRED') return '만료';
  if (coupon.status === 'STOPPED') return '중지';
  return coupon.isActive ? '활성' : '중지';
}

function isCouponExpired(coupon: AdminCoupon) {
  if (coupon.status === 'EXPIRED') return true;
  if (!coupon.validUntil) return false;
  const expiresAt = new Date(coupon.validUntil).getTime();
  return Number.isFinite(expiresAt) && expiresAt < Date.now();
}

function hasCouponStarted(coupon: AdminCoupon) {
  const startsAt = new Date(coupon.validFrom).getTime();
  return Number.isFinite(startsAt) && startsAt <= Date.now();
}

function canEditCoupon(coupon: AdminCoupon) {
  return !isCouponExpired(coupon) && !hasCouponStarted(coupon);
}

function canToggleCouponStatus(coupon: AdminCoupon) {
  return !isCouponExpired(coupon);
}

export default function AdminCouponsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { adminSession, accessToken } = useAdminAuthStore();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [boards, setBoards] = useState<AdminCouponBoard[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);

  const totalPages = Math.max(Math.ceil(coupons.length / pageSize), 1);
  const clampedPage = Math.min(page, totalPages - 1);
  const pagedCoupons = useMemo(
    () => coupons.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize),
    [coupons, clampedPage, pageSize]
  );

  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === Number(form.couponBoardId)) ?? null,
    [boards, form.couponBoardId]
  );
  const editingCoupon = useMemo(
    () => (editingId ? coupons.find((coupon) => coupon.id === editingId) ?? null : null),
    [coupons, editingId]
  );
  const isEditing = editingId !== null;
  const needsEventBoard = form.issueType === 'EVENT' && !form.couponBoardId;

  const periodWarnings = useMemo(() => {
    if (form.issueType !== 'EVENT' || !selectedBoard || !form.validFrom) return [];

    const warnings: string[] = [];
    const boardStart = new Date(selectedBoard.startAt).getTime();
    const boardEnd = selectedBoard.endAt ? new Date(selectedBoard.endAt).getTime() : null;
    const couponStart = new Date(form.validFrom).getTime();
    const couponEnd = form.validUntil ? new Date(form.validUntil).getTime() : null;

    if (Number.isFinite(boardStart) && Number.isFinite(couponStart) && couponStart < boardStart) {
      warnings.push('쿠폰 시작일이 게시판 노출 시작보다 빠릅니다.');
    }
    if (boardEnd !== null && couponEnd !== null && Number.isFinite(boardEnd) && Number.isFinite(couponEnd) && couponEnd > boardEnd) {
      warnings.push('쿠폰 종료일이 게시판 노출 종료보다 늦습니다.');
    }

    return warnings;
  }, [form.issueType, form.validFrom, form.validUntil, selectedBoard]);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const [couponRows, boardRows] = await Promise.all([
        apiGetAdminCoupons(accessToken),
        apiGetAdminCouponBoards(accessToken),
      ]);
      setCoupons(couponRows);
      setBoards(boardRows);
    } catch (e) {
      const apiError = e as ApiError;
      setError(apiError.message ?? '쿠폰 정보를 불러오지 못했습니다.');
      setCoupons([]);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminSession) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, accessToken]);

  useEffect(() => {
    const issueType = searchParams.get('issueType');
    const couponBoardId = searchParams.get('couponBoardId');
    if (issueType !== 'EVENT' || !couponBoardId) return;

    setForm((prev) => ({
      ...prev,
      issueType: 'EVENT',
      couponBoardId,
    }));
    setIsFormOpen(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!adminSession) return null;

  const updateForm = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'issueType' && value === 'SIGNIN') {
        next.couponBoardId = '';
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (coupon: AdminCoupon) => {
    if (!canEditCoupon(coupon)) {
      const message = isCouponExpired(coupon)
        ? '만료된 쿠폰은 수정할 수 없습니다.'
        : '쿠폰 시작 이후에는 수정할 수 없습니다.';
      setToast({ message, type: 'error' });
      return;
    }

    setEditingId(coupon.id);
    setForm({
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderPrice: String(coupon.minOrderPrice),
      validFrom: normalizeDateTime(coupon.validFrom),
      validUntil: normalizeDateTime(coupon.validUntil),
      totalQuantity: String(coupon.totalQuantity),
      issueType: coupon.issueType,
      couponBoardId: coupon.couponBoardId ? String(coupon.couponBoardId) : '',
      isActive: coupon.isActive,
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    if (!form.name.trim()) return '쿠폰명을 입력해 주세요.';

    const discountValue = Number(form.discountValue);
    const minOrderPrice = Number(form.minOrderPrice);
    const totalQuantity = Number(form.totalQuantity || '0');

    if (!isEditing) {
      if (!Number.isFinite(discountValue) || discountValue <= 0) return '할인 값을 확인해 주세요.';
      if (form.discountType === 'PERCENT' && discountValue > 100) return '정률 할인은 100 이하만 가능합니다.';
      if (!Number.isFinite(minOrderPrice) || minOrderPrice < 0) return '최소 주문 금액을 확인해 주세요.';
      if (!form.validFrom) return '쿠폰 시작일을 입력해 주세요.';
      if (form.issueType === 'EVENT' && !form.couponBoardId) return '이벤트 쿠폰은 게시판 선택이 필요합니다.';
    }

    if (!Number.isFinite(totalQuantity) || totalQuantity < 0) return '발급 수량을 확인해 주세요.';

    if (form.validFrom && form.validUntil) {
      if (new Date(form.validFrom).getTime() > new Date(form.validUntil).getTime()) {
        return '시작일은 종료일보다 늦을 수 없습니다.';
      }
    }

    if (editingCoupon) {
      const currentValidUntil = editingCoupon.validUntil ? new Date(editingCoupon.validUntil).getTime() : null;
      const nextValidUntil = form.validUntil ? new Date(form.validUntil).getTime() : null;

      if (currentValidUntil === null && nextValidUntil !== null) {
        return '무기한 쿠폰에는 종료일을 새로 설정할 수 없습니다.';
      }
      if (currentValidUntil !== null && nextValidUntil !== null && nextValidUntil < currentValidUntil) {
        return '종료일은 연장만 가능합니다.';
      }
      if (editingCoupon.totalQuantity === 0 && totalQuantity > 0) {
        return '무제한 쿠폰은 제한 수량으로 변경할 수 없습니다.';
      }
      if (editingCoupon.totalQuantity > 0 && totalQuantity > 0 && totalQuantity < editingCoupon.totalQuantity) {
        return '발급 수량은 줄일 수 없습니다.';
      }
      if (totalQuantity > 0 && totalQuantity < editingCoupon.issuedQuantity) {
        return '이미 발급된 수량보다 작게 설정할 수 없습니다.';
      }

      const changed =
        form.name.trim() !== editingCoupon.name ||
        normalizeDateTime(form.validUntil) !== normalizeDateTime(editingCoupon.validUntil) ||
        Number(form.totalQuantity || '0') !== editingCoupon.totalQuantity;

      if (!changed) return '변경된 내용이 없습니다.';
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
      if (editingId && editingCoupon) {
        const updatePayload: {
          name?: string;
          validUntil?: string | null;
          totalQuantity?: number;
        } = {};

        if (form.name.trim() !== editingCoupon.name) {
          updatePayload.name = form.name.trim();
        }
        if (normalizeDateTime(form.validUntil) !== normalizeDateTime(editingCoupon.validUntil)) {
          updatePayload.validUntil = form.validUntil || null;
        }
        if (Number(form.totalQuantity || '0') !== editingCoupon.totalQuantity) {
          updatePayload.totalQuantity = Number(form.totalQuantity || '0');
        }

        await apiUpdateAdminCoupon(accessToken, editingId, updatePayload);
        setToast({ message: '쿠폰이 수정되었습니다.', type: 'success' });
      } else {
        await apiCreateAdminCoupon(accessToken, {
          name: form.name.trim(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderPrice: Number(form.minOrderPrice),
          validFrom: form.validFrom,
          validUntil: form.validUntil || null,
          totalQuantity: Number(form.totalQuantity || '0'),
          issueType: form.issueType,
          isActive: form.isActive,
          couponBoardId: form.issueType === 'EVENT' ? Number(form.couponBoardId) : null,
        });
        setToast({ message: '쿠폰이 등록되었습니다.', type: 'success' });
      }

      resetForm();
      await loadData();
    } catch (e) {
      const apiError = e as ApiError;
      setToast({ message: apiError.message ?? '쿠폰 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (coupon: AdminCoupon, isActive: boolean) => {
    if (!accessToken) return;
    if (!canToggleCouponStatus(coupon)) {
      setToast({ message: '만료된 쿠폰은 활성 상태를 변경할 수 없습니다.', type: 'error' });
      return;
    }

    const previous = coupons;
    setCoupons((rows) => rows.map((row) => (row.id === coupon.id ? { ...row, isActive } : row)));
    setUpdatingId(coupon.id);

    try {
      await apiUpdateAdminCouponStatus(accessToken, coupon.id, isActive);
      await loadData();
    } catch (e) {
      const apiError = e as ApiError;
      setCoupons(previous);
      setToast({ message: apiError.message ?? '쿠폰 상태 변경에 실패했습니다.', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>쿠폰 관리</h1>
            <p style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
              쿠폰 생성은 여기서 하고, 이벤트 쿠폰은 게시판과 연결해서 운영합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              새로고침
            </Button>
            <Button onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}>
              {isFormOpen ? '닫기' : '쿠폰 등록'}
            </Button>
          </div>
        </div>

        {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}

        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
              background: '#fff',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div style={{ gridColumn: '1 / -1', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              {isEditing ? '쿠폰 수정' : '쿠폰 등록'}
            </div>

            <div style={isEditing ? noticeWarningStyle : noticeInfoStyle}>
              <strong style={noticeTitleStyle}>{isEditing ? '수정 가능 항목' : '등록 안내'}</strong>
              {isEditing
                ? '기존 쿠폰은 이름, 종료일 연장, 발급 수량 증가(또는 0으로 무제한 전환), 활성 상태만 운영 변경할 수 있습니다.'
                : 'SIGNIN 쿠폰은 자동 지급되고, EVENT 쿠폰은 게시판을 먼저 만든 뒤 선택해 연결합니다.'}
            </div>

            <Field label="쿠폰명">
              <input className="admin-input" value={form.name} onChange={(e) => updateForm('name', e.target.value)} />
            </Field>

            <Field label="할인 방식">
              <select
                className="admin-input"
                value={form.discountType}
                disabled={isEditing}
                onChange={(e) => updateForm('discountType', e.target.value as AdminCouponDiscountType)}
              >
                <option value="FIXED">정액 할인</option>
                <option value="PERCENT">정률 할인</option>
              </select>
            </Field>

            <Field label={form.discountType === 'FIXED' ? '할인 금액' : '할인율'}>
              <input
                className="admin-input"
                type="number"
                min="1"
                max={form.discountType === 'PERCENT' ? 100 : undefined}
                value={form.discountValue}
                disabled={isEditing}
                onChange={(e) => updateForm('discountValue', e.target.value)}
                placeholder={form.discountType === 'FIXED' ? '5000' : '10'}
              />
            </Field>

            <Field label="발급 유형">
              <select
                className="admin-input"
                value={form.issueType}
                disabled={isEditing}
                onChange={(e) => updateForm('issueType', e.target.value as AdminCouponIssueType)}
              >
                <option value="EVENT">이벤트</option>
                <option value="SIGNIN">회원가입</option>
              </select>
            </Field>

            <Field label="이벤트 게시판">
              <div style={{ display: 'grid', gap: 8 }}>
                <select
                  className="admin-input"
                  value={form.couponBoardId}
                  onChange={(e) => updateForm('couponBoardId', e.target.value)}
                  disabled={isEditing || form.issueType === 'SIGNIN'}
                >
                  <option value="">{form.issueType === 'SIGNIN' ? '게시판 없음' : '게시판 선택'}</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.title}
                    </option>
                  ))}
                </select>
                {!isEditing && form.issueType === 'EVENT' && (
                  <button type="button" onClick={() => navigate('/admin/coupons/boards')} style={subActionButtonStyle}>
                    게시판 만들기
                  </button>
                )}
              </div>
            </Field>

            <Field label="최소 주문 금액">
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.minOrderPrice}
                disabled={isEditing}
                onChange={(e) => updateForm('minOrderPrice', e.target.value)}
              />
            </Field>

            <Field label="시작일">
              <DateTimeSelect value={form.validFrom} disabled={isEditing} onChange={(value) => updateForm('validFrom', value)} />
            </Field>

            <Field label={isEditing ? '종료일 (선택, 연장만 가능)' : '종료일 (선택)'}>
              <DateTimeSelect value={form.validUntil} onChange={(value) => updateForm('validUntil', value)} />
            </Field>

            <Field label={isEditing ? '발급 수량 (0=무제한, 감소 불가)' : '발급 수량 (0=무제한)'}>
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.totalQuantity}
                placeholder="0"
                onChange={(e) => updateForm('totalQuantity', e.target.value)}
              />
            </Field>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateForm('isActive', e.target.checked)} />
              생성 직후 활성화
            </label>

            {form.issueType === 'EVENT' && selectedBoard && (
              <div style={noticeInfoStyle}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a' }}>{selectedBoard.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#1d4ed8' }}>
                  게시판 노출 기간: {formatDate(selectedBoard.startAt)} ~ {formatDate(selectedBoard.endAt)}
                </div>
                {periodWarnings.length > 0 && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
                    {periodWarnings.map((warning) => (
                      <div key={warning} style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {needsEventBoard && (
              <div style={noticeAlertStyle}>
                이벤트 쿠폰은 게시판 연결이 필요합니다.
                <button
                  type="button"
                  onClick={() => navigate('/admin/coupons/boards')}
                  style={{ ...subActionButtonStyle, marginLeft: 10, color: '#ea580c', borderColor: '#fb923c' }}
                >
                  게시판으로 이동
                </button>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                취소
              </Button>
              <Button type="submit" disabled={saving || needsEventBoard}>
                {saving ? '저장 중...' : isEditing ? '수정 저장' : '등록'}
              </Button>
            </div>
          </form>
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
          .admin-input:disabled {
            background: #f1f5f9;
            color: #94a3b8;
          }
          .datetime-select {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 76px 76px;
            gap: 8px;
          }
          @media (max-width: 700px) {
            .datetime-select {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {!isFormOpen && (
          <>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>로딩 중...</div>
            ) : (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflowX: 'auto', background: '#fff' }}>
                <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                      {['쿠폰명', '할인', '유형', '게시판', '최소주문', '수량', '사용수', '기간', '상태', '관리'].map((header) => (
                        <th key={header} style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                          등록된 쿠폰이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      pagedCoupons.map((coupon) => {
                        const editable = canEditCoupon(coupon);
                        const statusMutable = canToggleCouponStatus(coupon);
                        const editBlockReason = isCouponExpired(coupon)
                          ? '만료된 쿠폰은 수정할 수 없습니다.'
                          : hasCouponStarted(coupon)
                            ? '쿠폰 시작 이후에는 수정할 수 없습니다.'
                            : null;
                        const statusBlockReason = statusMutable ? null : '만료된 쿠폰은 활성 상태를 변경할 수 없습니다.';

                        return (
                        <tr key={coupon.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{coupon.name}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{formatDiscount(coupon)}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{coupon.issueType === 'SIGNIN' ? '회원가입' : '이벤트'}</td>
                          <td style={{ padding: 12, fontSize: 13, color: '#64748b' }}>
                            {coupon.couponBoardTitle ?? boards.find((board) => board.id === coupon.couponBoardId)?.title ?? '-'}
                          </td>
                          <td style={{ padding: 12, fontSize: 13 }}>₩{coupon.minOrderPrice.toLocaleString()}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{formatQuantity(coupon)}</td>
                          <td style={{ padding: 12, fontSize: 13 }}>{coupon.usedCount.toLocaleString()}</td>
                          <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>
                            {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validUntil)}
                          </td>
                          <td style={{ padding: 12 }}>
                            <div style={{ display: 'grid', gap: 6 }}>
                              <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{couponStatusLabel(coupon)}</div>
                              <select
                                className="admin-input"
                                style={{ width: 110 }}
                                value={coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                                disabled={updatingId === coupon.id || !statusMutable}
                                title={statusBlockReason ?? undefined}
                                onChange={(e) => handleStatusChange(coupon, e.target.value === 'ACTIVE')}
                              >
                                <option value="ACTIVE">활성</option>
                                <option value="INACTIVE">비활성</option>
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: 12 }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(coupon)}
                              disabled={!editable}
                              title={editBlockReason ?? undefined}
                              style={{
                                height: 34,
                                padding: '0 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                background: editable ? 'white' : '#f1f5f9',
                                color: editable ? '#334155' : '#94a3b8',
                                cursor: editable ? 'pointer' : 'not-allowed',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              수정
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

            {!loading && coupons.length > 0 && (
              <AdminPagination
                page={clampedPage}
                totalPages={totalPages}
                total={coupons.length}
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
      </div>
    </>
  );
}

const noticeTitleStyle = {
  display: 'block',
  marginBottom: 4,
  color: '#1e3a8a',
} satisfies React.CSSProperties;

const noticeInfoStyle = {
  gridColumn: '1 / -1',
  border: '1px solid #dbeafe',
  borderRadius: 8,
  background: '#eff6ff',
  padding: 14,
  fontSize: 13,
  color: '#1d4ed8',
} satisfies React.CSSProperties;

const noticeWarningStyle = {
  gridColumn: '1 / -1',
  border: '1px solid #fde68a',
  borderRadius: 8,
  background: '#fffbeb',
  padding: 14,
  fontSize: 13,
  color: '#92400e',
} satisfies React.CSSProperties;

const noticeAlertStyle = {
  gridColumn: '1 / -1',
  border: '1px solid #fed7aa',
  borderRadius: 8,
  background: '#fff7ed',
  padding: 14,
  fontSize: 13,
  color: '#9a3412',
} satisfies React.CSSProperties;

const subActionButtonStyle = {
  height: 36,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: 'white',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  cursor: 'pointer',
  padding: '0 12px',
} satisfies React.CSSProperties;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{label}</span>
      {children}
    </label>
  );
}

function DateTimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const current = normalizeDateTime(value);
  const date = current.includes('T') ? current.slice(0, 10) : '';
  const hour = current.includes('T') ? current.slice(11, 13) : '00';
  const minute = current.includes('T') ? current.slice(14, 16) : '00';

  return (
    <div className="datetime-select">
      <input
        className="admin-input"
        type="date"
        value={date}
        disabled={disabled}
        onChange={(e) => onChange(setDatePart(value, e.target.value))}
      />
      <select
        className="admin-input"
        value={hour}
        disabled={disabled || !date}
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
        disabled={disabled || !date}
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
