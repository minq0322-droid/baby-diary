# Supabase · Phase 17

프로젝트: ymtflfwojyqxgdezhtuz / Seoul / Free. 이 단계에서는 원격 명령을 실행하지 않았습니다. 아래 적용은 검토자가 수행합니다. 기존 DB를 변환하는 마이그레이션이 아니라 빈 프로젝트용입니다.

## 1. 스키마와 인증 설정 적용

CLI가 이미 연결되어 있으므로 저장소 루트에서 다음 명령을 순서대로 실행합니다. PowerShell 실행 정책 때문에 npm/npx는 .cmd를 사용합니다.

~~~powershell
npx.cmd supabase db push --linked
npx.cmd supabase config push --project-ref ymtflfwojyqxgdezhtuz
~~~

첫 명령은 20261027000000_family.sql 하나만 적용합니다. 자동 seed는 꺼져 있습니다. 두 번째 명령은 익명 로그인, Site URL과 localhost 리다이렉트를 적용합니다. 이메일 가입은 비활성화되어 있고 SMTP나 유료 서비스 설정이 필요하지 않습니다. [공식 CLI 설정 적용 문서](https://supabase.com/docs/reference/cli/supabase-config-push).

## 2. 가족과 최초 초대 키 만들기 (로컬)

~~~powershell
node scripts/setup-family.mjs
~~~

이 명령은 네트워크를 사용하지 않고 UUID와 32바이트 무작위 키 두 개를 생성합니다. 출력 파일은 git에서 제외됩니다.

- supabase/seed/family_seed.sql: 가족 ID와 토큰 해시가 채워진 SQL.
- supabase/seed/family_links.local: 아빠(owner)·엄마(writer)의 실제 링크. 가족 외에는 공유하지 않습니다.

Supabase Dashboard의 해당 프로젝트 SQL Editor에서 **family_seed.sql 전체를 한 번 실행**합니다. 템플릿 파일 자체를 실행하지 마세요. 아이 둘, 기본 배지, dad/mom 프로필도 함께 생성됩니다. SQL을 파일로 적용하려면 Dashboard Connect에서 복사한 세션 풀러 연결 문자열을 DATABASE_URL 환경 변수로 지정한 후 다음을 실행할 수도 있습니다 (PostgreSQL psql 필요).

~~~powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed/family_seed.sql
~~~

아빠 링크를 먼저 연 기기가 가족 관리자입니다. 설정 → 가족에서 엄마, 아빠 추가 기기, 백업 읽기 전용 링크를 생성할 수 있습니다. 추가 기기의 아빠 링크는 writer 권한입니다. 처음 만든 owner 링크는 안전하게 보관하세요. 링크 재발급은 대상의 이전 링크를 폐기하고 다른 기기의 회원 권한을 삭제합니다. 요청한 현재 기기는 유지합니다. 활성 기기의 권한은 1분마다 작은 회원 조회로 재확인하며, 삭제 직후부터 DB/Storage RLS는 접근을 막습니다. 이미 내려받은 자료나 발급된 서명 URL은 기기에서 회수할 수 없고 서명 URL은 최대 1시간 뒤 만료됩니다.

## 3. GitHub Pages

Repository Settings → Pages → Source를 **GitHub Actions**로 선택합니다. Actions Repository variables:

- VITE_SUPABASE_URL = https://ymtflfwojyqxgdezhtuz.supabase.co
- VITE_SUPABASE_ANON_KEY = 프로젝트의 브라우저용 anon key (service_role 키 금지)

main에 push하면 deploy.yml이 정상 PWA 모드를 빌드하고 배포합니다. 배포 주소는 https://minq0322-droid.github.io/baby-diary/ 입니다. GITHUB_PAGES=true일 때 Vite base, manifest start_url/scope, 아이콘과 서비스 워커가 모두 /baby-diary/를 사용합니다. Artifact 모드는 독립된 기존 빌드를 사용합니다.

로컬은 .env.example을 .env로 복사하고 위 두 VITE 값을 넣은 뒤 npm.cmd run dev를 실행합니다. 값이 없으면 기존 LocalStore 모드입니다. 익명 사용자는 계정·이메일·비밀번호를 입력하지 않습니다. [익명 로그인 공식 문서](https://supabase.com/docs/guides/auth/auth-anonymous).

## 4. 검토

~~~powershell
npx.cmd tsc -b
npm.cmd test -- --configLoader runner
npm.cmd run test:backup
$env:GITHUB_PAGES = 'true'
npx.cmd vite build --configLoader runner
Remove-Item Env:GITHUB_PAGES
npm.cmd run build:artifact -- --configLoader runner
~~~

이 환경의 기본 Vite 설정 번들러는 상위 폴더 접근 제한으로 실패하므로 runner를 사용했습니다. 별도 테스트/빌드 도구 의존성은 추가하지 않았습니다.

실제 적용 후 서로 다른 두 브라우저에서 최초 익명 접속 → 초대 수락 → 작성자 자동 지정 → 각각의 페이지 저장 → 실시간 반영을 확인하세요. 초대 없는 기기, 잘못된/폐기된 링크, 다른 가족 prefix의 DB/Storage 접근 거절, reader의 모든 쓰기 거절, 20회 실패 후 join 제한도 확인하세요. 재발급한 링크로 새 기기가 들어오고 예전 기기의 서버 접근이 막히는지, 오프라인 편집·새로고침 후 재접속해 대기열이 저장되는지도 확인합니다.

사진·프로필 사진·글씨체는 비공개 photos 버킷에 가족 ID 경로로 저장합니다. DB에는 안정된 경로 참조를 남기고 서명 URL은 50분 캐시 후 재요청 시 갱신합니다. 파일당 5 MiB, JPEG/PNG/WebP/WOFF2/TTF만 허용합니다. 무료 Storage 1 GB를 기준으로 설정에서 사용량과 80% 경고를 표시합니다. 유료 이미지 변환, 서버/Edge Functions, 유료 예약 작업은 사용하지 않습니다. 정기 확인에서는 회원 권한만 읽고 전체 기록을 다시 내려받지 않습니다.

자동 백업 설정과 복구는 [BACKUP.md](BACKUP.md)를 참고하세요.
