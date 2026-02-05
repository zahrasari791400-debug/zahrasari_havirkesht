const API_BASE_URL = 'https://edu-api.havirkesht.ir';

const loginForm = document.getElementById("loginForm");


let isSubmitting = false;

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        console.log('Form submitted');

        const username = document.getElementById("username")?.value.trim();
        const password = document.getElementById("password")?.value.trim();
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginBtnLoader = document.getElementById('loginBtnLoader');

        if (!username || !password) {
            isSubmitting = false;

            Swal.fire({
                icon: 'warning',
                title: 'هشدار',
                text: 'لطفاً نام کاربری و رمز عبور را وارد کنید',
                confirmButtonColor: '#078075'
            });
            return;
        }

        console.log('Attempting login for user:', username);

        loginBtn && (loginBtn.disabled = true);
        loginBtnText && loginBtnText.classList.add('hidden');
        loginBtnLoader && loginBtnLoader.classList.remove('hidden');

        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        fetch(`${API_BASE_URL}/token`, {
            method: "POST",
            body: formData,
        })
        .then(async (res) => {
            console.log('Response status:', res.status);

            if (!res.ok) {
                const msg = res.status === 401
                    ? 'نام کاربری یا رمز عبور اشتباه است'
                    : 'خطا در ارتباط با سرور';
                throw new Error(msg);
            }

            return res.json();
        })
        .then((data) => {
            if (!data?.access_token) {
                throw new Error('پاسخ نامعتبر از سرور');
            }

            localStorage.setItem('access_token', data.access_token);
            data.refresh_token && localStorage.setItem('refresh_token', data.refresh_token);

            console.log('Tokens saved');

            Swal.fire({
                icon: 'success',
                title: '✅ ورود موفقیت‌آمیز',
                html: `
                    <p class="text-lg mb-2">خوش آمدید!</p>
                    <p class="text-sm text-gray-600">در حال انتقال به داشبورد...</p>
                `,
                confirmButtonColor: '#078075',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        })
        .catch((err) => {
            console.error('Login error:', err);

            Swal.fire({
                icon: 'error',
                title: '❌ خطا در ورود',
                text: err.message || 'مشکلی رخ داده است',
                confirmButtonText: 'تلاش مجدد',
                confirmButtonColor: '#078075'
            });
        })
        .finally(() => {
            isSubmitting = false;
            loginBtn && (loginBtn.disabled = false);
            loginBtnText && loginBtnText.classList.remove('hidden');
            loginBtnLoader && loginBtnLoader.classList.add('hidden');
        });
    });
} else {
    console.error('Login form not found!');
}

console.log('Login script loaded successfully');
