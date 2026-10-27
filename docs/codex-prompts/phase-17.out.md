Phase 17 구현을 완료했습니다. 원격 Supabase는 변경하지 않았습니다.

검증: TypeScript, 테스트 87개, 백업 테스트 2개, PWA·Artifact 빌드 모두 통과했습니다. 빌드·테스트에는 `--configLoader runner`를 사용했습니다.

검토자가 실행할 적용 명령입니다.

```powershell
npx.cmd supabase db push --linked
npx.cmd supabase config push --project-ref ymtflfwojyqxgdezhtuz
node scripts/setup-family.mjs
```

이후 생성된 `supabase/seed/family_seed.sql`을 Supabase SQL Editor에서 한 번 실행하세요. 최초 초대 링크는 `family_links.local`에 생성됩니다. 상세 설정은 [SETUP.md](<C:/Users/ajou/OneDrive/0. 개인정보/00. 주현♥/육아일기 앱/docs/SETUP.md>)에 정리했습니다. [공식 CLI 참고](https://supabase.com/docs/reference/cli/supabase-config-push).

- **변경 파일:** 단일 마이그레이션·config·seed 템플릿, SupabaseStore·초대 인증·가족 설정·글씨체 처리·스타일, 백업·초기 설정 스크립트, 배포·백업 워크플로, 관련 테스트와 문서. 기존 마이그레이션 4개는 제거했습니다.
- **미실행:** 원격 마이그레이션·설정·seed 적용, 실제 배포와 서버 RLS 검증. 자동 백업은 공개 저장소에 암호화해서 저장하며, 사진·글씨체는 경로 참조만 보관합니다.
- **검토 사항:** GitHub 변수·시크릿 등록 후 두 기기의 자동 작성자 지정, 링크 재발급에 따른 차단, reader 쓰기 거절, 오프라인 편집 재전송을 확인해 주세요.