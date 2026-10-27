요청한 독립형 HTML 3개를 만들었습니다. `src/`는 변경하지 않았습니다.

- [A — 큐빅 아트](docs/design/home-a-cubic.html)
- [B — 파스텔 대시보드](docs/design/home-b-pastel.html)
- [C — 떠다니는 얼굴](docs/design/home-c-floating.html)

사진 선택·원형 크롭·지난 사진 재사용/삭제, 테마 전환, 페이지 전환을 구현했습니다. `tsc -b`, JavaScript 문법·크롭 좌표 검사를 통과했습니다.

리뷰 시 각 파일에서 사진 업로드·핀치 확대, 회전·스와이프, 다크 모드를 확인해 주세요.

하지 못한 것: 브라우저 연결이 없어 실제 화면·터치 동작과 기기 성능은 검증하지 못했습니다.