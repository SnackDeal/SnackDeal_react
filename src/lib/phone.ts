export function phoneDigitsOnly(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function splitPhoneNumber(value: string) {
  // 대시가 있으면 사용자가 세그먼트 단위로 편집 중 — 대시 위치를 그대로 존중한다.
  // (앞자리를 지웠을 때 뒷자리가 앞으로 밀려 들어오는 버그 방지)
  if (value.includes('-')) {
    const [rawFirst = '', rawMiddle = '', rawLast = ''] = value.split('-');
    return {
      first: rawFirst.replace(/\D/g, '').slice(0, 3),
      middle: rawMiddle.replace(/\D/g, '').slice(0, 4),
      last: rawLast.replace(/\D/g, '').slice(0, 4),
    };
  }

  const digits = phoneDigitsOnly(value);

  if (digits.length <= 3) {
    return { first: digits, middle: '', last: '' };
  }

  if (digits.length <= 7) {
    return {
      first: digits.slice(0, 3),
      middle: digits.slice(3),
      last: '',
    };
  }

  return {
    first: digits.slice(0, 3),
    middle: digits.slice(3, digits.length - 4),
    last: digits.slice(-4),
  };
}

export function formatPhoneNumberForStorage(value: string) {
  const { first, middle, last } = splitPhoneNumber(value);
  return first && middle && last ? `${first}-${middle}-${last}` : value;
}

export function isCompletePhoneNumber(value: string) {
  return /^01[016789]-\d{3,4}-\d{4}$/.test(formatPhoneNumberForStorage(value));
}
