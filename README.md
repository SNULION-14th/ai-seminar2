# PureChat

> 광고와 읽음 압박 없이, 대화에만 집중하는 미니멀 메신저 데모

PureChat은 React와 TypeScript로 만든 모바일 우선 메신저 서비스입니다. 복잡한 피드 대신 필요한 대화 흐름만 남기고, 포커스 모드와 자동 정리 대화로 부담 없는 소통 경험을 제안합니다.

## 주요 기능

- 대화 목록 검색과 최근 메시지·읽지 않은 메시지 표시
- 1:1 대화방 열기 및 즉시 메시지 전송
- 메시지 이모지 리액션
- 포커스 모드와 조용히 보내기
- 클린챗 메시지 자동 만료
- 초대 링크 복사와 친구 선택으로 새 대화 시작
- 라이트·다크 테마, 브라우저 로컬 저장, 데모 데이터 초기화

## 실행 방법

```bash
npm ci
npm run dev
```

프로덕션 빌드는 아래 명령으로 확인합니다.

```bash
npm run build
npm run lint
```

## 구조

```
src/
├── components/common/        # Avatar, Toast 등 공통 UI
├── features/
│   ├── chat/                 # 메시지 화면과 상태 훅
│   ├── chat-list/            # 대화 목록과 검색
│   ├── contacts/             # 초대 및 새 대화 시작
│   └── settings/             # 개인화 설정
├── services/                 # localStorage 어댑터와 데모 데이터
├── styles/                   # 디자인 토큰과 반응형 스타일
└── types/                    # 공통 도메인 타입
```

## MCP 활용 내역

- **GitHub MCP**: 과제 저장소와 브랜치 상태를 확인하고, 변경사항을 PR로 제출하는 흐름에 사용했습니다.
- **Playwright MCP**: Chrome DevTools MCP를 사용할 수 없는 환경의 대체 도구로, 완성된 메신저의 브라우저 상호작용과 반응형 UI를 점검하는 데 사용했습니다.
