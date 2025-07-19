-- Supabase 데이터베이스 스키마
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 치료 사례 테이블
CREATE TABLE IF NOT EXISTS treatment_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    before_image TEXT NOT NULL, -- 치료 전 이미지 URL
    after_image TEXT NOT NULL,  -- 치료 후 이미지 URL
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 프로필 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 치료 사례 조회 로그 (분석용)
CREATE TABLE IF NOT EXISTS case_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES treatment_cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- 4. 관리자 권한 테이블
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role VARCHAR(50) DEFAULT 'admin',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 사이트 설정 테이블 (카운터, 통계 등)
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 문의 사항 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, answered, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    answered_by UUID REFERENCES auth.users(id)
);

-- RLS (Row Level Security) 정책 설정

-- 치료 사례: 인증된 사용자만 조회 가능
ALTER TABLE treatment_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "인증된 사용자만 치료 사례 조회 가능" ON treatment_cases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 치료 사례 추가/수정/삭제 가능" ON treatment_cases
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE user_id = auth.uid()
        )
    );

-- 사용자 프로필: 본인 것만 조회/수정 가능
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필만 조회 가능" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "본인 프로필만 수정 가능" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "프로필 생성 가능" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 조회 로그: 본인 것만 조회 가능
ALTER TABLE case_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 조회 로그만 확인 가능" ON case_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "조회 로그 생성 가능" ON case_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자 권한: 관리자만 조회 가능
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 권한 목록 조회 가능" ON admin_users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE user_id = auth.uid()
        )
    );

-- 사이트 설정: 관리자만 수정 가능, 모든 사용자 조회 가능
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자 사이트 설정 조회 가능" ON site_settings
    FOR SELECT USING (true);

CREATE POLICY "관리자만 사이트 설정 수정 가능" ON site_settings
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE user_id = auth.uid()
        )
    );

-- 문의 사항: 본인 것만 조회, 관리자는 모든 것 조회 가능
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 문의만 조회 가능" ON inquiries
    FOR SELECT USING (
        auth.uid()::text = email OR 
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "문의 생성 가능" ON inquiries
    FOR INSERT WITH CHECK (true);

-- 초기 데이터 삽입

-- 사이트 설정 초기값
INSERT INTO site_settings (key, value, description) VALUES
('patient_counter', '49000', '비수술치료 성공 카운터'),
('site_title', '대치삼성정형외과', '사이트 제목'),
('contact_phone', '0507-1370-8067', '대표 전화번호'),
('naver_booking_url', 'https://booking.naver.com/booking/13/bizes/1292367', '네이버 예약 링크'),
('naver_talk_url', 'https://talk.naver.com/WA6CLMM', '네이버 톡톡 링크'),
('blog_url', 'https://blog.naver.com/dryhspopeye', '블로그 링크'),
('fee_guide_url', 'https://blog.naver.com/dryhspopeye/223694825836', '진료비 안내 링크')
ON CONFLICT (key) DO NOTHING;

-- 첫 번째 관리자 계정 (이메일을 실제 관리자 이메일로 변경하세요)
-- 이 계정은 수동으로 먼저 회원가입한 후 실행하세요
/*
INSERT INTO admin_users (user_id, role) 
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'admin@daechisamsungortho.com'
ON CONFLICT (user_id) DO NOTHING;
*/

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_treatment_cases_created_at ON treatment_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_views_case_id ON case_views(case_id);
CREATE INDEX IF NOT EXISTS idx_case_views_user_id ON case_views(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- 함수: 조회 로그 자동 생성
CREATE OR REPLACE FUNCTION log_case_view()
RETURNS TRIGGER AS $$
BEGIN
    -- 치료 사례 조회 시 자동으로 로그 생성
    INSERT INTO case_views (case_id, user_id, ip_address)
    VALUES (NEW.id, auth.uid(), inet_client_addr());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_treatment_cases_updated_at
    BEFORE UPDATE ON treatment_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();