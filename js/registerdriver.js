

(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function loadDrivers() {
        const token = getToken();
        if (!token) {
            console.warn('⚠️ No token found');
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.requireAuth(true);
            } else {
                window.location.href = 'login.html';
            }
            renderDriversTable([]);
            return Promise.resolve([]);
        }
        
        return fetch(API_BASE_URL + '/driver/', {
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
            if (!res.ok) throw new Error('Failed to load drivers');
            return res.json();
        })
        .then(data => {
            console.log('✅ Drivers loaded:', data);
            renderDriversTable(data);
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading drivers:', err);
            renderDriversTable([]);
            return [];
        });
    }
    
    // ==========================================
    // 📊 بارگذاری خودروها - GET /cars/
    // ==========================================
    function loadCars() {
        const token = getToken();
        if (!token) {
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.requireAuth(true);
            } else {
                window.location.href = 'login.html';
            }
            return Promise.resolve([]);
        }
        
        return fetch(API_BASE_URL + '/cars/', {
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
            if (!res.ok) throw new Error('Failed to load cars');
            return res.json();
        })
        .then(data => {
            console.log('✅ Cars loaded:', data);
            return Array.isArray(data) ? data : (data.items || []);
        })
        .catch(err => {
            console.error('❌ Error loading cars:', err);
            return [];
        });
    }
    
    function renderDriversTable(data) {
        const tbody = document.querySelector('#driverTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const items = Array.isArray(data) ? data : (data.items || data.results || []);
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="padding: 40px; color: #64748b; text-align: center;">هیچ راننده‌ای یافت نشد</td></tr>';
            updateCount(0);
            return;
        }
        
        items.forEach((driver) => {
            const row = document.createElement('tr');
            
            // استخراج داده‌ها
            const name = driver.name || '-';
            const lastName = driver.last_name || '-';
            const nationalCode = driver.national_code || '-';
            const phoneNumber = driver.phone_number || '-';
            const licensePlate = driver.license_plate || '-';
            const capacityTon = driver.capacity_ton ? convertToFarsiNumber(driver.capacity_ton) : '-';
            
            // استخراج نوع خودرو
            let carType = '-';
            if (driver.car && driver.car.name) {
                carType = driver.car.name;
            } else if (driver.car_name) {
                carType = driver.car_name;
            }
            
            // استخراج تاریخ ایجاد
            let createdDate = '-';
            if (driver.created_at) {
                createdDate = formatDate(driver.created_at);
            } else if (driver.date_created) {
                createdDate = formatDate(driver.date_created);
            }
            
            const driverId = driver.id || driver.driver_id;
            
            row.innerHTML = `
                <td data-label="نام">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-user" style="color: #087e67;"></i>
                        <span class="font-bold">${name}</span>
                    </div>
                </td>
                <td data-label="نام خانوادگی">${lastName}</td>
                <td data-label="کد ملی">${nationalCode}</td>
                <td data-label="شماره همراه">${phoneNumber}</td>
                <td data-label="پلاک">${licensePlate}</td>
                <td data-label="ظرفیت (تن)">${capacityTon}</td>
                <td data-label="نوع خودرو">${carType}</td>
                <td data-label="تاریخ ایجاد">${createdDate}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.DriverModule.deleteDriver(this, ${driverId})"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateCount(items.length);
    }
    
    function updateCount(count) {
        const el = document.getElementById('driverCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن راننده جدید - POST /driver/
    // ==========================================
    async function addDriver() {
        const cars = await loadCars();
        
        let carOptions = '<option value="">انتخاب خودرو</option>';
        if (cars.length > 0) {
            cars.forEach(car => {
                const carName = car.name || car.car_name || 'نامشخص';
                const carId = car.id || car.car_id;
                carOptions += `<option value="${carId}">${carName}</option>`;
            });
        }
        
        Swal.fire({
            title: 'ثبت راننده جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">نام</label>
                        <input id="swal-name" class="swal2-input" placeholder="نام" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">نام خانوادگی</label>
                        <input id="swal-last_name" class="swal2-input" placeholder="نام خانوادگی" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">کد ملی</label>
                        <input id="swal-national_code" class="swal2-input" placeholder="کد ملی" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">شماره تماس</label>
                        <input id="swal-phone_number" class="swal2-input" placeholder="09xxxxxxxxx" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">خودرو</label>
                        <select id="swal-car_id" class="swal2-input" style="width: 90%; padding: 10px; margin: 0;">
                            ${carOptions}
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">پلاک خودرو</label>
                        <input id="swal-license_plate" class="swal2-input" placeholder="۱۲ الف ۳۴۵ ایران ۶۷" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #334155;">ظرفیت (تن)</label>
                        <input id="swal-capacity_ton" class="swal2-input" type="number" placeholder="مثال: 10" style="width: 90%; margin: 0;">
                    </div>
                </div>
            `,
            width: '550px',
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#087e67',
            preConfirm: () => {
                const name = document.getElementById('swal-name').value.trim();
                const last_name = document.getElementById('swal-last_name').value.trim();
                const national_code = document.getElementById('swal-national_code').value.trim();
                const phone_number = document.getElementById('swal-phone_number').value.trim();
                const car_id = document.getElementById('swal-car_id').value;
                const license_plate = document.getElementById('swal-license_plate').value.trim();
                const capacity_ton = document.getElementById('swal-capacity_ton').value;
                
                if (!name || !last_name || !national_code || !phone_number || !car_id || !license_plate || !capacity_ton) {
                    Swal.showValidationMessage('لطفاً تمام فیلدها را پر کنید');
                    return false;
                }
                
                return {
                    name: name,
                    last_name: last_name,
                    national_code: national_code,
                    phone_number: phone_number,
                    car_id: parseInt(car_id),
                    license_plate: license_plate,
                    capacity_ton: parseFloat(capacity_ton)
                };
            }
        }).then(result => {
            if (result.isConfirmed) {
                performAdd(result.value);
            }
        });
    }
    
    function performAdd(data) {
        const token = getToken();
        
        Swal.fire({
            title: 'در حال ثبت...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch(API_BASE_URL + '/driver/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
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
            if (!res.ok) throw new Error('Failed to create driver');
            return res.json();
        })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'راننده ثبت شد',
                text: `راننده "${data.name} ${data.last_name}" با موفقیت اضافه شد`,
                confirmButtonColor: '#087e67',
                timer: 2000
            });
            loadDrivers();
        })
        .catch(err => {
            console.error('❌ Error creating driver:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در ثبت راننده',
                confirmButtonColor: '#087e67'
            });
        });
    }
    
    // ==========================================
    // 🗑️ حذف راننده - DELETE /driver/{driver_id}
    // ==========================================
    function deleteDriver(el, driverId) {
        Swal.fire({
            title: 'حذف راننده',
            text: `آیا از حذف این راننده اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, driverId);
            }
        });
    }
    
    function performDelete(el, driverId) {
        const token = getToken();
        
        Swal.fire({
            title: 'در حال حذف...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch(API_BASE_URL + '/driver/' + driverId, {
            method: 'DELETE',
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
            if (!res.ok) throw new Error('Failed to delete driver');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateCount(document.querySelectorAll('#driverTable tbody tr').length);
                
                Swal.fire({
                    icon: 'success',
                    title: 'حذف شد!',
                    text: 'راننده با موفقیت حذف شد',
                    confirmButtonColor: '#087e67',
                    timer: 1500
                });
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting driver:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در حذف راننده',
                confirmButtonColor: '#087e67'
            });
        });
    }
    
    // ==========================================
    // 🔍 جستجو در جدول
    // ==========================================
    function filterTable() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        
        const searchValue = input.value.toLowerCase();
        const rows = document.querySelectorAll('#driverTable tbody tr');
        
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const shouldShow = text.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    // ==========================================
    // 🔧 نمایش فیلترها
    // ==========================================
    function showFilters() {
        Swal.fire({
            title: 'تنظیمات نمایش',
            text: 'این قابلیت به زودی اضافه خواهد شد',
            icon: 'info',
            confirmButtonColor: '#087e67'
        });
    }
    
    // ==========================================
    // 🛠️ توابع کمکی
    // ==========================================
    function convertToFarsiNumber(num) {
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
    }
    
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return convertToFarsiNumber(`${year}/${month}/${day}`);
        } catch (e) {
            return '-';
        }
    }
    
    // ==========================================
    // Export توابع برای دسترسی global
    // ==========================================
    window.DriverModule = {
        loadDrivers: loadDrivers,
        loadCars: loadCars,
        addDriver: addDriver,
        deleteDriver: deleteDriver,
        filterTable: filterTable,
        showFilters: showFilters
    };
    
    console.log('✅ Driver Registration module loaded successfully');
    
    // بارگذاری خودکار
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.querySelector('#driverTable')) {
                loadDrivers();
            }
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#driverTable')) {
                loadDrivers();
            }
        }, 100);
    }
    
})();
