
(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function loadProvincesData() {
        console.log('🗺️ Loading provinces from API...');
        const token = getToken();
        
        if (!token) {
            console.error('❌ No access token found!');
            // Redirect to login page
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.requireAuth(true);
            } else {
                window.location.href = 'login.html';
            }
            return;
        }
        
        fetch(API_BASE_URL + '/province/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Provinces response status:', res.status);
            if (res.status === 401) {
                // Handle unauthorized access
                if (typeof AuthUtils !== 'undefined') {
                    AuthUtils.handleUnauthorized(new Error('Unauthorized'));
                } else {
                    window.location.href = 'login.html';
                }
                throw new Error('Unauthorized');
            }
            if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Provinces data:', data);
            renderProvincesTable(data);
        })
        .catch(err => {
            console.error('❌ Error loading provinces:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در دریافت لیست استان‌ها',
                    confirmButtonColor: '#078075'
                });
            }
        });
    }
    
    // ==========================================
    //  رندر کردن جدول استان‌ها
    // ==========================================
    function renderProvincesTable(data) {
        console.log('🎨 Rendering provinces table...');
        const tbody = document.querySelector('#provinceTable tbody');
        if (!tbody) {
            console.error('❌ Table tbody not found!');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!data.items || data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 40px; color: #64748b;">هیچ استانی یافت نشد</td></tr>';
            updateProvinceCount(0);
            return;
        }
        
        data.items.forEach((province, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="ردیف">${convertToFarsiNumber(index + 1)}</td>
                <td data-label="نام استان">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-location-dot" style="color: #087e67;"></i>
                        <span class="font-bold">${province.province}</span>
                    </div>
                </td>
                <td data-label="کد استان"><span class="badge-pro badge-info">${convertToFarsiNumber(province.id)}</span></td>
                <td data-label="تاریخ ثبت">${province.created_at || getTodayPersian()}</td>
                <td data-label="وضعیت"><span class="badge-pro badge-success">فعال</span></td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon edit fas fa-edit" title="ویرایش" onclick="window.provinceModule.editProvince(this, '${province.province}')"></i>
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.provinceModule.deleteProvince(this, '${province.province}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateProvinceCount(data.items.length);
        console.log('✅ Table rendered with', data.items.length, 'provinces');
    }
    
    // ==========================================
    // 🔢 به‌روزرسانی تعداد استان‌ها
    // ==========================================
    function updateProvinceCount(count) {
        const countElement = document.getElementById('provinceCount');
        if (countElement) {
            countElement.innerText = convertToFarsiNumber(count);
        }
    }
    
    // ==========================================
    // ➕ اضافه کردن استان جدید
    // ==========================================
    function addProvince() {
        console.log('➕ Adding new province...');
        
        if (typeof Swal === 'undefined') {
            const provinceName = prompt('نام استان را وارد کنید:');
            if (provinceName) {
                performAddProvince(provinceName);
            }
            return;
        }
        
        Swal.fire({
            title: 'ثبت استان جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام استان</label>
                        <input id="swal-province-name" class="swal2-input" placeholder="مثال: تهران" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#078075',
            preConfirm: () => {
                const name = document.getElementById('swal-province-name').value;
                if (!name) {
                    Swal.showValidationMessage('لطفاً نام استان را وارد کنید');
                    return false;
                }
                return { name: name };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                performAddProvince(result.value.name);
            }
        });
    }
    
    function performAddProvince(provinceName) {
        console.log('💾 Saving province:', provinceName);
        const token = getToken();
        
        // نمایش loading
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال ثبت...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/province/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ province: provinceName })
        })
        .then(res => {
            if (!res.ok) throw new Error('Create failed');
            return res.json();
        })
        .then(data => {
            console.log('✅ Province created:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'استان ثبت شد',
                    text: `استان "${provinceName}" با موفقیت اضافه شد`,
                    confirmButtonColor: '#078075',
                    timer: 2000
                });
            } else {
                alert('استان با موفقیت ثبت شد');
            }
            
            // بارگذاری مجدد لیست
            loadProvincesData();
        })
        .catch(err => {
            console.error('❌ Error creating province:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در ثبت استان',
                    confirmButtonColor: '#078075'
                });
            } else {
                alert('خطا در ثبت استان');
            }
        });
    }
    
    // ==========================================
    // 🗑️ حذف استان
    // ==========================================
    function deleteProvince(el, provinceName) {
        console.log('🗑️ Deleting province:', provinceName);
        
        if (typeof Swal === 'undefined') {
            if (confirm(`آیا از حذف استان "${provinceName}" اطمینان دارید؟`)) {
                performDeleteProvince(el, provinceName);
            }
            return;
        }
        
        Swal.fire({
            title: 'حذف استان',
            text: `آیا از حذف استان "${provinceName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDeleteProvince(el, provinceName);
            }
        });
    }
    
    function performDeleteProvince(el, provinceName) {
        const token = getToken();
        
        // نمایش loading
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال حذف...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/province/' + provinceName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log('✅ Province deleted:', data);
            
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateProvinceCount(document.querySelectorAll('#provinceTable tbody tr').length);
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'حذف شد!',
                        text: 'استان با موفقیت حذف شد',
                        confirmButtonColor: '#078075',
                        timer: 1500
                    });
                } else {
                    alert('استان با موفقیت حذف شد');
                }
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting province:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در حذف استان',
                    confirmButtonColor: '#078075'
                });
            } else {
                alert('خطا در حذف استان');
            }
        });
    }
    
    // ==========================================
    // ✏️ ویرایش استان
    // ==========================================
    function editProvince(el, provinceName) {
        console.log('✏️ Editing province:', provinceName);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'ویرایش استان',
                text: 'API برای ویرایش استان در مستندات موجود نیست',
                confirmButtonColor: '#078075'
            });
        } else {
            alert('API برای ویرایش استان در مستندات موجود نیست');
        }
    }
    
    // ==========================================
    // 🔍 جستجو در جدول
    // ==========================================
    function filterTable() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        
        const searchValue = input.value.toLowerCase();
        const rows = document.querySelectorAll('#provinceTable tbody tr');
        
        rows.forEach(row => {
            const provinceName = row.cells[1]?.innerText.toLowerCase() || '';
            const shouldShow = provinceName.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    // ==========================================
    // 📤 خروجی Excel
    // ==========================================
    function exportData() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'خروجی Excel',
                text: 'این قابلیت به زودی اضافه می‌شود',
                confirmButtonColor: '#078075'
            });
        } else {
            alert('این قابلیت به زودی اضافه می‌شود');
        }
    }
    
    // ==========================================
    // 🛠️ توابع کمکی
    // ==========================================
    function convertToFarsiNumber(num) {
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
    }
    
    function getTodayPersian() {
        const today = new Date();
        const year = 1404;
        const month = ('0' + (today.getMonth() + 1)).slice(-2);
        const day = ('0' + today.getDate()).slice(-2);
        return year + '/' + month + '/' + day;
    }
    
    // ==========================================
    // Export توابع برای دسترسی global
    // ==========================================
    window.provinceModule = {
        loadProvincesData: loadProvincesData,
        addProvince: addProvince,
        deleteProvince: deleteProvince,
        editProvince: editProvince,
        filterTable: filterTable,
        exportData: exportData
    };
    
    // برای سازگاری با dashboard.js
    window.displayProvinces = renderProvincesTable;
    
    console.log('✅ Provinces module loaded successfully');
    
    // بارگذاری خودکار فقط اگر جدول موجود باشد
    setTimeout(() => {
        if (document.querySelector('#provinceTable')) {
            loadProvincesData();
        }
    }, 100);
    
})();
