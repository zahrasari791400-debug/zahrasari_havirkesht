
(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function loadFactories() {
        const token = getToken();
        if (!token) return;
        
        fetch(API_BASE_URL + '/factory/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load factories');
            return res.json();
        })
        .then(data => {
            console.log('✅ Factories loaded:', data);
            renderFactoriesTable(data);
        })
        .catch(err => {
            console.error('❌ Error loading factories:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در دریافت لیست کارخانه‌ها',
                    confirmButtonColor: '#078075'
                });
            }
        });
    }
    
    function renderFactoriesTable(data) {
        const tbody = document.querySelector('#factoryTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const items = data.items || data || [];
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px; color: #64748b;">هیچ کارخانه‌ای یافت نشد</td></tr>';
            updateCount(0);
            return;
        }
        
        items.forEach((factory, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="ردیف">${convertToFarsiNumber(index + 1)}</td>
                <td data-label="نام کارخانه">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-industry" style="color: #087e67;"></i>
                        <span class="font-bold">${factory.factory_name || '-'}</span>
                    </div>
                </td>
                <td data-label="تاریخ ثبت">${factory.created_at || getTodayPersian()}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.FactoryRegisteModule.deleteFactory(this, '${encodeURIComponent(factory.factory_name)}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateCount(items.length);
    }
    
    function updateCount(count) {
        const el = document.getElementById('factoryCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن کارخانه جدید - API ردیف 17
    // POST /factory/
    // Body: { "factory_name": "string" }
    // Response: Success (200)
    // ==========================================
    function addFactory() {
        if (typeof Swal === 'undefined') {
            const factoryName = prompt('نام کارخانه را وارد کنید:');
            if (factoryName) {
                performAdd({ factory_name: factoryName });
            }
            return;
        }
        
        Swal.fire({
            title: 'ثبت کارخانه جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام کارخانه</label>
                        <input id="swal-factory-name" class="swal2-input" placeholder="مثال: کارخانه قند مشهد" style="width: 90%; margin: 0;">
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
                const factory_name = document.getElementById('swal-factory-name').value.trim();
                
                if (!factory_name) {
                    Swal.showValidationMessage('لطفاً نام کارخانه را وارد کنید');
                    return false;
                }
                
                return { factory_name: factory_name };
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
        
        fetch(API_BASE_URL + '/factory/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create factory');
            return res.json();
        })
        .then(() => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'کارخانه ثبت شد',
                    text: `کارخانه "${data.factory_name}" با موفقیت اضافه شد`,
                    confirmButtonColor: '#078075',
                    timer: 2000
                });
            } else {
                alert('کارخانه با موفقیت ثبت شد');
            }
            
            loadFactories();
        })
        .catch(err => {
            console.error('❌ Error creating factory:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در ثبت کارخانه',
                    confirmButtonColor: '#078075'
                });
            } else {
                alert('خطا در ثبت کارخانه');
            }
        });
    }
    
    // ==========================================
    // 🗑️ حذف کارخانه - API ردیف 19
    // DELETE /factory/{factory_name}
    // Response: Success (200)
    // ==========================================
    function deleteFactory(el, factoryName) {
        const decodedName = decodeURIComponent(factoryName);
        
        if (typeof Swal === 'undefined') {
            if (confirm(`آیا از حذف کارخانه "${decodedName}" اطمینان دارید؟`)) {
                performDelete(el, factoryName);
            }
            return;
        }
        
        Swal.fire({
            title: 'حذف کارخانه',
            text: `آیا از حذف کارخانه "${decodedName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, factoryName);
            }
        });
    }
    
    function performDelete(el, factoryName) {
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
        
        fetch(API_BASE_URL + '/factory/' + factoryName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete factory');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateCount(document.querySelectorAll('#factoryTable tbody tr').length);
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'حذف شد!',
                        text: 'کارخانه با موفقیت حذف شد',
                        confirmButtonColor: '#078075',
                        timer: 1500
                    });
                } else {
                    alert('کارخانه با موفقیت حذف شد');
                }
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting factory:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'خطا در حذف کارخانه',
                    confirmButtonColor: '#078075'
                });
            } else {
                alert('خطا در حذف کارخانه');
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
        const rows = document.querySelectorAll('#factoryTable tbody tr');
        
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
    window.FactoryRegisteModule = {
        loadFactories: loadFactories,
        addFactory: addFactory,
        deleteFactory: deleteFactory,
        filterTable: filterTable
    };
    
    console.log('✅ Factory Registration module loaded successfully');
    
    // بارگذاری خودکار
    setTimeout(() => {
        if (document.querySelector('#factoryTable')) {
            loadFactories();
        }
    }, 100);
    
})();
