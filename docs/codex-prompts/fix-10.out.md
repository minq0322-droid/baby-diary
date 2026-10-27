Fix 10 범위의 수정을 완료했습니다. `npx.cmd tsc -b`와 `git diff --check`가 통과했습니다.

- 변경 파일: 일기 화면·도구·사진·글쓰기, `ParentFace`, `drawingView` 및 테스트, `ArchiveScreen`, `Icon`, `StrokePreview`, `types.ts`, `josa`·`stroke` 및 테스트, `page.css`·`app.css`. 미사용 `KidCard.tsx`와 CSS는 삭제했습니다.
- 미완료 검증: Vitest와 Vite 빌드는 샌드박스의 esbuild 접근 거부로 실행하지 못했습니다. 실제 화면·터치 검증도 남았습니다.
- 리뷰어 확인: 375px·430px의 밝은/어두운 화면, 완료 전후 5:4 유지, 핀치 확대·이동과 획 취소, 전체 지우기 복원, 목록 보기 저장·검색·필터·더 불러오기를 확인해 주세요.