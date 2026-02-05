
(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function loadData() {
        const token = getToken();
        if (!token) {
            console.warn('⚠️ No token found');
            renderTable([]);
            return Promise.resolve([]);
        }
        
        return fetch(API_BASE_URL + '/pesticide/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load pesticides');
            return res.json();
        })
        .then(data => {
            console.log('✅ Pesticides loaded:', data);
            renderTable(data);
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading pesticides:', err);
            renderTable([]);
            return [];
        });
    }
    
    // ==========================================
    // 📊 بارگذاری واحدها - GET /measure_unit/
    // ==========================================
    function loadMeasureUnits() {
        const token = getToken();
        if (!token) return Promise.resolve([]);
        
        return fetch(API_BASE_URL + '/measure_unit/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
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
    
    function renderTable(data) {
        const tbody = document.querySelector('#poisonTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const items = Array.isArray(data) ? data : (data.items || data.results || []);
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 40px; color: #64748b; text-align: center;">هیچ سمی یافت نشد</td></tr>';
            updateCount(0);
            return;
        }
        
        items.forEach((item) => {
            const row = document.createElement('tr');
            
            // استخراج نام سم
            const pesticideName = item.pesticide_name || item.name || '-';
            
            // استخراج واحد اندازه‌گیری
            let measureUnit = '-';
            if (item.measure_unit) {
                if (typeof item.measure_unit === 'object') {
                    measureUnit = item.measure_unit.name_unit || item.measure_unit.name || '-';
                } else {
                    measureUnit = item.measure_unit;
                }
            } else if (item.measure_unit_name) {
                measureUnit = item.measure_unit_name;
            }
            
            // استخراج تاریخ ایجاد
            let createdDate = '-';
            if (item.created_at) {
                createdDate = formatDate(item.created_at);
            } else if (item.date_created) {
                createdDate = formatDate(item.date_created);
            }
            
            row.innerHTML = `
                <td data-label="نام سم">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-spray-can" style="color: #087e67;"></i>
                        <span class="font-bold">${pesticideName}</span>
                    </div>
                </td>
                <td data-label="مقیاس سنجش">${measureUnit}</td>
                <td data-label="تاریخ ایجاد">${createdDate}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.PoisonPageModule.deleteItem(this, '${encodeURIComponent(pesticideName)}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateCount(items.length);
    }
    
    function updateCount(count) {
        const el = document.getElementById('poisonCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن سم جدید - POST /pesticide/
    // ==========================================
    async function addItem() {
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
            title: 'ثبت سم جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام سم</label>
                        <input id="swal-pesticide" class="swal2-input" placeholder="مثال: گلایفوست" style="width: 90%; margin: 0;">
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
                const pesticide_name = document.getElementById('swal-pesticide').value.trim();
                const measure_unit_id = document.getElementById('swal-measurement').value;
                
                if (!pesticide_name || !measure_unit_id) {
                    Swal.showValidationMessage('لطفاً تمام فیلدها را پر کنید');
                    return false;
                }
                
                return { 
                    pesticide_name: pesticide_name, 
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
        
        fetch(API_BASE_URL + '/pesticide/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create pesticide');
            return res.json();
        })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'سم ثبت شد',
                text: `سم "${data.pesticide_name}" با موفقیت اضافه شد`,
                confirmButtonColor: '#087e67',
                timer: 2000
            });
            loadData();
        })
        .catch(err => {
            console.error('❌ Error creating pesticide:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در ثبت سم',
                confirmButtonColor: '#087e67'
            });
        });
    }
    
    // ==========================================
    // 🗑️ حذف سم - DELETE /pesticide/{pesticide_name}
    // ==========================================
    function deleteItem(el, pesticideName) {
        const decodedName = decodeURIComponent(pesticideName);
        
        Swal.fire({
            title: 'حذف سم',
            text: `آیا از حذف سم "${decodedName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, pesticideName);
            }
        });
    }
    
    function performDelete(el, pesticideName) {
        const token = getToken();
        
        Swal.fire({
            title: 'در حال حذف...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch(API_BASE_URL + '/pesticide/' + pesticideName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete pesticide');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateCount(document.querySelectorAll('#poisonTable tbody tr').length);
                
                Swal.fire({
                    icon: 'success',
                    title: 'حذف شد!',
                    text: 'سم با موفقیت حذف شد',
                    confirmButtonColor: '#087e67',
                    timer: 1500
                });
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting pesticide:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در حذف سم',
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
        const rows = document.querySelectorAll('#poisonTable tbody tr');
        
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
    window.PoisonPageModule = {
        loadData: loadData,
        loadMeasureUnits: loadMeasureUnits,
        addItem: addItem,
        deleteItem: deleteItem,
        filterTable: filterTable
    };
    
    console.log('✅ Pesticide module loaded successfully');
    
    // بارگذاری خودکار
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.querySelector('#poisonTable')) {
                loadData();
            }
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#poisonTable')) {
                loadData();
            }
        }, 100);
    }
    
})();
