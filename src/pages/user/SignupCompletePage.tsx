import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select } from '@/components/ui';
import { AuthShell } from '@/components/common/AuthShell';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { apiUpdateMe, type ApiError } from '@/lib/api';
import type { Gender } from '@/types';

export default function SignupCompletePage() {
  const navigate = useNavigate();
  const { member, accessToken, updateMember } = useAuthStore();
  const showToast = useToastStore((s) => s.show);

  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!member || !accessToken) {
    navigate('/login', { replace: true });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{10,11}$/.test(phone)) {
      setError('휴대폰번호는 하이픈 없이 10~11자리 숫자로 입력해주세요.');
      return;
    }
    if (!birth) { setError('생년월일을 입력해주세요.'); return; }
    if (!gender) { setError('성별을 선택해주세요.'); return; }

    setLoading(true);
    try {
      const updated = await apiUpdateMe(accessToken!, { phone, birth, gender: gender as 'MALE' | 'FEMALE' });
      updateMember(updated);
      showToast('회원가입이 완료되었습니다.', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as ApiError).message ?? '정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="추가 정보 입력"
      subtitle={`${member.email} 계정의 정보를 완성해주세요`}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input id="email" label="이메일" type="email" value={member.email} disabled />
        <Input id="name" label="이름" value={member.name} disabled />
        <Input
          id="phone"
          label="휴대폰번호"
          inputMode="numeric"
          placeholder="하이픈 없이 (예: 01012345678)"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          maxLength={11}
        />
        <div className="flex gap-3">
          <Input
            id="birth"
            label="생년월일"
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            className="flex-1"
          />
          <Select
            id="gender"
            label="성별"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            options={[
              { value: '', label: '선택' },
              { value: 'MALE', label: '남성' },
              { value: 'FEMALE', label: '여성' },
            ]}
            className="w-32"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" className="mt-2" disabled={loading}>
          {loading ? '저장 중...' : '가입 완료'}
        </Button>
      </form>
    </AuthShell>
  );
}