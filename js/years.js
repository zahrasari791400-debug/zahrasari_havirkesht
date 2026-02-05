// ===================================
// Crop Years Page - API Integration
// صفحه ثبت سال‌های زراعی - نسخه داشبورد
// ===================================

(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    // ==========================================
    // 📅 بارگذاری سال‌های زراعی از API
    // ==========================================
    function loadCropYearsData() {
        console.log('📅 Loading crop years from API...');
        const token = getToken();
        
        if (!token) {
            console.error('❌ No access token found!');
            return;
        }
        
        fetch(API_BASE_URL + '/crop-year/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Response status:', res.status);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Crop years data:', data);
            renderCropYearsTable(data);
        })
        .catch(err => {
            console.error('❌ Error loading crop years:', err);
            showError('خطا در دریافت لیست سال‌های زراعی');
        });
    }
    
    // ==========================================
    // 🎨 رندر کردن جدول سال‌های زراعی
    // ==========================================
    function renderCropYearsTable(data) {
        console.log('🎨 Rendering crop years table...');
        const tbody = document.querySelector('#yearTable tbody');
        if (!tbody) {
            console.error('❌ Table tbody not found!');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!data.items || data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 40px; color: #64748b;">هیچ سال زراعی یافت نشد</td></tr>';
            return;
        }
        
        data.items.forEach((year, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="ردیف">${convertToFarsiNumber(index + 1)}</td>
                <td data-label="سال زراعی">
                    <div class="flex items-center justify-center gap-2">
                        <i class="ri-calendar-line" style="color: #087e67;"></i>
                        <span class="font-bold">${year.crop_year_name}</span>
                    </div>
                </td>
                <td data-label="تاریخ ایجاد">${year.created_at || getTodayPersian()}</td>
                <td data-label="وضعیت"><span class="badge-pro badge-success">فعال</span></td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon edit fas fa-edit" title="ویرایش" onclick="window.yearModule.editYear(this, '${year.crop_year_name}')"></i>
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.yearModule.deleteYear(this, '${year.crop_year_name}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('✅ Table rendered with', data.items.length, 'items');
    }
    
    // ==========================================
    // ➕ اضافه کردن سال زراعی جدید
    // ==========================================
    function addYear() {
        console.log('➕ Adding new crop year...');
        
        if (typeof Swal === 'undefined') {
            const yearName = prompt('سال زراعی جدید را وارد کنید (مثال: 1405):');
            if (yearName) {
                performAddYear(yearName);
            }
            return;
        }
        
        Swal.fire({
            title: 'ایجاد سال زراعی جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">سال زراعی</label>
                        <input id="swal-year" class="swal2-input" placeholder="مثال: 1405" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#078075',
            preConfirm: () => {
                const year = document.getElementById('swal-year').value;
                if (!year) {
                    Swal.showValidationMessage('لطفاً سال زراعی را وارد کنید');
                    return false;
                }
                return { year: year };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                performAddYear(result.value.year);
            }
        });
    }
    
    function performAddYear(yearName) {
        console.log('💾 Saving crop year:', yearName);
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
    
        fetch(API_BASE_URL + '/crop-year/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ crop_year_name: yearName })
        })
        .then(res => res.json())
        .then(data => {
            console.log('✅ Crop year created:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'سال زراعی ثبت شد',
                    text: `سال "${yearName}" با موفقیت اضافه شد`,
                    confirmButtonColor: '#078075',
                    timer: 2000
                });
            } else {
                alert('سال زراعی با موفقیت ثبت شد');
            }
            
            // بارگذاری مجدد لیست
            loadCropYearsData();
        })
        .catch(err => {
            console.error('❌ Error creating crop year:', err);
            showError('خطا در ثبت سال زراعی');
        });
    }
    
    // ==========================================
    // 🗑️ حذف سال زراعی
    // ==========================================
    function deleteYear(el, yearName) {
        console.log('🗑️ Deleting crop year:', yearName);
        
        if (typeof Swal === 'undefined') {
            if (confirm(`آیا از حذف سال زراعی "${yearName}" اطمینان دارید؟`)) {
                performDeleteYear(el, yearName);
            }
            return;
        }
        
        Swal.fire({
            title: 'حذف سال زراعی',
            text: `آیا از حذف سال زراعی "${yearName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDeleteYear(el, yearName);
            }
        });
    }
    
    function performDeleteYear(el, yearName) {
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال حذف...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/crop-year/' + yearName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log('✅ Crop year deleted:', data);
            
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'حذف شد!',
                        text: 'سال زراعی با موفقیت حذف شد',
                        confirmButtonColor: '#078075',
                        timer: 1500
                    });
                } else {
                    alert('سال زراعی با موفقیت حذف شد');
                }
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting crop year:', err);
            showError('خطا در حذف سال زراعی');
        });
    }
    
    // ==========================================
    // ✏️ ویرایش سال زراعی
    // ==========================================
    function editYear(el, yearName) {
        console.log('✏️ Editing crop year:', yearName);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'ویرایش سال زراعی',
                text: 'API برای ویرایش سال زراعی در مستندات موجود نیست',
                confirmButtonColor: '#078075'
            });
        } else {
            alert('API برای ویرایش سال زراعی در مستندات موجود نیست');
        }
    }
    
    // ==========================================
    // 🔍 جستجو در جدول
    // ==========================================
    function filterYearTable() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        
        const searchValue = input.value.toLowerCase();
        const rows = document.querySelectorAll('#yearTable tbody tr');
        
        rows.forEach(row => {
            const yearName = row.cells[1]?.innerText.toLowerCase() || '';
            const shouldShow = yearName.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    // ==========================================
    // 📤 خروجی Excel
    // ==========================================
    function exportYearData() {
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
    
    function showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: message,
                confirmButtonColor: '#078075'
            });
        } else {
            alert(message);
        }
    }
    
    // ==========================================
    // Export توابع برای دسترسی global
    // ==========================================
    window.yearModule = {
        loadCropYearsData: loadCropYearsData,
        addYear: addYear,
        deleteYear: deleteYear,
        editYear: editYear,
        filterYearTable: filterYearTable,
        exportYearData: exportYearData
    };
    
    // برای سازگاری با dashboard.js
    window.displayCropYears = renderCropYearsTable;
    
    console.log('✅ Years module loaded successfully');
    
    // بارگذاری خودکار فقط اگر جدول موجود باشد
    setTimeout(() => {
        if (document.querySelector('#yearTable')) {
            loadCropYearsData();
        }
    }, 100);
    
})();
