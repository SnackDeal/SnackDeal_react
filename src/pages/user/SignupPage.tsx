import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Gift } from 'lucide-react';
import { Button, Input, Select, Modal } from '@/components/ui';
import { AuthShell } from '@/components/common/AuthShell';
import { GoogleLoginButton } from '@/components/common/GoogleLoginButton';
import { BirthDateSelect } from '@/components/common/BirthDateSelect';
import { PhoneNumberInput } from '@/components/common/PhoneNumberInput';
import { formatPhoneNumberForStorage, isCompletePhoneNumber } from '@/lib/phone';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { useCountdown } from '@/lib/useCountdown';
import { isEmail, isValidPassword } from '@/lib/mockAuth';
import { apiSendCode, apiVerifyCode, apiJoin, apiLogin, type ApiError } from '@/lib/api';
import type { Gender } from '@/types';
import { cn } from '@/lib/cn';

type Step = 1 | 2;

/** 2단계에서 수집하는 회원 정보 */
interface UserInfo {
  password?: string;
  name: string;
  phone: string;
  birth: string;
  gender: Gender;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSessionFromApi } = useAuthStore();
  const showToast = useToastStore((s) => s.show);

  // 구글 소셜 로그인 신규유저 케이스. OAuthCallback이 email/name과 함께 이 페이지로 보냄
  const socialEmail = searchParams.get('email');
  const socialName = searchParams.get('name');
  const isSocialSignup = !!socialEmail;

  const [step, setStep] = useState<Step>(isSocialSignup ? 2 : 1);
  const [verification, setVerification] = useState<{ email: string; token: string } | null>(
    isSocialSignup ? { email: socialEmail, token: '' } : null
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const subtitle = isSocialSignup
    ? `${socialName ?? ''}님, 환영합니다! 추가 정보를 입력해주세요.`
    : '정보를 입력한 후 이메일 인증을 완료하세요';

  return (
    <AuthShell
      title="회원가입"
      subtitle={subtitle}
      footer={
        !isSocialSignup && (
          <>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              로그인
            </Link>
            <SocialLoginButtons />
          </>
        )
      }
    >
      <StepIndicator step={step} isSocial={isSocialSignup} />
      {step === 1 ? (
        <EmailStep
          onVerified={(email, verificationToken) => {
            setVerification({ email, token: verificationToken });
            setStep(2);
          }}
        />
      ) : (
        <InfoStep
          email={verification!.email}
          initialName={isSocialSignup ? socialName ?? '' : ''}
          isSocial={isSocialSignup}
          onBack={!isSocialSignup ? () => setStep(1) : undefined}
          onJoin={async (userInfo) => {
            if (isSocialSignup) {
              try {
                const { accessToken, refreshToken, ...me } = await apiJoin({
                  ...userInfo,
                  email: verification!.email,
                  isSocialLogin: true,
                });
                if (!accessToken || !refreshToken) {
                  throw { code: 'UNKNOWN', message: '로그인 세션을 받지 못했습니다.' } as ApiError;
                }
                setSessionFromApi({ accessToken, refreshToken }, me);
                setIsSuccessModalOpen(true);
              } catch (err) {
                showToast((err as ApiError).message ?? '회원가입에 실패했습니다.', 'error');
              }
            } else {
              try {
                const joinPayload = {
                  ...userInfo,
                  password: userInfo.password!,
                  email: verification!.email,
                  verificationToken: verification!.token,
                };

                const { accessToken, refreshToken, ...me } = await apiJoin(joinPayload);
                if (accessToken && refreshToken) {
                  setSessionFromApi({ accessToken, refreshToken }, me);
                } else {
                  const tokens = await apiLogin(verification!.email, userInfo.password!);
                  setSessionFromApi(tokens, me);
                }
                setIsSuccessModalOpen(true);
              } catch (apiErr) {
                if ((apiErr as ApiError).code !== 'NETWORK_ERROR') {
                  setStep(1);
                  setVerification(null);
                }
                throw apiErr;
              }
            }
          }}
        />
      )}
      <Modal open={isSuccessModalOpen} onClose={() => navigate('/', { replace: true })}>
        <div className="p-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Gift className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">회원가입 완료!</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>SnackDeal 회원이 되신 것을 환영합니다.</p>
            <p className="mt-1">
              감사의 의미로{' '}
              <strong className="font-semibold text-brand-600">신규회원 웰컴 쿠폰</strong>을
              지급해드렸습니다.
            </p>
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate('/', { replace: true })} className="w-full">
              홈으로 가기
            </Button>
          </div>
        </div>
      </Modal>
    </AuthShell>
  );
}

