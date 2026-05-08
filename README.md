# 구미시 공유PM 신고관리시스템 프로토타입

구미시 공유 개인형 이동장치(PM) 무단방치 신고·관리 시스템의 프로토타입입니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **DB**: NeonDB (Serverless PostgreSQL) + Prisma ORM
- **인증**: JWT (httpOnly Cookie)
- **파일 업로드**: Vercel Blob
- **지도**: Kakao Maps API
- **호스팅**: Vercel (GitHub 연동 자동 배포)

## 역할별 기능

| 역할 | 기능 |
|------|------|
| **시민** | `/report` — QR 스캔 · GPS · 사진 · 위반유형 선택 → 신고 접수 |
| **시민** | `/my-reports` — 연락처 입력 → 나의 신고 현황 조회 |
| **공무원(ADMIN)** | 지도 모니터링 (빨강/초록 마커), 신고 목록, 직권처리 |
| **공무원(ADMIN)** | 업체·계정·이동장치 관리, 통계 대시보드 |
| **PM업체(COMPANY)** | 자사 신고 지도 확인, 조치결과 등록 |

## 로컬 실행 방법

### 1. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 아래 값을 입력하세요:

```bash
# NeonDB (https://neon.tech 에서 프로젝트 생성 후 발급)
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# JWT 시크릿 (32자 이상 랜덤 문자열)
JWT_SECRET="your-random-secret-here"

# Vercel Blob (Vercel 프로젝트 연결 후 발급)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Kakao Maps (https://developers.kakao.com 에서 JavaScript 앱키 발급)
NEXT_PUBLIC_KAKAO_APP_KEY="your-kakao-key"
```

### 2. 패키지 설치

```bash
npm install
```

### 3. DB 마이그레이션 + 시드 데이터

```bash
npm run db:migrate   # 테이블 생성
npm run db:seed      # 데모 데이터 삽입
```

### 4. 개발 서버 실행

```bash
npm run dev
```

→ `http://localhost:3000` 접속

## 데모 계정

| 계정 | 비밀번호 | 역할 |
|------|----------|------|
| `admin` | `admin1234!` | 공무원(관리자) |
| `kickgoing` | `company1234!` | 킥고잉 업체 |
| `lime` | `company1234!` | 라임 업체 |
| `deer` | `company1234!` | 디어 업체 |

## Vercel 배포

1. GitHub에 이 저장소를 push
2. [Vercel](https://vercel.com)에서 "Import Project" → GitHub 저장소 선택
3. Vercel Dashboard → Settings → Environment Variables에 `.env` 내용 추가
4. NeonDB Vercel Integration으로 `DATABASE_URL`, `DIRECT_DATABASE_URL` 자동 설정 가능
5. Deploy 후 `https://your-project.vercel.app`에서 확인

## 주요 URL

| URL | 설명 |
|-----|------|
| `/` | 홈 (로그인 여부에 따라 리디렉션) |
| `/report` | 시민 신고 접수 (모바일) |
| `/my-reports` | 나의 신고 조회 |
| `/login` | 관리자/업체 로그인 |
| `/admin/dashboard` | 관리자 지도 모니터링 |
| `/admin/stats` | 통계 대시보드 |
| `/company/dashboard` | PM업체 신고 지도 |
| `/company/reports` | 조치결과 등록 |

## 프로토타입 한계 (실제 납품 시 추가)

- SMS 실제 발송 (구미시 통합메시지시스템 연동)
- 휴대폰 본인인증 (PASS/KCB 연동)
- DB 암호화 솔루션 (Hancom xDB v5.0)
- 개발 프레임워크 전환 (eGovframework Spring)
- 클라우드 이전 (KT G클라우드존 MariaDB)
- 웹접근성 품질마크 인증
