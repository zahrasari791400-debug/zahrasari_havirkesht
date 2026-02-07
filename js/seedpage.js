

(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function loadSeedsData() {
        const token = getToken();
        if (!token) {
            console.warn('⚠️ No token found');
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.requireAuth(true);
            } else {
                window.location.href = 'login.html';
            }
            renderSeedsTable([]);
            return Promise.resolve([]);
        }
        
        return fetch(API_BASE_URL + '/seed/', {
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
            if (!res.ok) throw new Error('Failed to load seeds');
            return res.json();
        })
        .then(data => {
            console.log('✅ Seeds loaded:', data);
            renderSeedsTable(data);
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading seeds:', err);
            renderSeedsTable([]);
            return [];
        });
    }
    
    // ==========================================
    // 📊 بارگذاری واحدها - GET /measure_unit/
    // ==========================================
    function loadMeasureUnits() {
        const token = getToken();
        if (!token) {
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.requireAuth(true);
            } else {
                window.location.href = 'login.html';
            }
            return Promise.resolve([]);
        }
        
        return fetch(API_BASE_URL + '/measure_unit/', {
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
            return Array.isArray(data) ? data : (data.items || []);
        })
        .catch(err => {
            console.error('❌ Error loading measure units:', err);
            return [];
        });
    }
    
    function renderSeedsTable(data) {
        const tbody = document.querySelector('#seedTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const items = Array.isArray(data) ? data : (data.items || data.results || []);
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 40px; color: #64748b; text-align: center;">هیچ بذری یافت نشد</td></tr>';
            updateSeedCount(0);
            return;
        }
        
        items.forEach((seed) => {
            const row = document.createElement('tr');
            
            // استخراج نام بذر
            const seedName = seed.seed_name || seed.name || '-';
            
            // استخراج واحد اندازه‌گیری
            let measureUnit = '-';
            if (seed.measure_unit) {
                if (typeof seed.measure_unit === 'object') {
                    measureUnit = seed.measure_unit.name_unit || seed.measure_unit.name || '-';
                } else {
                    measureUnit = seed.measure_unit;
                }
            } else if (seed.measure_unit_name) {
                measureUnit = seed.measure_unit_name;
            }
            
            // استخراج تاریخ ایجاد
            let createdDate = '-';
            if (seed.created_at) {
                createdDate = formatDate(seed.created_at);
            } else if (seed.date_created) {
                createdDate = formatDate(seed.date_created);
            }
            
            row.innerHTML = `
                <td data-label="بذر">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-seedling" style="color: #087e67;"></i>
                        <span class="font-bold">${seedName}</span>
                    </div>
                </td>
                <td data-label="مقیاس">${measureUnit}</td>
                <td data-label="تاریخ">${createdDate}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.SeedModule.deleteSeed(this, '${encodeURIComponent(seedName)}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateSeedCount(items.length);
    }
    
    function updateSeedCount(count) {
        const el = document.getElementById('seedCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن بذر جدید - POST /seed/
    // ==========================================
    async function addSeed() {
        const measureUnits = await loadMeasureUnits();
        
        let options = '<option value="">انتخاب واحد اندازه‌گیری</option>';
        if (measureUnits.length > 0) {
            measureUnits.forEach(u => {
                const unitName = u.name_unit || u.name || 'نامشخص';
                const unitId = u.id || u.measure_unit_id;
                options += `<option value="${unitId}">${unitName}</option>`;
            });
        }
        
        Swal.fire({
            title: 'ثبت بذر جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام بذر</label>
                        <input id="swal-seed" class="swal2-input" placeholder="مثال: گندم" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">واحد اندازه‌گیری</label>
                        <select id="swal-measurement" class="swal2-input" style="width: 90%; padding: 10px; margin: 0;">
                            ${options}
                        </select>
                    </div>
                </div>
            `,
            width: '500px',
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#087e67',
            preConfirm: () => {
                const seed_name = document.getElementById('swal-seed').value.trim();
                const measure_unit_id = document.getElementById('swal-measurement').value;
                
                if (!seed_name || !measure_unit_id) {
                    Swal.showValidationMessage('لطفاً تمام فیلدها را پر کنید');
                    return false;
                }
                
                return { 
                    seed_name: seed_name, 
                    measure_unit_id: parseInt(measure_unit_id) 
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
        
        fetch(API_BASE_URL + '/seed/', {
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
            if (!res.ok) throw new Error('Failed to create seed');
            return res.json();
        })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'بذر ثبت شد',
                text: `بذر "${data.seed_name}" با موفقیت اضافه شد`,
                confirmButtonColor: '#087e67',
                timer: 2000
            });
            loadSeedsData();
        })
        .catch(err => {
            console.error('❌ Error creating seed:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در ثبت بذر',
                confirmButtonColor: '#087e67'
            });
        });
    }
    
    // ==========================================
    // 🗑️ حذف بذر - DELETE /seed/{seed_name}
    // ==========================================
    function deleteSeed(el, seedName) {
        const decodedName = decodeURIComponent(seedName);
        
        Swal.fire({
            title: 'حذف بذر',
            text: `آیا از حذف بذر "${decodedName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, seedName);
            }
        });
    }
    
    function performDelete(el, seedName) {
        const token = getToken();
        
        Swal.fire({
            title: 'در حال حذف...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch(API_BASE_URL + '/seed/' + seedName, {
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
            if (!res.ok) throw new Error('Failed to delete seed');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateSeedCount(document.querySelectorAll('#seedTable tbody tr').length);
                
                Swal.fire({
                    icon: 'success',
                    title: 'حذف شد!',
                    text: 'بذر با موفقیت حذف شد',
                    confirmButtonColor: '#087e67',
                    timer: 1500
                });
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting seed:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در حذف بذر',
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
        const rows = document.querySelectorAll('#seedTable tbody tr');
        
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
    window.SeedModule = {
        loadSeedsData: loadSeedsData,
        loadMeasureUnits: loadMeasureUnits,
        addSeed: addSeed,
        deleteSeed: deleteSeed,
        filterTable: filterTable
    };
    
    console.log('✅ Seed module loaded successfully');
    
    // بارگذاری خودکار
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.querySelector('#seedTable')) {
                loadSeedsData();
            }
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#seedTable')) {
                loadSeedsData();
            }
        }, 100);
    }
    
})();
