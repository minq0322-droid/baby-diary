Artifact 전용 변경을 적용했습니다.

- [vite.config.ts](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/vite.config.ts)는 Pretendard 정적 subset 세 종류를 인라인하고, 요청된 weight 범위를 연결합니다.
- [loadExportLibs.ts](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/lib/loadExportLibs.ts)는 artifact에서 JSZip 3.10.1과 jsPDF 2.5.1을 첫 사용 시 불러오고, 일반 빌드에서는 기존 동적 import를 사용합니다. 불러오는 동안 상태 메시지를 표시하고, 실패 시 재시도 가능한 명확한 오류를 전달합니다.
- [bookExport.ts](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/settings/bookExport.ts), [BookSection.tsx](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/settings/BookSection.tsx), [BackupSection.tsx](C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/settings/BackupSection.tsx)는 새 로더를 사용합니다.

`npx tsc -b`는 통과했습니다. Artifact 빌드는 esbuild가 sandbox에서 상위 디렉터리를 읽지 못해 `Access is denied`로 실패했습니다. 따라서 **새 `dist-artifact/page.html` 크기와 목표 1.6 MB 달성 여부는 확인하지 못했습니다.** 이전 산출물은 3,985,679바이트로, 새 빌드 결과로 볼 수 없습니다. 새 폰트 파일 원본 합계는 805,632바이트이며, base64 인라인 시 약 1.07 MB입니다. 전체 크기와 JavaScript 등 나머지 큰 부분은 리뷰어가 빌드 후 확인해야 합니다.

**변경 파일:** `vite.config.ts`, `src/lib/loadExportLibs.ts`, `src/features/settings/bookExport.ts`, `src/features/settings/BookSection.tsx`, `src/features/settings/BackupSection.tsx`.

**미완료:** artifact 산출물 크기 측정과 크기별 구성 확인.

**리뷰어 확인:** `npm run build:artifact` 실행 후 `dist-artifact/page.html`이 1.6 MB 미만인지, jsPDF/JSZip이 내장되지 않고 첫 내보내기 때 cdnjs에서 로드되는지, PDF/ZIP 내보내기와 백업 ZIP 가져오기가 동작하는지 확인해 주세요.