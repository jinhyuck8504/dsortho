// auth.js - 실제 Supabase 연동 인증 시스템
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// ⚠️ 여기에 실제 Supabase 정보를 입력하세요
const supabaseUrl = 'YOUR_SUPABASE_URL'  // 예: https://abcdefgh.supabase.co
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'  // eyJ로 시작하는 긴 문자열

const supabase = createClient(supabaseUrl, supabaseKey)

// 인증 상태 관리
class AuthManager {
    constructor() {
        this.currentUser = null
        this.isAuthenticated = false
        this.isAdmin = false
        this.initAuth()
    }

    // 인증 초기화
    async initAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                this.currentUser = session.user
                this.isAuthenticated = true
                await this.checkAdminStatus()
                this.updateUIForAuthenticatedUser()
            }

            // 인증 상태 변경 감지
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event)
                
                if (session) {
                    this.currentUser = session.user
                    this.isAuthenticated = true
                    await this.checkAdminStatus()
                    this.updateUIForAuthenticatedUser()
                } else {
                    this.currentUser = null
                    this.isAuthenticated = false
                    this.isAdmin = false
                    this.updateUIForUnauthenticatedUser()
                }
            })
        } catch (error) {
            console.error('Auth initialization error:', error)
        }
    }

    // 관리자 권한 확인
    async checkAdminStatus() {
        if (!this.currentUser) {
            this.isAdmin = false
            return
        }

        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('role')
                .eq('user_id', this.currentUser.id)
                .single()

            this.isAdmin = !error && data
            console.log('Admin status:', this.isAdmin)
        } catch (error) {
            console.error('Admin check error:', error)
            this.isAdmin = false
        }
    }

    // 회원가입
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        source: '대치삼성정형외과_웹사이트'
                    }
                }
            })

            if (error) throw error

            return {
                success: true,
                message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.',
                data
            }
        } catch (error) {
            console.error('Sign up error:', error)
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

            // 로그인 시간 업데이트
            await this.updateLastSignIn()

            return {
                success: true,
                message: '로그인에 성공했습니다.',
                data
            }
        } catch (error) {
            console.error('Sign in error:', error)
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
            console.error('Sign out error:', error)
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
            console.error('Password reset error:', error)
            return {
                success: false,
                message: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
                error
            }
        }
    }

    // 마지막 로그인 시간 업데이트
    async updateLastSignIn() {
        if (!this.currentUser) return

        try {
            await supabase
                .from('user_profiles')
                .update({ last_sign_in_at: new Date().toISOString() })
                .eq('id', this.currentUser.id)
        } catch (error) {
            console.error('Last sign in update error:', error)
        }
    }

    // 에러 메시지 번역
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
            'User already registered': '이미 등록된 이메일입니다.',
            'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
            'Email not confirmed': '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
            'Invalid email': '유효하지 않은 이메일 형식입니다.',
            'Email rate limit exceeded': '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            'Signup disabled': '현재 회원가입이 비활성화되어 있습니다.',
            'Invalid refresh token': '세션이 만료되었습니다. 다시 로그인해주세요.'
        }
        return errorMessages[error.message] || `오류가 발생했습니다: ${error.message}`
    }

    // 인증된 사용자 UI 업데이트
    updateUIForAuthenticatedUser() {
        console.log('UI 업데이트: 인증된 사용자')
        
        // 치료 사례 갤러리 표시
        this.showBeforeAfterGallery()
        
        // 로그인 폼 숨기고 로그아웃 버튼 표시
        const loginRequired = document.querySelector('.login-required')
        if (loginRequired) {
            loginRequired.innerHTML = `
                <div style="text-align: center;">
                    <h3>환영합니다! ${this.currentUser.email}님</h3>
                    <p>실제 환자분들의 치료 전후 사진을 확인하실 수 있습니다.</p>
                    ${this.isAdmin ? '<p style="color: #1a237e; font-weight: bold;">🔧 관리자 권한으로 로그인됨</p>' : ''}
                    <div style="margin-top: 20px;">
                        <button onclick="authManager.signOut()" class="btn" style="background: #dc3545; color: white;">로그아웃</button>
                        ${this.isAdmin ? '<a href="/admin.html" class="btn btn-primary" style="margin-left: 10px;">관리자 패널</a>' : ''}
                    </div>
                </div>
            `
        }
    }

    // 미인증 사용자 UI 업데이트
    updateUIForUnauthenticatedUser() {
        console.log('UI 업데이트: 미인증 사용자')
        
        // 치료 사례 갤러리 숨기고 로그인 폼 표시
        this.hideBeforeAfterGallery()
        
        const loginRequired = document.querySelector('.login-required')
        if (loginRequired) {
            loginRequired.innerHTML = `
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
                <div id="authMessage" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
            `
        }
    }

    // 치료 사례 갤러리 표시
    async showBeforeAfterGallery() {
        await this.loadTreatmentCases()
    }

    // 치료 사례 갤러리 숨김
    hideBeforeAfterGallery() {
        const gallery = document.getElementById('beforeAfterGallery')
        if (gallery) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f5f5f5; border-radius: 15px;">
                    <h3>🔒 회원 전용 콘텐츠</h3>
                    <p>실제 환자분들의 치료 전후 사진은 회원가입 후 확인하실 수 있습니다.</p>
                </div>
            `
        }
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('authMessage')
        if (messageDiv) {
            messageDiv.textContent = message
            messageDiv.style.display = 'block'
            messageDiv.style.background = type === 'error' ? '#f8d7da' : '#d4edda'
            messageDiv.style.color = type === 'error' ? '#721c24' : '#155724'
            
            setTimeout(() => {
                messageDiv.style.display = 'none'
            }, 5000)
        } else {
            alert(message)
        }
    }

    // 로그인 처리
    async handleSignIn() {
        const email = document.getElementById('authEmail')?.value
        const password = document.getElementById('authPassword')?.value

        if (!email || !password) {
            this.showMessage('이메일과 비밀번호를 입력해주세요.', 'error')
            return
        }

        const result = await this.signIn(email, password)
        this.showMessage(result.message, result.success ? 'success' : 'error')
        
        if (result.success) {
            // 입력 필드 초기화
            document.getElementById('authEmail').value = ''
            document.getElementById('authPassword').value = ''
        }
    }

    // 회원가입 처리
    async handleSignUp() {
        const email = document.getElementById('authEmail')?.value
        const password = document.getElementById('authPassword')?.value

        if (!email || !password) {
            this.showMessage('이메일과 비밀번호를 입력해주세요.', 'error')
            return
        }

        if (password.length < 6) {
            this.showMessage('비밀번호는 최소 6자 이상이어야 합니다.', 'error')
            return
        }

        const result = await this.signUp(email, password)
        this.showMessage(result.message, result.success ? 'success' : 'error')
        
        if (result.success) {
            // 입력 필드 초기화
            document.getElementById('authEmail').value = ''
            document.getElementById('authPassword').value = ''
        }
    }

    // 비밀번호 재설정 처리
    async handleResetPassword() {
        const email = document.getElementById('authEmail')?.value

        if (!email) {
            this.showMessage('이메일을 입력해주세요.', 'error')
            return
        }

        const result = await this.resetPassword(email)
        this.showMessage(result.message, result.success ? 'success' : 'error')
    }

    // 치료 사례 불러오기
    async loadTreatmentCases() {
        if (!this.isAuthenticated) {
            console.log('인증되지 않은 사용자 - 치료 사례 로드 불가')
            return
        }

        try {
            const { data, error } = await supabase
                .from('treatment_cases')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            console.log('치료 사례 로드 성공:', data?.length || 0, '건')

            const gallery = document.getElementById('beforeAfterGallery')
            if (gallery && data && data.length > 0) {
                gallery.innerHTML = data.map(case_ => `
                    <div class="before-after-card" style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr;">
                            <div style="position: relative;">
                                <img src="${case_.before_image}" alt="치료 전" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\"height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;\\">이미지 로드 실패</div>'">
                                <div style="position: absolute; top: 10px; left: 10px; background: rgba(220,53,69,0.9); color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: 600;">BEFORE</div>
                            </div>
                            <div style="position: relative;">
                                <img src="${case_.after_image}" alt="치료 후" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\"height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;\\">이미지 로드 실패</div>'">
                                <div style="position: absolute; top: 10px; right: 10px; background: rgba(26,35,126,0.9); color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: 600;">AFTER</div>
                            </div>
                        </div>
                        <div style="padding: 20px;">
                            <h4 style="color: #1a237e; margin-bottom: 10px; font-size: 1.1rem;">${case_.title}</h4>
                            <p style="color: #666; font-size: 0.9rem; line-height: 1.4;">${case_.description}</p>
                            <p style="color: #999; font-size: 0.8rem; margin-top: 10px;">등록일: ${new Date(case_.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                `).join('')
            } else if (gallery) {
                gallery.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 15px; grid-column: 1 / -1;">
                        <h3 style="color: #1a237e; margin-bottom: 15px;">📸 치료 사례 준비 중</h3>
                        <p style="color: #666;">곧 실제 환자분들의 치료 전후 사진을 확인하실 수 있습니다.</p>
                    </div>
                `
            }

            // 