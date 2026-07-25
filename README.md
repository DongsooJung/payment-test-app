# Payment Test App

Next.js App Router로 만든 결제 흐름 테스트 앱입니다.

- 토스페이먼츠: 테스트 키가 있으면 실제 테스트 결제창, 없으면 데모 모드
- 네이버페이·카카오페이: 상점 계약 전 데모 모드
- Supabase: 설정하면 결제 상태와 최근 기록 저장, 없으면 저장 없이 UI 테스트

## 실행

```bash
npm install
copy .env.example .env.local
npm run dev
```

`http://localhost:3000`에서 결제 화면을, `/dashboard`에서 결제 기록을 확인합니다.

## 환경 변수

| 변수 | 용도 |
| --- | --- |
| `SUPABASE_URL` | 서버 Route Handler 전용 Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 Route Handler 전용 Supabase 키 |
| `PAYMENT_ADMIN_TOKEN` | 결제 대시보드 API 접근용 임의의 긴 토큰 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 테스트 클라이언트 키 |
| `TOSS_SECRET_KEY` | 토스페이먼츠 테스트 시크릿 키 |

실제 키는 저장소에 커밋하지 마세요. Supabase 서비스 역할 키는 절대로
`NEXT_PUBLIC_` 접두사를 붙이거나 브라우저 코드에서 사용하면 안 됩니다.
실제 토스페이먼츠 결제는 Supabase에 서버 주문이 먼저 저장된 경우에만
승인되며, 승인 요청 금액을 서버 주문 금액과 다시 대조합니다.

## Supabase

Supabase SQL Editor에서 [`supabase-schema.sql`](./supabase-schema.sql)을 실행합니다.
데이터 접근은 서버 Route Handler를 통해서만 수행하며, 서비스 역할 키가 RLS를
우회합니다. `anon`과 `authenticated` 역할에는 테이블 권한을 부여하지 않습니다.

`/dashboard`에서는 `PAYMENT_ADMIN_TOKEN` 값을 입력해야 결제 내역을 조회할 수
있습니다. 토큰은 브라우저의 세션 저장소에만 보관됩니다.

## 확인

```bash
npm run lint
npm run typecheck
npm run build
```
