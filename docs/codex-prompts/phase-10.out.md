Phase 10 완료했습니다.

변경 파일:

- [src/App.tsx](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/App.tsx)
- [src/styles/app.css](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/styles/app.css)
- [src/styles/tokens.css](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/styles/tokens.css)

삭제:

- `src/features/today/*`
- 구형 calendar/settings 화면 컴포넌트

검증:

- `cmd /c npx tsc -b` 통과
- `git diff --check` 통과

아직 안 한 것:

- 일기 상세 화면은 Phase 11 placeholder 상태
- 저장 toast와 실제 `onSaved` 연결은 Phase 11에서 연결 필요
- 설정의 아이 정보 편집 및 글씨체 `fontAssetId` 저장은 데이터 API 확장이 필요

리뷰어가 확인할 것: 홈 카드/검색/최근 기록, 전체 보기 60개 단위 목록, 달력 날짜 선택 및 페이지 색 dot, 설정 색상 sheet·테마 전환, dark mode, 모바일 하단 nav와 Korean wrapping.