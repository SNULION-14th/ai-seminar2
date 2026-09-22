# 프로젝트·코드 규칙

## 권장 디렉터리

```text
src/
  features/       # coordination, calendar, github
  shared/         # ui, api, types
server/
  domain/
  application/
  integrations/
  routes/
docs/
```

## 구현 규칙

- 기능 코드는 `features/<domain>`에 둔다. 페이지에서 도메인 로직을 직접 구현하지 않는다.
- 외부 연동은 `integrations` 어댑터로 감싼다.
- API 응답 타입과 UI 표시 타입을 분리한다.
- 시간은 서버에서 UTC로 저장하고 화면에서 사용자 시간대로 변환한다.
- 민감 정보와 OAuth 토큰은 환경변수·보안 저장소에만 둔다.

## 테스트·PR 규칙

- 후보 시간 계산, 상태 전이, 권한 검사는 단위 테스트를 작성한다.
- Calendar·GitHub 어댑터는 mock으로 실패·권한 만료·빈 결과를 검증한다.
- 확정 요청은 이벤트가 중복 생성되지 않도록 멱등성을 보장한다.
- PR에는 변경한 도메인 문서, 사용자 영향, 연동 권한·개인정보 영향을 적는다.
