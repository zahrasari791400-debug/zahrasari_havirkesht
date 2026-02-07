

(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
   
    function loadMeasurementsData() {
        const token = getToken();
        if (!token) {
            console.warn('⚠️ No token found');
            // Redirect to login page
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.requireAuth(true);
            } else {
                window.location.href = 'login.html';
            }
            renderMeasurementsTable([]);
            return;
        }
        
        fetch(API_BASE_URL + '/measure_unit/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 401) {
                if (typeof AuthUtils !== 'undefined') {
                    AuthUtils.handleUnauthorized(new Error('Unauthorized'));
                } else {
                    window.location.href = 'login.html';
                }
                throw new Error('Unauthorized');
            }
            if (!res.ok) throw new Error('Failed to load measure units');
            return res.json();
        })
        .then(data => {
            console.log('✅ Measure units loaded:', data);
            renderMeasurementsTable(data);
        })
        .catch(err => {
            console.error('❌ Error loading measure units:', err);
            renderMeasurementsTable([]);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در دریافت لیست واحدها',
                    confirmButtonColor: '#087e67'
                });
            }
        });
    }
    
    function renderMeasurementsTable(data) {
        const tbody = document.querySelector('#measurementTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const items = Array.isArray(data) ? data : (data.items || data.results || []);
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="padding: 40px; color: #64748b; text-align: center;">هیچ واحد اندازه‌گیری یافت نشد</td></tr>';
            updateCount(0);
            return;
        }
        
        items.forEach((item) => {
            const row = document.createElement('tr');
            const unitName = item.name_unit || item.name || '-';
            
            row.innerHTML = `
                <td data-label="مقیاس">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-ruler" style="color: #087e67;"></i>
                        <span class="font-bold">${unitName}</span>
                    </div>
                </td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.MeasurementModule.deleteMeasurement(this, '${encodeURIComponent(unitName)}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateCount(items.length);
    }
    
    function updateCount(count) {
        const el = document.getElementById('measurementCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن واحد جدید - POST /measure_unit/
    // ==========================================
    function addMeasurement() {
        if (typeof Swal === 'undefined') {
            const unitName = prompt('نام واحد اندازه‌گیری را وارد کنید:');
            if (unitName) {
                performAdd({ name_unit: unitName });
            }
            return;
        }
        
        Swal.fire({
            title: 'ثبت واحد اندازه‌گیری جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام مقیاس</label>
                        <input id="swal-unit-name" class="swal2-input" placeholder="مثال: کیلوگرم" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            width: '500px',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#087e67',
            preConfirm: () => {
                const name_unit = document.getElementById('swal-unit-name').value.trim();
                
                if (!name_unit) {
                    Swal.showValidationMessage('لطفاً نام مقیاس را وارد کنید');
                    return false;
                }
                
                return { name_unit: name_unit };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                performAdd(result.value);
            }
        });
    }
    
    function performAdd(data) {
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال ثبت...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/measure_unit/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create measure unit');
            return res.json();
        })
        .then(() => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'مقیاس ثبت شد',
                    text: `مقیاس "${data.name_unit}" با موفقیت اضافه شد`,
                    confirmButtonColor: '#087e67',
                    timer: 2000
                });
            } else {
                alert('مقیاس با موفقیت ثبت شد');
            }
            
            loadMeasurementsData();
        })
        .catch(err => {
            console.error('❌ Error creating measure unit:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در ثبت مقیاس',
                    confirmButtonColor: '#087e67'
                });
            } else {
                alert('خطا در ثبت مقیاس');
            }
        });
    }
    
    // ==========================================
    // 🗑️ حذف واحد - DELETE /measure_unit/{unit_name}
    // ==========================================
    function deleteMeasurement(el, unitName) {
        const decodedName = decodeURIComponent(unitName);
        
        if (typeof Swal === 'undefined') {
            if (confirm(`آیا از حذف مقیاس "${decodedName}" اطمینان دارید؟`)) {
                performDelete(el, unitName);
            }
            return;
        }
        
        Swal.fire({
            title: 'حذف مقیاس',
            text: `آیا از حذف مقیاس "${decodedName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, unitName);
            }
        });
    }
    
    function performDelete(el, unitName) {
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
        
        fetch(API_BASE_URL + '/measure_unit/' + unitName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete measure unit');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateCount(document.querySelectorAll('#measurementTable tbody tr').length);
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'حذف شد!',
                        text: 'مقیاس با موفقیت حذف شد',
                        confirmButtonColor: '#087e67',
                        timer: 1500
                    });
                } else {
                    alert('مقیاس با موفقیت حذف شد');
                }
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting measure unit:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در حذف مقیاس',
                    confirmButtonColor: '#087e67'
                });
            } else {
                alert('خطا در حذف مقیاس');
            }
        });
    }
    
    // ==========================================
    // 🔍 جستجو در جدول
    // ==========================================
    function filterTable() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        
        const searchValue = input.value.toLowerCase();
        const rows = document.querySelectorAll('#measurementTable tbody tr');
        
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const shouldShow = text.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    // ==========================================
    // 📄 صفحه‌بندی (Pagination)
    // ==========================================
    function prevPage() {
        console.log('Previous page');
    }
    
    function nextPage() {
        console.log('Next page');
    }
    
    // ==========================================
    // 🛠️ توابع کمکی
    // ==========================================
    function convertToFarsiNumber(num) {
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
    }
    
    // ==========================================
    // Export توابع برای دسترسی global
    // ==========================================
    window.MeasurementModule = {
        loadMeasurementsData: loadMeasurementsData,
        addMeasurement: addMeasurement,
        deleteMeasurement: deleteMeasurement,
        filterTable: filterTable,
        prevPage: prevPage,
        nextPage: nextPage
    };
    
    console.log('✅ Measurement Unit module loaded successfully');
    
    // بارگذاری خودکار
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.querySelector('#measurementTable')) {
                loadMeasurementsData();
            }
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#measurementTable')) {
                loadMeasurementsData();
            }
        }, 100);
    }
    
})();
