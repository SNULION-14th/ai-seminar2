export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 권한이나 브라우저 정책으로 실패할 수 있다. 화면의 텍스트를 직접 선택해 복사하도록 안내한다.
    return false;
  }
}
