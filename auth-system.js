// auth.js - Supabase 인증 시스템
import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (실제 배포 시 환경변수로 관리)
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// 인증 상태 관리
class AuthManager {
    constructor() {
        this.currentUser = null
        this.isAuthenticated = false
        this.initAuth()
    }

    // 인증 초기화
    async initAuth() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            this.currentUser = session.user
            this.isAuthenticated = true
            this.updateUIForAuthenticatedUser()
        }

        // 인증 상태 변경 감지
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user
                this.isAuthenticated = true
                this.updateUIForAuthenticatedUser()
            } else {
                this.currentUser = null
                this.isAuthenticated = false
                this.updateUIForUnauthenticatedUser()
            }
        })
    }

    // 회원가입
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) throw error

            return {
                success: true,
                message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.',
                data
            }
        } catch (error) {
            return {
                success: false,
                message: this.getErrorMessage(error),
                error
            }
        }
    }

    // 로그인
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            return {
                success: true,
                message: '로그인에 성공했습니다.',
                data
            }
        } catch (error) {
            return {
                success: false,
                message: this.getErrorMessage(error),
                error
            }
        }
    }

    // 로그아웃
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            return {
                success: true,
                message: '로그아웃되었습니다.'
            }
        } catch (error) {
            return {
                success: false,
                message: '로그아웃 중 오류가 발생했습니다.',
                error
            }
        }
    }

    // 비밀번호 재설정
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            })

            if (error) throw error

            return {
                success: true,
                message: '비밀번호 재설정 이메일이 전송되었습니다.'
            }
        } catch (error) {
            return {
                success: false,
                message: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
                error
            }
        }
    }

    // 에러 메시지 번역
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
            'User already registered': '이미 등록된 이메일입니다.',
            'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
            'Email not confirmed': '이메일 인증이 완료되지 않았습니다.',
            'Invalid email': '유효하지 않은 이메일 형식입니다.'
        }
        return errorMessages[error.message] || '알 수 없는 오류가 발생했습니다.'
    }

    // 인증된 사용자 UI 업데이트
    updateUIForAuthenticatedUser() {
        // 치료 사례 갤러리 표시
        this.showBeforeAfterGallery()
        
        // 로그인 폼 숨기고 로그아웃 버튼 표시
        const loginForm = document.querySelector('.login-required')
        if (loginForm) {
            loginForm.innerHTML = `
                <div style="text-align: center;">
                    <h3>환영합니다! ${this.currentUser.email}님</h3>
                    <p>치료 전후 사진을 자유롭게 확인하실 수 있습니다.</p>
                    <button onclick="authManager.signOut()" class="btn" style="background: #dc3545; color: white;">로그아웃</button>
                </div>
            `
        }
    }

    // 미인증 사용자 UI 업데이트
    updateUIForUnauthenticatedUser() {
        // 치료 사례 갤러리 숨기고 로그인 폼 표시
        this.hideBeforeAfterGallery()
        
        const loginForm = document.querySelector('.login-required')
        if (loginForm) {
            loginForm.innerHTML = `
                <h3>회원가입 후 확인 가능합니다</h3>
                <p>환자분들의 개인정보 보호를 위해 회원가입 후 열람 가능합니다.</p>
                <div class="login-form">
                    <input type="email" id="authEmail" class="form-input" placeholder="이메일 주소" required>
                    <input type="password" id="authPassword" class="form-input" placeholder="비밀번호 (최소 6자)" required>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="authManager.handleSignIn()" class="btn btn-primary" style="flex: 1;">로그인</button>
                        <button onclick="authManager.handleSignUp()" class="btn" style="background: #28a745; color: white; flex: 1;">회원가입</button>
                    </div>
                    <button onclick="authManager.handleResetPassword()" style="background: none; border: none; color: #666; text-decoration: underline; margin-top: 10px; cursor: pointer;">비밀번호를 잊으셨나요?</button>
                </div>
            `
        }
    }

    // 치료 사례 갤러리 표시
    showBeforeAfterGallery() {
        // 실제 치료 사례들을 데이터베이스에서 불러와 표시
        this.loadTreatmentCases()
    }

    // 치료 사례 갤러리 숨김
    hideBeforeAfterGallery() {
        const gallery = document.getElementById('beforeAfterGallery')
        if (gallery) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f5f5f5; border-radius: 15px;">
                    <h3>🔒 회원 전용 콘텐츠</h3>
                    <p>치료 전후 사진은 회원가입 후 확인하실 수 있습니다.</p>
                </div>
            `
        }
    }

    // 로그인 처리
    async handleSignIn() {
        const email = document.getElementById('authEmail').value
        const password = document.getElementById('authPassword').value

        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.')
            return
        }

        const result = await this.signIn(email, password)
        alert(result.message)
    }

    // 회원가입 처리
    async handleSignUp() {
        const email = document.getElementById('authEmail').value
        const password = document.getElementById('authPassword').value

        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.')
            return
        }

        if (password.length < 6) {
            alert('비밀번호는 최소 6자 이상이어야 합니다.')
            return
        }

        const result = await this.signUp(email, password)
        alert(result.message)
    }

    // 비밀번호 재설정 처리
    async handleResetPassword() {
        const email = document.getElementById('authEmail').value

        if (!email) {
            alert('이메일을 입력해주세요.')
            return
        }

        const result = await this.resetPassword(email)
        alert(result.message)
    }

    // 치료 사례 불러오기 (Supabase에서)
    async loadTreatmentCases() {
        try {
            const { data, error } = await supabase
                .from('treatment_cases')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            const gallery = document.getElementById('beforeAfterGallery')
            if (gallery && data.length > 0) {
                gallery.innerHTML = data.map(case_ => `
                    <div class="before-after-card" style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr;">
                            <div style="position: relative;">
                                <img src="${case_.before_image}" alt="치료 전" style="width: 100%; height: 200px; object-fit: cover;">
                                <div style="position: absolute; top: 10px; left: 10px; background: rgba(220,53,69,0.9); color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: 600;">BEFORE</div>
                            </div>
                            <div style="position: relative;">
                                <img src="${case_.after_image}" alt="치료 후" style="width: 100%; height: 200px; object-fit: cover;">
                                <div style="position: absolute; top: 10px; right: 10px; background: rgba(26,35,126,0.9); color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: 600;">AFTER</div>
                            </div>
                        </div>
                        <div style="padding: 20px;">
                            <h4 style="color: #1a237e; margin-bottom: 10px; font-size: 1.1rem;">${case_.title}</h4>
                            <p style="color: #666; font-size: 0.9rem; line-height: 1.4;">${case_.description}</p>
                        </div>
                    </div>
                `).join('')
            }
        } catch (error) {
            console.error('치료 사례 불러오기 실패:', error)
        }
    }

    // 치료 사례 저장 (관리자용)
    async saveTreatmentCase(beforeImage, afterImage, title, description) {
        if (!this.isAuthenticated) {
            alert('로그인이 필요합니다.')
            return
        }

        try {
            const { data, error } = await supabase
                .from('treatment_cases')
                .insert([
                    {
                        before_image: beforeImage,
                        after_image: afterImage,
                        title,
                        description,
                        created_by: this.currentUser.id
                    }
                ])

            if (error) throw error

            return { success: true, message: '치료 사례가 저장되었습니다.' }
        } catch (error) {
            console.error('치료 사례 저장 실패:', error)
            return { success: false, message: '저장 중 오류가 발생했습니다.' }
        }
    }
}

// 전역 인스턴스 생성
const authManager = new AuthManager()

export { authManager, supabase }