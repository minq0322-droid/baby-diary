Phase 16 수정 사항을 반영했습니다.

- 그림 영역을 전체 너비로 확장하고 높이를 `min(80vw, 60svh)`로 설정했습니다. 얼굴의 aria-label에서는 비어 있는 나이 라벨을 제외합니다.
- 책 내보내기는 글씨 크기를 기본값의 80%까지 줄인 뒤, 남은 글을 같은 페이지 색상의 이어쓰기 페이지로 분할합니다. PDF와 ZIP 모두 이어쓰기 페이지를 포함합니다.
- 아티팩트 문서에 동적 import 인라인 설정과 fragment 제목 규칙을 적었습니다. 기능 선언은 기존 `db`, `user`, `downloads`, `assets: { upload: "interact" }` 그대로입니다.

**확인 및 미완료**

- `npx tsc -b` 통과. 내보내기 분할 테스트를 추가했지만, Vitest 실행과 아티팩트 빌드는 esbuild의 `Access is denied` 오류로 시작하지 못했습니다.
- 기존 `dist-artifact/page.html`은 **3,086,372바이트(2.94 MiB)**로 6 MB 미만입니다. 파일 시작은 `<title>육아 기록</title>` 다음 Gaegu Google Fonts 링크이고, Pretendard 폰트(원본 2,057,688바이트)가 가장 큰 구성 요소입니다. 빌드가 막혀 이 파일은 이번 변경분을 반영한 새 출력인지 확인할 수 없습니다.
- 브라우저를 사용할 수 없어 375px 화면에서 `getBoundingClientRect()` 실측은 하지 못했습니다. CSS 치수는 375px 너비를 기준으로 맞췄습니다.

변경 파일: [docs/artifact-build.md](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/docs/artifact-build.md), [HomeFace.tsx](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/home/HomeFace.tsx), [page.css](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/styles/page.css), [bookExport.ts](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/settings/bookExport.ts), [bookLayout.ts](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/settings/bookLayout.ts), [bookLayout.test.ts](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/settings/bookLayout.test.ts).

리뷰 시 확인할 항목: 브라우저에서 375px 그림 영역의 실제 너비, 분할 테스트, 새 아티팩트 빌드 결과의 크기와 외부 호스트 요청입니다.