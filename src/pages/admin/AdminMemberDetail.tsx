import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  apiGetAdminMember,
  apiUpdateMemberStatus,
  type MemberDescription,
  type ApiError,
} from '@/lib/api';

const STATUS_LABELS: Record<string, string> = { ACTIVE: '활성', INACTIVE: '비활성', DELETED: '탈퇴' };
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#e8f5e9', color: '#2e7d32' },
  INACTIVE: { bg: '#fff3e0', color: '#e65100' },
  DELETED: { bg: '#ffebee', color: '#c62828' },
};

export function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();

  const [member, setMember] = useState<MemberDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 상태 변경 모달
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DELETED'>('INACTIVE');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    if (!adminSession || !id) return;
    const numId = Number(id);

    const load = async () => {
      if (!accessToken) { setError('로그인이 필요합니다.'); return; }
      try {
        const m = await apiGetAdminMember(accessToken, numId);
        setMember(m);
      } catch (e) {
        const ae = e as ApiError;
        setError(ae.status === 404 ? '회원을 찾을 수 없습니다.' : (ae.message ?? '회원 정보를 불러올 수 없습니다.'));
      }
    };

    load().finally(() => setLoading(false));
  }, [adminSession, accessToken, id]);

  const handleStatusUpdate = async () => {
    if (!member || !reason.trim()) { setUpdateError('사유를 입력해주세요.'); return; }
    setUpdating(true);
    setUpdateError('');
    try {
      if (!accessToken) { setUpdateError('로그인이 필요합니다.'); return; }
      const res = await apiUpdateMemberStatus(accessToken, member.id, newStatus, reason);
      setMember((prev) => prev ? { ...prev, status: res.status } : prev);
      setShowModal(false);
      setReason('');
    } catch (e) {
      setUpdateError((e as ApiError).message ?? '상태 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  if (!adminSession) return null;
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#c62828' }}>{error}</div>;
  if (!member) return null;

  const sc = STATUS_COLORS[member.status] ?? { bg: '#f0f0f0', color: '#333' };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/admin/members')}
        style={{ marginBottom: '24px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '12px' }}
      >
        ← 목록으로
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>회원 상세</h1>
        <button
          onClick={() => { setNewStatus(member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); setShowModal(true); }}
          style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px' }}
        >
          상태 변경
        </button>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
        {[
          ['ID', member.id],
          ['이메일', member.email],
          ['이름', member.name],
          ['휴대폰', member.phone],
          ['생년월일', member.birth],
          ['성별', member.gender === 'MALE' ? '남성' : '여성'],
          ['역할', member.role],
          ['가입일', new Date(member.createdAt).toLocaleString()],
          ['최근 로그인', member.lastLogin ? new Date(member.lastLogin).toLocaleString() : '-'],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            <div style={{ width: '140px', padding: '14px 16px', background: '#f9f9f9', fontSize: '13px', fontWeight: '600', color: '#555', flexShrink: 0 }}>
              {label}
            </div>
            <div style={{ padding: '14px 16px', fontSize: '13px' }}>{String(value)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          <div style={{ width: '140px', padding: '14px 16px', background: '#f9f9f9', fontSize: '13px', fontWeight: '600', color: '#555', flexShrink: 0 }}>상태</div>
          <div style={{ padding: '14px 16px' }}>
            <span style={{ padding: '4px 10px', background: sc.bg, color: sc.color, borderRadius: '2px', fontSize: '12px' }}>
              {STATUS_LABELS[member.status] ?? member.status}
            </span>
          </div>
        </div>
      </div>

      {/* 상태 변경 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '32px', width: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>회원 상태 변경</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>변경할 상태</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | 'DELETED')}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              >
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="DELETED">탈퇴</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>사유 *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="변경 사유를 입력하세요"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            {updateError && <p style={{ color: '#c62828', fontSize: '13px', marginBottom: '12px' }}>{updateError}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setUpdateError(''); setReason(''); }}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>
                취소
              </button>
              <button onClick={handleStatusUpdate} disabled={updating}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#333', color: 'white', cursor: updating ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                {updating ? '처리 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
