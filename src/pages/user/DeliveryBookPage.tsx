import { useState } from 'react';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export default function DeliveryBookPage() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useDeliveryStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    receiver_name: '',
    receiver_phone: '',
    zipcode: '',
    address: '',
    detail_address: '',
    is_default: false,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleOpenForm = (id?: number) => {
    if (id) {
      const addr = addresses.find((a) => a.id === id);
      if (addr) {
        setForm({
          name: addr.name,
          receiver_name: addr.receiver_name,
          receiver_phone: addr.receiver_phone,
          zipcode: addr.zipcode,
          address: addr.address,
          detail_address: addr.detail_address,
          is_default: addr.is_default,
        });
        setEditingId(id);
      }
    } else {
      setForm({
        name: '',
        receiver_name: '',
        receiver_phone: '',
        zipcode: '',
        address: '',
        detail_address: '',
        is_default: addresses.length === 0,
      });
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({
      name: '',
      receiver_name: '',
      receiver_phone: '',
      zipcode: '',
      address: '',
      detail_address: '',
      is_default: false,
    });
  };

  const handleSubmit = () => {
    // Validate
    if (!form.name.trim()) {
      setToast({ message: '배송지명을 입력해주세요.', type: 'error' });
      return;
    }
    if (!form.receiver_name.trim()) {
      setToast({ message: '수령인을 입력해주세요.', type: 'error' });
      return;
    }
    if (!form.receiver_phone.trim()) {
      setToast({ message: '연락처를 입력해주세요.', type: 'error' });
      return;
    }
    if (!form.zipcode.trim()) {
      setToast({ message: '우편번호를 입력해주세요.', type: 'error' });
      return;
    }
    if (!form.address.trim()) {
      setToast({ message: '주소를 입력해주세요.', type: 'error' });
      return;
    }

    if (editingId) {
      updateAddress(editingId, form);
      setToast({ message: '배송지가 수정되었습니다.', type: 'success' });
    } else {
      addAddress(form);
      setToast({ message: '배송지가 추가되었습니다.', type: 'success' });
    }
    handleCloseForm();
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteAddress(id);
      setToast({ message: '배송지가 삭제되었습니다.', type: 'success' });
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
          배송 주소록
        </h1>

        {/* Add Button */}
        <div style={{ marginBottom: '24px' }}>
          <Button onClick={() => handleOpenForm()}>새 배송지 추가</Button>
        </div>

        {/* List */}
        {addresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            저장된 배송지가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {/* Sort: Default first */}
            {addresses
              .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
              .map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    padding: '16px',
                    position: 'relative',
                  }}
                >
                  {addr.is_default && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: '#333',
                        color: 'white',
                        borderRadius: '2px',
                      }}
                    >
                      기본배송지
                    </div>
                  )}

                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '8px', paddingRight: '80px' }}>
                      {addr.name}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                      <div>
                        <strong>수령인:</strong> {addr.receiver_name} ({addr.receiver_phone})
                      </div>
                      <div>
                        <strong>주소:</strong> [{addr.zipcode}] {addr.address} {addr.detail_address}
                      </div>
                      {addr.detail_address && (
                        <div>
                          <strong>상세:</strong> {addr.detail_address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {!addr.is_default && (
                      <button
                        onClick={() => {
                          setDefaultAddress(addr.id);
                          setToast({ message: '기본 배송지로 설정되었습니다.', type: 'success' });
                        }}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          background: 'white',
                        }}
                      >
                        기본배송지 설정
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenForm(addr.id)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        background: 'white',
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ff6b6b',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        background: 'white',
                        color: '#ff6b6b',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Modal Form */}
        {isFormOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={handleCloseForm}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '4px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                {editingId ? '배송지 수정' : '새 배송지 추가'}
              </h2>

              {/* Form Fields */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  배송지명 *
                </label>
                <input
                  type="text"
                  placeholder="예: 회사, 집"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  수령인 *
                </label>
                <input
                  type="text"
                  placeholder="수령인 이름"
                  value={form.receiver_name}
                  onChange={(e) => setForm({ ...form, receiver_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  연락처 *
                </label>
                <input
                  type="tel"
                  placeholder="01012345678"
                  value={form.receiver_phone}
                  onChange={(e) => setForm({ ...form, receiver_phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  우편번호 *
                </label>
                <input
                  type="text"
                  placeholder="12345"
                  value={form.zipcode}
                  onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  주소 *
                </label>
                <input
                  type="text"
                  placeholder="서울 강남구 테헤란로 123"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  상세주소
                </label>
                <input
                  type="text"
                  placeholder="건물명, 호수 등"
                  value={form.detail_address}
                  onChange={(e) => setForm({ ...form, detail_address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="default-addr"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="default-addr" style={{ cursor: 'pointer', fontSize: '14px' }}>
                  기본 배송지로 설정
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={handleSubmit} style={{ flex: 1 }}>
                  {editingId ? '수정' : '추가'}
                </Button>
                <Button onClick={handleCloseForm} variant="secondary" style={{ flex: 1 }}>
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
