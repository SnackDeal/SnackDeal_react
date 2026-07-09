export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export async function prepareImageForUpload(file: File, maxBytes = MAX_IMAGE_UPLOAD_BYTES): Promise<File> {
  if (file.size > maxBytes) {
    throw new Error(`이미지는 ${formatFileSize(maxBytes)} 이하만 업로드할 수 있습니다.`);
  }

  return file;
}
