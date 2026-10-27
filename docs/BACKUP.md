# 백업과 복원

## GitHub 자동 백업

매일 04:00 KST 또는 Actions → Backup → Run workflow에서 실행됩니다. 다음 Repository secrets 세 개를 설정합니다.

- SUPABASE_URL
- SUPABASE_ANON_KEY (브라우저용 키)
- BACKUP_JOIN_TOKEN (설정 → 가족 → 백업 읽기 전용 링크 만들기에서 #join= 뒤의 토큰만 복사)

서비스 키, 이메일, 비밀번호는 사용하지 않습니다. 매 실행마다 익명 로그인 → reader 초대 수락 → 가족 테이블 읽기 → 날짜별 JSON/Markdown 생성으로 진행합니다. reader가 아닌 토큰이면 백업을 중단합니다. prune_reader_members RPC는 같은 가족의 2일 이상 된 reader 회원과 해당 익명 Auth 사용자를 정리합니다. 현재 실행 기기는 남깁니다.

공개 저장소이므로 평문 기록을 브랜치에 올리지 않습니다. Node 기본 암호화 API의 HKDF-SHA256 및 AES-256-GCM으로 ZIP을 암호화하고 backups 브랜치의 encrypted/YYYY-MM-DD.enc만 커밋합니다. 파일마다 무작위 salt와 nonce를 사용합니다. 복호화에는 당시 BACKUP_JOIN_TOKEN이 필요하므로 **토큰 교체 전 기존 토큰을 안전한 장소에 보관하세요**. 토큰은 로그나 커밋에 포함되지 않습니다. 이전에 평문 백업을 공개한 이력이 있으면 이 변경으로 그 이력까지 지워지지는 않습니다.

매일 DB 조회를 발생시키지만, Free 프로젝트의 자동 정지 여부는 플랫폼 정책에 따르므로 실패 알림을 확인하세요. GitHub는 공개 저장소의 예약 워크플로를 장기간 저장소 활동이 없을 때 중단할 수 있습니다. [Supabase 정지 정책](https://supabase.com/docs/guides/platform/free-project-pausing).

## 복호화

원하는 날짜의 .enc 파일을 내려받고 해당 날짜의 BACKUP_JOIN_TOKEN을 환경 변수에 설정한 후 저장소 루트에서 실행합니다.

~~~powershell
node scripts/backup/encrypt.mjs decrypt ./2026-10-27.enc ./family-backup.zip
~~~

ZIP에 json/YYYY-MM-DD.json, diary/YYYY/MM/DD/아이-작성자.json, 일별·월별 Markdown, backup.json, status.json이 있습니다. 날짜별 아카이브는 기존 toDatedArchive를 사용하며 엄마·아빠 페이지를 별도로 보존합니다. 앱의 설정 → 백업에서 복원에서 backup.json을 선택합니다. 기존 ID는 건너뛰고, 다른 가족의 댓글·하트가 포함된 새 기록은 현재 작성자의 복원 권한 제한으로 거절될 수 있습니다.

자동 백업은 DB 기록과 Storage 경로 참조를 보관하며 **사진·글씨체 원본 바이트는 내려받지 않습니다**. 사진 원본까지 보관하려면 앱의 설정 → 백업 내려받기를 함께 사용하고, 글씨체 원본은 별도로 보관하세요. 자동 백업으로 비공개 자산 URL을 공개하지 않습니다.

## OneDrive (선택)

기존 Windows 예약 스크립트를 계속 쓸 수 있습니다. %LOCALAPPDATA%/BabyLog/backup.env에 다음 세 값을 넣습니다. 이 파일은 저장소 밖 개인 기기에만 둡니다.

~~~dotenv
SUPABASE_URL=https://ymtflfwojyqxgdezhtuz.supabase.co
SUPABASE_ANON_KEY=anon_key
BACKUP_JOIN_TOKEN=reader_token
~~~

scripts/backup/register-task.ps1로 등록하고 unregister-task.ps1로 제거합니다. 로컬 OneDrive 백업은 육아기록 백업 폴더에 평문 아카이브를 저장합니다. 공유 폴더로 사용하지 마세요. GitHub에서 실행하는 암호화와는 별개입니다.
