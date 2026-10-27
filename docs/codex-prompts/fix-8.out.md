fix-7 수정 완료.

변경 파일:

- `src/styles/page.css`
- `src/features/page/DrawingArea.tsx`
- `src/features/settings/ChildEditSheet.tsx`
- `src/features/home/HomeFace.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/lib/date.ts`
- `src/lib/date.test.ts`
- `src/data/types.ts`
- `src/data/migrate.ts`
- `src/data/localStore.ts`
- `src/data/artifactStore.ts`
- `src/vite-env.d.ts`

`npx tsc -b` 통과했습니다. Vitest는 sandbox의 esbuild `Access is denied` 오류로 실행되지 않았습니다.

검토할 사항: 375×812 drawing mode에서 canvas와 tray가 겹치지 않는지, born/expecting 상태별 날짜 입력과 홈 롱프레스 문구를 확인해 주세요.