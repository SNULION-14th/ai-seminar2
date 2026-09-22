import { isRecord, validateGenerateInput, type GenerateInput } from '../../shared/contracts';
import { normalizeReferenceMode } from '../../shared/referenceModes';
import { parseManifest, type TemplateManifest } from '../../shared/templateManifest';

/**
 * 입력과 레퍼런스를 이 브라우저에 남겨 다음에 열 때 채워 둔다.
 * 나 혼자 쓰는 도구라 매번 브랜드 자료를 다시 붙여넣는 것이 가장 큰 낭비였다.
 *
 * 저장소가 막혀 있거나(사생활 보호 창 등) 형식이 바뀌었을 수 있으므로 읽기는 항상 실패를 견딘다.
 * 키나 비밀값은 여기 들어가지 않는다. 서버 환경변수에만 둔다.
 */
const INPUT_KEY = 'cardnews.input.v1';
const TEMPLATE_KEY = 'cardnews.template.v1';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장에 실패해도 화면은 그대로 돌아가야 한다.
  }
}

function clear(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 무시
  }
}

/** 저장된 입력을 기본값 위에 덮어쓴다. 필드가 늘거나 줄어도 깨지지 않는다. */
export function loadInput(fallback: GenerateInput): GenerateInput {
  const defaults = { ...fallback, templateMode: normalizeReferenceMode(fallback.templateMode) };
  const raw = read(INPUT_KEY);
  if (!raw) return defaults;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!isRecord(saved)) return defaults;
    const merged = { ...defaults };
    const templateMode = normalizeReferenceMode(saved.templateMode, defaults.templateMode);
    // 제출과 같은 계약으로 필드별 오류를 확인한다. 일부 저장값이 잘못됐더라도
    // 나머지 유효한 입력은 복원하고 해당 필드만 기본값으로 되돌린다.
    const checked = validateGenerateInput({ ...defaults, ...saved, templateMode });
    for (const key of Object.keys(fallback) as (keyof GenerateInput)[]) {
      const value = saved[key];
      if (!Object.hasOwn(saved, key) || (!checked.success && Object.hasOwn(checked.errors, key))) continue;
      if (typeof value === typeof defaults[key]) (merged[key] as unknown) = value;
    }
    // color input은 앞뒤 공백이 있는 값을 처리하지 못한다.
    merged.primaryColor = merged.primaryColor.trim();
    merged.templateMode = templateMode;
    return merged;
  } catch {
    return defaults;
  }
}

export function saveInput(input: GenerateInput): void {
  write(INPUT_KEY, JSON.stringify(input));
}

export function loadTemplate(): TemplateManifest | null {
  const raw = read(TEMPLATE_KEY);
  if (!raw) return null;
  const result = parseManifest(raw);
  return result.ok ? result.manifest : null;
}

export function saveTemplate(manifest: TemplateManifest | null): void {
  if (manifest) write(TEMPLATE_KEY, JSON.stringify(manifest));
  else clear(TEMPLATE_KEY);
}
