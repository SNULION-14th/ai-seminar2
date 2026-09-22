# 아키텍처 규칙

## 모듈 경계

```text
UI → Application Service → Domain → Integration Adapter
                                      ├─ GoogleCalendarAdapter
                                      └─ GitHubAdapter
```

- UI는 외부 API를 직접 호출하지 않는다.
- Application Service는 권한 확인, 조율 상태 전이, 후보 계산을 담당한다.
- Domain은 조율·참석자 응답·후보·확정 상태를 표현한다.
- Integration Adapter만 MCP 또는 외부 API의 세부 형식을 안다.

## 최소 데이터 모델

| 모델 | 핵심 속성 |
| --- | --- |
| Coordination | id, title, owner_id, duration, date_range, status |
| Participant | coordination_id, user_id, response_status |
| TimeOption | coordination_id, start_at, end_at, score |
| LinkedWork | coordination_id, provider, repository, issue_or_pr_url |

## 상태 전이

```text
draft → collecting_responses → ready_to_confirm → confirmed → cancelled
```

- `confirmed` 전이는 주최자만 실행한다.
- 이벤트 생성 실패 시 `ready_to_confirm`을 유지하고 재시도를 허용한다.
