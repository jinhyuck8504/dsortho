# 대치삼성정형외과 웹사이트 배포 가이드

## 🚀 배포 전 체크리스트

### 1. Supabase 설정
```bash
# 1. Supabase 프로젝트 생성
# - https://supabase.com 접속
# - 새 프로젝트 생성
# - 프로젝트 URL과 anon key 복사

# 2. 데이터베이스 스키마 실행
# - Supabase Dashboard → SQL Editor
# - schema.sql 파일 내용 실행

# 3. Storage 버킷 생성 (이미지 저장용)
# - Storage → New Bucket
# - 이름: "treatment-images"
# - Public: true
```

### 2. GitHub 레포지토리 설정
```bash
# 1. 새 레포지토리 생성
git init
git add .
git commit -m "Initial commit: 대치삼성정형외과 웹사이트"
git branch -M main
git remote add origin https://github.com/USERNAME/daechisamsungortho.git
git push -u origin main

# 2. 환경변수 설정 (GitHub Secrets)
# Settings → Secrets and variables → Actions
# - SUPABASE_URL: 여기에 Supabase URL
# - SUPABASE_ANON_KEY: 여기에 Supabase anon key
```

### 3. Netlify 배포
```bash
# 1. Netlify 계정 생성 및 연결
# - https://netlify.com 접속
# - GitHub 계정으로 로그인
# - New site from Git

# 2. 빌드 설정
# Build command: npm run build (또는 비워둠)
# Publish directory: . (현재 디렉토리)

# 3. 환경변수 설정
# Site settings → Environment variables
# - SUPABASE_URL: 여기에 Supabase URL
# - SUPABASE_ANON_KEY: 여기에 Supabase anon key
```

## 📁 파일 구조
```
daechisamsungortho/
├── index.html              # 메인 페이지
├── auth.js                 # 인증 시스템
├── schema.sql              # 데이터베이스 스키마
├── admin.html              # 관리자 페이지 (별도 생성 필요)
├── sitemap.xml             # SEO용 사이트맵
├── robots.txt              # SEO용 로봇 파일
├── manifest.json           # PWA 매니페스트
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── favicon.ico
│   │   └── og-image.jpg
│   ├── css/
│   │   └── styles.css      # 별도 CSS 파일 (선택사항)
│   └── js/
│       ├── main.js         # 메인 JavaScript
│       └── analytics.js    # 분석 코드
└── README.md
```

## 🔧 설정 가이드

### 1. Supabase 인증 설정
```javascript
// auth.js 파일에서 다음 값들을 실제 값으로 변경
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
```

### 2. Google Analytics 설정
```html
<!-- index.html에서 GA_MEASUREMENT_ID를 실제 값으로 변경 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### 3. Naver Analytics 설정
```html
<!-- index.html에서 NAVER_ANALYTICS_ID를 실제 값으로 변경 -->
<script type="text/javascript">
    wcs_add["wa"] = "NAVER_ANALYTICS_ID";
</script>
```

### 4. 첫 번째 관리자 계정 생성
```sql
-- 1. 먼저 웹사이트에서 회원가입
-- 2. Supabase SQL Editor에서 실행
INSERT INTO admin_users (user_id, role) 
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'admin@daechisamsungortho.com'; -- 실제 이메일로 변경
```

## 🎯 SEO 최적화 체크리스트

### 1. 필수 파일 생성

#### robots.txt
```
User-agent: *
Allow: /

Sitemap: https://daechisamsungortho.netlify.app/sitemap.xml
```

#### sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://daechisamsungortho.netlify.app/</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### 2. Google Search Console 등록
1. https://search.google.com/search-console 접속
2. 속성 추가 → URL 접두어 방식
3. 도메인 확인 → HTML 태그 방식 사용
4. sitemap.xml 제출

### 3. Naver 웹마스터도구 등록
1. https://searchadvisor.naver.com 접속
2. 웹사이트 등록
3. 사이트 소유확인
4. sitemap.xml 제출

## 💾 백업 및 보안

### 1. 데이터베이스 백업
```bash
# Supabase에서 자동 백업 설정
# Dashboard → Settings → Database → Backups
```

### 2. 보안 설정
```javascript
// RLS (Row Level Security) 정책 확인
// 민감한 정보는 환경변수로 관리
// API 키는 절대 코드에 직접 작성하지 않기
```

### 3. 모니터링 설정
```javascript
// 에러 추적을 위한 Sentry 설정 (선택사항)
// 성능 모니터링을 위한 분석 도구 설정
```

## 🔄 업데이트 프로세스

### 1. 코드 업데이트
```bash
git add .
git commit -m "업데이트 내용"
git push origin main
# Netlify에서 자동 배포됨
```

### 2. 데이터베이스 업데이트
```sql
-- 새로운 기능 추가시 migration 파일 생성
-- Supabase SQL Editor에서 실행
```

### 3. 캐시 무효화
```bash
# Netlify에서 Deploy 탭 → Clear cache and deploy
```

## 📞 기술 지원

### 문제 해결
1. **빌드 에러**: GitHub Actions 로그 확인
2. **배포 에러**: Netlify 로그 확인  
3. **데이터베이스 에러**: Supabase 로그 확인

### 연락처
- 개발 관련 문의: GitHub Issues
- 사이트 관련 문의: admin@daechisamsungortho.com

## 🎉 배포 완료 후 할 일

1. ✅ 모든 링크가 정상 작동하는지 확인
2. ✅ 회원가입/로그인 기능 테스트
3. ✅ 치료 사례 업로드 기능 테스트
4. ✅ 모바일 반응형 확인
5. ✅ 페이지 로딩 속도 확인
6. ✅ SEO 점수 확인 (PageSpeed Insights)
7. ✅ Google Analytics 연동 확인
8. ✅ 첫 번째 관리자 계정 생성
9. ✅ 실제 치료 사례 몇 개 업로드
10. ✅ 모든 연락처 정보 최종 확인