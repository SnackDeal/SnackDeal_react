import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { AuthShell } from '@/components/common/AuthShell';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { useCountdown } from '@/lib/useCountdown';
import {
  sendCode,
  verifyCode,
  join,
  isEmail,
  isValidPassword,
  type ApiError,
  type JoinPayload,
} from '@/lib/mockAuth';
import type { Gender } from '@/types';
import { cn } from '@/lib/cn';

type Step = 1 | 2;

/** 1단계에서 수집하는 회원 정보 */
interface SignupInfo {
  email: string;
  password: string;
  name: string;
  phone: string;
  birth: string;
  gender: Gender;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const showToast = useToastStore((s) => s.show);

  const [step, setStep] = useState<Step>(1);
  const [info, setInfo] = useState<SignupInfo | null>(null);

  return (
    <AuthShell
      title="회원가입"
      subtitle="정보를 입력한 후 이메일 인증을 완료하세요"
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            로그인
          </Link>
        </>
      }
    >
      <StepIndicator step={step} />
      {step === 1 ? (
        <InfoStep
          initial={info}
          onNext={(data) => {
            setInfo(data);
            setStep(2);
          }}
        />
      ) : (
        <EmailStep
          email={info!.email}
          onBack={() => setStep(1)}
          onVerified={async (verificationToken) => {
            const payload: JoinPayload = {
              email: info!.email,
              password: info!.password,
              name: info!.name,
              phone: info!.phone,
              birth: info!.birth,
              gender: info!.gender,
              verification_token: verificationToken,
            };
            const result = await join(payload);
            setSession(result);
            showToast('회원가입이 완료되었습니다.', 'success');
            navigate('/', { replace: true });
          }}
        />
      )}
    </AuthShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: '정보 입력' },
    { n: 2, label: '이메일 인증' },
  ];
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step >= s.n ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
            )}
          >
            {step > s.n ? <Check size={14} /> : s.n}
          </div>
          <span
            className={cn(
              'text-sm font-medium',
              step >= s.n ? 'text-gray-900' : 'text-gray-400'
            )}
          >
            {s.label}
          </span>
          {i === 0 && <div className="h-px flex-1 bg-gray-200" />}
        </div>
      ))}
    </div>
  );
}

/** 1단계: 이메일/비밀번호/이름/휴대폰/생년월일/성별 + 약관동의 */
function InfoStep({
  initial,
  onNext,
}: {
  initial: SignupInfo | null;
  onNext: (data: SignupInfo) => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [passwordConfirm, setPasswordConfirm] = useState(initial?.password ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [birth, setBirth] = useState(initial?.birth ?? '');
  const [gender, setGender] = useState<Gender | ''>(initial?.gender ?? '');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!isEmail(email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('비밀번호는 8자 이상, 영문·숫자·특수문자를 포함해야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (name.trim().length < 2 || name.trim().length > 20) {
      setError('이름은 2~20자로 입력해주세요.');
      return;
    }
    if (!/^\d{10,11}$/.test(phone)) {
      setError('휴대폰번호는 하이픈 없이 10~11자리 숫자로 입력해주세요.');
      return;
    }
    if (!birth) {
      setError('생년월일을 입력해주세요.');
      return;
    }
    if (!gender) {
      setError('성별을 선택해주세요.');
      return;
    }
    if (!agree) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요.');
      return;
    }

    onNext({ email, password, name: name.trim(), phone, birth, gender });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        id="email"
        label="이메일"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        id="password"
        label="비밀번호"
        type="password"
        placeholder="8자 이상, 영문·숫자·특수문자"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <Input
        id="passwordConfirm"
        label="비밀번호 확인"
        type="password"
        placeholder="비밀번호 재입력"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        autoComplete="new-password"
      />
      <Input
        id="name"
        label="이름"
        placeholder="이름 (2~20자)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span>
          <span className="font-medium text-gray-900">[필수]</span> 이용약관 및
          개인정보처리방침에 동의합니다.
        </span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" size="lg" className="mt-2">
        다음 — 이메일 인증
      </Button>
    </form>
  );
}

/** 2단계: 인증코드 전송 → 검증 → 가입 완료 */
function EmailStep({
  email,
  onBack,
  onVerified,
}: {
  email: string;
  onBack: () => void;
  onVerified: (verificationToken: string) => Promise<void>;
}) {
  const showToast = useToastStore((s) => s.show);
  const { remaining, mmss, start, reset } = useDualCountdown();

  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError('');
    setLoading(true);
    try {
      const { expires_in } = await sendCode(email);
      setSent(true);
      start.code(expires_in);
      start.resend(60);
      showToast('인증코드가 발송되었습니다. (콘솔 확인)', 'success');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (remaining.code <= 0) {
      setError('인증코드가 만료되었습니다. 재전송해주세요.');
      return;
    }
    setLoading(true);
    try {
      const { verification_token } = await verifyCode(email, code);
      reset();
      await onVerified(verification_token);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        <span className="font-medium text-gray-900">{email}</span> 로 인증코드를 전송합니다.
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleSend}
        disabled={loading || remaining.resend > 0}
      >
        {remaining.resend > 0
          ? `재전송 ${remaining.resend}s`
          : sent
            ? '인증코드 재전송'
            : '인증코드 전송'}
      </Button>

      {sent && (
        <div className="relative">
          <Input
            id="code"
            label="인증코드"
            inputMode="numeric"
            maxLength={6}
            placeholder="6자리 숫자"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {remaining.code > 0 && (
            <span className="absolute right-3 top-9 text-sm font-medium text-brand-600">
              {mmss.code}
            </span>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="shrink-0">
          이전
        </Button>
        <Button type="submit" size="lg" disabled={!sent || loading} className="flex-1">
          {loading ? '처리 중...' : '인증 확인 및 가입 완료'}
        </Button>
      </div>
    </form>
  );
}

/** 인증코드 만료(5분) + 재전송 제한(60초) 두 카운트다운을 함께 관리 */
function useDualCountdown() {
  const codeCd = useCountdown();
  const resendCd = useCountdown();
  return {
    remaining: { code: codeCd.remaining, resend: resendCd.remaining },
    mmss: { code: codeCd.mmss },
    start: { code: codeCd.start, resend: resendCd.start },
    reset: () => {
      codeCd.reset();
      resendCd.reset();
    },
  };
}