function StepIndicator({ step, isSocial }: { step: Step; isSocial: boolean }) {
  const steps = isSocial
    ? [
        { n: 1, label: '소셜 로그인' },
        { n: 2, label: '정보 입력' },
      ]
    : [
        { n: 1, label: '이메일 인증' },
        { n: 2, label: '정보 입력' },
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

/** 2단계: 비밀번호/이름/휴대폰/생년월일/성별 + 약관동의 */
function InfoStep({
  email,
  initialName,
  isSocial,
  onBack,
  onJoin,
}: {
  email: string;
  initialName: string;
  isSocial: boolean;
  onBack?: () => void;
  onJoin: (data: UserInfo) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!isSocial) {
      if (!isValidPassword(password)) {
        setError('비밀번호는 8자 이상, 영문·숫자·특수문자를 포함해야 합니다.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
    }
    if (name.trim().length < 2 || name.trim().length > 20) {
      setError('이름은 2~20자로 입력해주세요.');
      return;
    }
    if (!isCompletePhoneNumber(phone)) {
      setError('휴대폰번호를 앞자리, 가운데자리, 끝자리까지 모두 입력해주세요.');
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

    setLoading(true);
    try {
      const userInfo: UserInfo = {
        name: name.trim(),
        phone: formatPhoneNumberForStorage(phone),
        birth,
        gender,
      };
      if (!isSocial) {
        userInfo.password = password;
      }
      await onJoin(userInfo);
    } catch (err) {
      // onJoin에서 처리된 에러 외의 에러(네트워크 등)가 있다면 여기서 처리
      if (!(err as ApiError).code) {
        setError((err as Error).message || '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input id="email" label="이메일" type="email" value={email} disabled />
      {!isSocial && (
        <>
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
        </>
      )}
      <Input
        id="name"
        label="이름"
        placeholder="이름 (2~20자)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isSocial}
      />
      <PhoneNumberInput
        value={phone}
        onChange={setPhone}
      />
      <div className="flex gap-3">
        <BirthDateSelect
          value={birth}
          onChange={setBirth}
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

      <div className="mt-2 flex gap-2">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            이전
          </Button>
        )}
        <Button type="submit" size="lg" className={onBack ? 'flex-[2]' : 'w-full'} disabled={loading}>
          {loading ? '가입 처리 중...' : '가입 완료'}
        </Button>
      </div>
    </form>
  );
}

/** 1단계: 이메일 입력 → 인증코드 전송 → 검증 */
function EmailStep({
  onVerified,
}: {
  onVerified: (email: string, verificationToken: string) => void;
}) {
  const showToast = useToastStore((s) => s.show);
  // useCountdown 훅을 분리하여 재전송 타이머와 코드 만료 타이머를 독립적으로 관리
  const {
    remaining: resendRemaining,
    start: startResend,
    isRunning: isResendCooldown,
  } = useCountdown();
  const { remaining: codeRemaining, mmss: codeMMS, start: startCode } = useCountdown();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError('');
    setLoading(true);
    if (!isEmail(email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      setLoading(false);
      return;
    }
    try {
      const res = await apiSendCode(email);
      showToast('인증코드가 발송되었습니다.', 'success');
      setSent(true);
      startCode(res.expiresIn);
      startResend(60);
    } catch (err) {
      setError((err as ApiError).message ?? '인증코드 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (codeRemaining <= 0 && sent) {
      setError('인증코드가 만료되었습니다. 재전송해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiVerifyCode(email, code);
      onVerified(email, res.verificationToken);
    } catch (err) {
      setError((err as ApiError).message ?? '인증코드 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <div className="relative">
        <Input
          id="email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || sent}
          className="pr-36"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute right-1 bottom-0.5 border-brand-200 bg-white text-brand-700 shadow-sm hover:border-brand-300 hover:bg-brand-50 disabled:border-ink-200 disabled:bg-ink-100 disabled:text-ink-400"
          onClick={handleSend}
          disabled={loading || isResendCooldown}
        >
          {isResendCooldown
            ? `재전송 (${resendRemaining}s)`
            : sent
            ? '재전송'
            : '인증코드 전송'}
        </Button>
      </div>

      {sent && (
        <div className="relative">
          <Input
            id="code"
            label="인증코드"
            inputMode="numeric"
            placeholder="이메일로 받은 6자리 숫자"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            disabled={loading}
          />
          {codeRemaining > 0 && (
            <span className="absolute right-3 bottom-2.5 text-sm text-gray-500">{codeMMS}</span>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" size="lg" className="mt-2" disabled={!sent || loading}>
        {loading ? '인증 중...' : '다음'}
      </Button>
    </form>
  );
}

function SocialLoginButtons() {
  return (
    <div className="mt-6">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">소셜 계정으로 계속하기</span>
        </div>
      </div>
      <GoogleLoginButton />
    </div>
  );
}
