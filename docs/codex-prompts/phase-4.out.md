Phase 4 구현을 완료했습니다.

변경 사항:

- 설정 화면: 아이/가족/태그/백업/화면 테마 관리
- 아이 정보 편집 및 출산 전·출생 상태 전환
- 태그 추가, 이름 변경, 숨김, 순서 변경
- JSON·Markdown 백업 다운로드 및 ID 기준 복원
- 자동 백업 상태 URL 표시
- 다크 모드 시스템/라이트/다크 설정
- Comment/Reaction 데이터 모델 및 LocalStore cascade 삭제·undo 복원
- JSON/Markdown export 포맷과 테스트 추가
- 한국어 시드 데이터 및 날짜/나이 표시 정리

검증:

- `npx.cmd tsc -b` 통과
- Vitest는 샌드박스의 esbuild `Access is denied`로 실행되지 않음

파일 변경:

- `src/features/settings/SettingsPage.tsx`
- `src/lib/exportFormat.ts`
- `src/lib/exportFormat.test.ts`
- `src/data/types.ts`
- `src/data/DataStore.ts`
- `src/data/localStore.ts`
- `src/features/today/TodayPage.tsx`
- `src/features/today/TagChips.tsx`
- `src/data/seed.ts`
- `src/lib/date.ts`
- `src/App.tsx`
- `src/main.tsx`
- `src/styles/app.css`

미완료: SupabaseStore는 기존 Phase 5 범위로 아직 없습니다. 리뷰 시 설정 화면, 백업 복원, 태그 숨김/순서 변경, 댓글·하트 cascade undo를 확인해 주세요.