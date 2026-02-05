
(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function loadCars() {
        const token = getToken();
        if (!token) return;
        
        fetch(API_BASE_URL + '/cars/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load cars');
            return res.json();
        })
        .then(data => {
            console.log('✅ Cars loaded:', data);
            renderCarsTable(data);
        })
        .catch(err => {
            console.error('❌ Error loading cars:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در دریافت لیست خودروها',
                    confirmButtonColor: '#078075'
                });
            }
        });
    }
    
    function renderCarsTable(data) {
        const tbody = document.querySelector('#carTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // بررسی ساختار پاسخ - ممکن است items یا مستقیم آرایه باشد
        const items = data.items || data || [];
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px; color: #64748b;">هیچ خودرویی یافت نشد</td></tr>';
            updateCount(0);
            return;
        }
        
        items.forEach((car, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="ردیف">${convertToFarsiNumber(index + 1)}</td>
                <td data-label="نام خودرو">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-car" style="color: #087e67;"></i>
                        <span class="font-bold">${car.name || '-'}</span>
                    </div>
                </td>
                <td data-label="تاریخ ثبت">${car.created_at || getTodayPersian()}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.RegisterCarModule.deleteCar(this, ${car.id})"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateCount(items.length);
    }
    
    function updateCount(count) {
        const el = document.getElementById('carCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن خودرو جدید - API ردیف 142
    // POST /cars/
    // Body: { "name": "string" }
    // Response: Success (200): Car created
    // ==========================================
    function addCar() {
        if (typeof Swal === 'undefined') {
            const carName = prompt('نام خودرو را وارد کنید:');
            if (carName) {
                performAdd({ name: carName });
            }
            return;
        }
        
        Swal.fire({
            title: 'ثبت خودرو جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام خودرو</label>
                        <input id="swal-car-name" class="swal2-input" placeholder="مثال: نیسان" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            width: '500px',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#078075',
            preConfirm: () => {
                const name = document.getElementById('swal-car-name').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('لطفاً نام خودرو را وارد کنید');
                    return false;
                }
                
                return { name: name };
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
        
        fetch(API_BASE_URL + '/cars/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create car');
            return res.json();
        })
        .then(() => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'خودرو ثبت شد',
                    text: `خودرو "${data.name}" با موفقیت اضافه شد`,
                    confirmButtonColor: '#078075',
                    timer: 2000
                });
            } else {
                alert('خودرو با موفقیت ثبت شد');
            }
            
            loadCars();
        })
        .catch(err => {
            console.error('❌ Error creating car:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در ثبت خودرو',
                    confirmButtonColor: '#078075'
                });
            } else {
                alert('خطا در ثبت خودرو');
            }
        });
    }
    
    // ==========================================
    // 🗑️ حذف خودرو - API ردیف 146
    // DELETE /cars/{car_id}
    // Response: Success (200): Car deleted
    // ==========================================
    function deleteCar(el, carId) {
        if (typeof Swal === 'undefined') {
            if (confirm(`آیا از حذف این خودرو اطمینان دارید؟`)) {
                performDelete(el, carId);
            }
            return;
        }
        
        Swal.fire({
            title: 'حذف خودرو',
            text: `آیا از حذف این خودرو اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, carId);
            }
        });
    }
    
    function performDelete(el, carId) {
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
        
        fetch(API_BASE_URL + '/cars/' + carId, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete car');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateCount(document.querySelectorAll('#carTable tbody tr').length);
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'حذف شد!',
                        text: 'خودرو با موفقیت حذف شد',
                        confirmButtonColor: '#078075',
                        timer: 1500
                    });
                } else {
                    alert('خودرو با موفقیت حذف شد');
                }
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting car:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در حذف خودرو',
                    confirmButtonColor: '#078075'
                });
            } else {
                alert('خطا در حذف خودرو');
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
        const rows = document.querySelectorAll('#carTable tbody tr');
        
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const shouldShow = text.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        });
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
    window.RegisterCarModule = {
        loadCars: loadCars,
        addCar: addCar,
        deleteCar: deleteCar,
        filterTable: filterTable
    };
    
    console.log('✅ Car Registration module loaded successfully');
    
    // بارگذاری خودکار
    setTimeout(() => {
        if (document.querySelector('#carTable')) {
            loadCars();
        }
    }, 100);
    
})();
