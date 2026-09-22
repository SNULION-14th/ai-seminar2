const MAX_FILE_BYTES = 50 * 1024;

type MarkdownFile = Pick<File, 'name' | 'size' | 'text'>;
type Callbacks = {
  onText: (text: string) => void;
  onError: (message: string) => void;
  onSettled: () => void;
};

/** 파일 읽기는 취소 API가 없으므로 취소·교체된 요청의 결과와 오류를 버린다. */
export function createMarkdownLoader() {
  let current: Callbacks | null = null;

  function cancel(notify = true): void {
    const previous = current;
    current = null;
    if (notify) previous?.onSettled();
  }

  async function read(file: MarkdownFile, callbacks: Callbacks): Promise<void> {
    // 새 읽기의 loading 상태를 이전 요청의 정리 콜백이 지우지 않게 알림 없이 교체한다.
    cancel(false);
    current = callbacks;
    try {
      if (!file.name.toLowerCase().endsWith('.md')) throw new Error('`.md` 파일만 불러올 수 있습니다.');
      if (file.size > MAX_FILE_BYTES) throw new Error('파일은 50 KiB 이하여야 합니다.');
      let text: string;
      try {
        text = await file.text();
      } catch {
        throw new Error('파일을 읽지 못했습니다.');
      }
      if (current !== callbacks) return;
      if (text.includes('�')) throw new Error('UTF-8 텍스트로 읽을 수 없는 파일입니다.');
      callbacks.onText(text);
    } catch (error: unknown) {
      if (current === callbacks) callbacks.onError(error instanceof Error ? error.message : '파일을 읽지 못했습니다.');
    } finally {
      if (current === callbacks) {
        current = null;
        callbacks.onSettled();
      }
    }
  }

  return { read, cancel };
}
