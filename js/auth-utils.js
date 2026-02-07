// ==========================================
// 🔐 Authentication Utilities
// توابع مشترک احراز هویت
// ==========================================

(function() {
    'use strict';
    
    const AUTH_CONFIG = {
        LOGIN_PAGE: 'login.html',
        DASHBOARD_PAGE: 'dashboard.html',
        TOKEN_KEY: 'access_token',
        REFRESH_TOKEN_KEY: 'refresh_token'
    };
    
    /**
     * دریافت توکن دسترسی از localStorage
     */
    function getToken() {
        return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    }
    
    /**
     * دریافت refresh token از localStorage
     */
    function getRefreshToken() {
        return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    }
    
    /**
     * ذخیره توکن‌ها در localStorage
     */
    function saveTokens(accessToken, refreshToken = null) {
        if (accessToken) {
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken);
        }
        if (refreshToken) {
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        }
    }
    
    /**
     * حذف تمام توکن‌ها و خروج از سیستم
     */
    function clearTokens() {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    }
    
    /**
     * بررسی وجود توکن و هدایت به صفحه login در صورت نبود
     * @param {boolean} showAlert - نمایش پیام هشدار قبل از redirect
     * @returns {boolean} - true اگر توکن موجود باشد، false در غیر این صورت
     */
    function requireAuth(showAlert = true) {
        const token = getToken();
        
        if (!token) {
            console.warn('⚠️ No authentication token found. Redirecting to login...');
            
            if (showAlert && typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'لطفاً وارد شوید',
                    text: 'برای دسترسی به این صفحه باید وارد سیستم شوید',
                    confirmButtonText: 'ورود',
                    confirmButtonColor: '#078075',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    redirectToLogin();
                });
            } else {
                redirectToLogin();
            }
            
            return false;
        }
        
        return true;
    }
    
    /**
     * هدایت کاربر به صفحه login
     */
    function redirectToLogin() {
        // ذخیره URL فعلی برای بازگشت بعد از login
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage && currentPage !== AUTH_CONFIG.LOGIN_PAGE) {
            sessionStorage.setItem('redirect_after_login', currentPage);
        }
        
        window.location.href = AUTH_CONFIG.LOGIN_PAGE;
    }
    
    /**
     * هدایت کاربر به صفحه dashboard
     */
    function redirectToDashboard() {
        window.location.href = AUTH_CONFIG.DASHBOARD_PAGE;
    }
    
    /**
     * بازگشت به صفحه قبلی بعد از login موفق
     */
    function redirectAfterLogin() {
        const redirectPage = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');
        
        if (redirectPage && redirectPage !== AUTH_CONFIG.LOGIN_PAGE) {
            window.location.href = redirectPage;
        } else {
            redirectToDashboard();
        }
    }
    
    /**
     * خروج از سیستم
     */
    function logout(showConfirmation = true) {
        if (showConfirmation && typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'question',
                title: 'خروج از سیستم',
                text: 'آیا مطمئن هستید که می‌خواهید از سیستم خارج شوید؟',
                showCancelButton: true,
                confirmButtonText: 'بله، خروج',
                cancelButtonText: 'انصراف',
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280'
            }).then((result) => {
                if (result.isConfirmed) {
                    performLogout();
                }
            });
        } else {
            performLogout();
        }
    }
    
    /**
     * انجام عملیات خروج
     */
    function performLogout() {
        console.log('🚪 Logging out...');
        clearTokens();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'خروج موفقیت‌آمیز',
                text: 'شما با موفقیت از سیستم خارج شدید',
                confirmButtonColor: '#078075',
                timer: 1500,
                allowOutsideClick: false
            }).then(() => {
                redirectToLogin();
            });
        } else {
            redirectToLogin();
        }
    }
    
    /**
     * بررسی اعتبار توکن (بدون call به API)
     * این تابع فقط ساختار JWT را بررسی می‌کند
     */
    function isTokenValid(token = null) {
        const authToken = token || getToken();
        
        if (!authToken) {
            return false;
        }
        
        try {
            // بررسی ساختار اولیه JWT (header.payload.signature)
            const parts = authToken.split('.');
            if (parts.length !== 3) {
                return false;
            }
            
            // Decode payload
            const payload = JSON.parse(atob(parts[1]));
            
            // بررسی انقضا
            if (payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                if (now >= payload.exp) {
                    console.warn('⚠️ Token has expired');
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error validating token:', error);
            return false;
        }
    }
    
    /**
     * Handle کردن خطاهای 401 Unauthorized
     */
    function handleUnauthorized(error) {
        console.error('🔒 Unauthorized access:', error);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'دسترسی غیرمجاز',
                text: 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید',
                confirmButtonText: 'ورود',
                confirmButtonColor: '#078075',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                clearTokens();
                redirectToLogin();
            });
        } else {
            clearTokens();
            redirectToLogin();
        }
    }
    
    /**
     * ایجاد header های احراز هویت برای API calls
     */
    function getAuthHeaders(additionalHeaders = {}) {
        const token = getToken();
        
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            ...additionalHeaders
        };
    }
    
    /**
     * Fetch wrapper با authentication خودکار
     */
    async function authenticatedFetch(url, options = {}) {
        const token = getToken();
        
        if (!token) {
            handleUnauthorized(new Error('No token available'));
            return Promise.reject(new Error('Authentication required'));
        }
        
        const headers = getAuthHeaders(options.headers || {});
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            handleUnauthorized(new Error('Unauthorized'));
            throw new Error('Unauthorized');
        }
        
        return response;
    }
    
    // ==========================================
    // Export توابع برای استفاده global
    // ==========================================
    window.AuthUtils = {
        // Token management
        getToken,
        getRefreshToken,
        saveTokens,
        clearTokens,
        isTokenValid,
        
        // Navigation
        requireAuth,
        redirectToLogin,
        redirectToDashboard,
        redirectAfterLogin,
        
        // Logout
        logout,
        performLogout,
        
        // API helpers
        getAuthHeaders,
        authenticatedFetch,
        handleUnauthorized,
        
        // Config
        config: AUTH_CONFIG
    };
    
    console.log('✅ Auth utilities loaded successfully');
    
})();
