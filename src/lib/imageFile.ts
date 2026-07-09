export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** S3 업로드 URL에서 표시용 파일명을 추출한다. `<uuid>_원본명.ext` 형태의 UUID 접두어를 제거한다. */
export function getDisplayFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = decodeURIComponent(path.split('/').pop() ?? '');
    return last.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '') || last;
  } catch {
    const last = url.split('/').pop() ?? url;
    return last.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '') || last;
  }
}

export async function prepareImageForUpload(file: File, maxBytes = MAX_IMAGE_UPLOAD_BYTES): Promise<File> {
  if (file.size > maxBytes) {
    throw new Error(`이미지는 ${formatFileSize(maxBytes)} 이하만 업로드할 수 있습니다.`);
  }

  return file;
}
