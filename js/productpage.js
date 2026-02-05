
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
            return Promise.resolve({ items: [] });
        }
        
        return fetch(API_BASE_URL + '/product/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load products');
            return res.json();
        })
        .then(data => {
            console.log('✅ Products loaded:', data);
            renderTable(data);
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading products:', err);
            renderTable({ items: [] });
            return { items: [] };
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
    
    // ==========================================
    // 📊 بارگذاری سال‌های زراعی - GET /crop-year/
    // ==========================================
    function loadCropYears() {
        const token = getToken();
        if (!token) return Promise.resolve([]);
        
        return fetch(API_BASE_URL + '/crop-year/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load crop years');
            return res.json();
        })
        .then(data => {
            console.log('✅ Crop years loaded:', data);
            return Array.isArray(data) ? data : (data.items || []);
        })
        .catch(err => {
            console.error('❌ Error loading crop years:', err);
            return [];
        });
    }
    
    // ==========================================
    // 🎨 نمایش داده‌ها در جدول
    // ==========================================
    function renderTable(data) {
        const tbody = document.querySelector('#productTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const items = Array.isArray(data) ? data : (data.items || data.results || []);
        
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 40px; color: #64748b; text-align: center;">هیچ کالایی یافت نشد</td></tr>';
            updateCount(0);
            return;
        }
        
        items.forEach((item) => {
            const row = document.createElement('tr');
            
            // استخراج نام کالا
            const productName = item.product_name || item.name || '-';
            
            // استخراج سال زراعی
            let cropYear = '-';
            if (item.crop_year) {
                cropYear = item.crop_year.crop_year_name || item.crop_year;
            } else if (item.crop_year_name) {
                cropYear = item.crop_year_name;
            }
            
            // استخراج تاریخ ایجاد
            let createdDate = '-';
            if (item.created_at) {
                createdDate = formatDate(item.created_at);
            } else if (item.date_created) {
                createdDate = formatDate(item.date_created);
            }
            
            row.innerHTML = `
                <td data-label="نام کالا">
                    <div class="flex items-center justify-center gap-2">
                        <i class="fas fa-box" style="color: #087e67;"></i>
                        <span class="font-bold">${productName}</span>
                    </div>
                </td>
                <td data-label="سال زراعی">${cropYear}</td>
                <td data-label="تاریخ ایجاد">${createdDate}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon edit fas fa-edit" title="ویرایش" onclick="window.ProductPageModule.editItem('${encodeURIComponent(JSON.stringify(item))}')"></i>
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.ProductPageModule.deleteItem(this, '${encodeURIComponent(productName)}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateCount(items.length);
    }
    
    function updateCount(count) {
        const el = document.getElementById('productCount');
        if (el) el.innerText = convertToFarsiNumber(count);
    }
    
    // ==========================================
    // ➕ اضافه کردن کالا جدید - POST /product/
    // ==========================================
    async function addItem() {
        const [measureUnits, cropYears] = await Promise.all([
            loadMeasureUnits(),
            loadCropYears()
        ]);
        
        let measureOptions = '<option value="">انتخاب واحد اندازه‌گیری</option>';
        if (measureUnits.length > 0) {
            measureUnits.forEach(u => {
                const unitName = u.name_unit || u.name || u.unit_name || 'نامشخص';
                const unitId = u.id || u.measure_unit_id;
                measureOptions += `<option value="${unitId}">${unitName}</option>`;
            });
        }
        
        let cropYearOptions = '<option value="">انتخاب سال زراعی</option>';
        if (cropYears.length > 0) {
            cropYears.forEach(year => {
                const yearName = year.crop_year_name || year.name || year.year || 'نامشخص';
                const yearId = year.id || year.crop_year_id;
                cropYearOptions += `<option value="${yearId}">${yearName}</option>`;
            });
        }
        
        Swal.fire({
            title: 'ثبت کالا جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام کالا</label>
                        <input id="swal-product" class="swal2-input" type="text" placeholder="مثال: چغندرقند" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">واحد اندازه‌گیری</label>
                        <select id="swal-measure_unit" class="swal2-input" style="width: 90%; margin: 0; padding: 10px;">
                            ${measureOptions}
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">سال زراعی</label>
                        <select id="swal-crop_year" class="swal2-input" style="width: 90%; margin: 0; padding: 10px;">
                            ${cropYearOptions}
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
                const product_name = document.getElementById('swal-product').value.trim();
                const measure_unit_id = document.getElementById('swal-measure_unit').value;
                const crop_year_id = document.getElementById('swal-crop_year').value;
                
                if (!product_name || !measure_unit_id || !crop_year_id) {
                    Swal.showValidationMessage('لطفاً تمام فیلدها را پر کنید');
                    return false;
                }
                
                return { 
                    product_name: product_name, 
                    measure_unit_id: parseInt(measure_unit_id),
                    crop_year_id: parseInt(crop_year_id)
                };
            }
        }).then(result => {
            if (result.isConfirmed) {
                performAdd(result.value);
            }
        });
    }
    
    function performAdd(productData) {
        const token = getToken();
        
        Swal.fire({
            title: 'در حال ثبت...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch(API_BASE_URL + '/product/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create product');
            return res.json();
        })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'کالا ثبت شد',
                text: `کالا "${productData.product_name}" با موفقیت اضافه شد`,
                confirmButtonColor: '#087e67',
                timer: 2000
            });
            loadData();
        })
        .catch(err => {
            console.error('❌ Error creating product:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در ثبت کالا',
                confirmButtonColor: '#087e67'
            });
        });
    }
    
    // ==========================================
    // ✏️ ویرایش کالا
    // ==========================================
    async function editItem(itemJson) {
        const item = JSON.parse(decodeURIComponent(itemJson));
        
        const [measureUnits, cropYears] = await Promise.all([
            loadMeasureUnits(),
            loadCropYears()
        ]);
        
        let measureOptions = '<option value="">انتخاب واحد اندازه‌گیری</option>';
        if (measureUnits.length > 0) {
            measureUnits.forEach(u => {
                const unitName = u.name_unit || u.name || u.unit_name || 'نامشخص';
                const unitId = u.id || u.measure_unit_id;
                const selected = (item.measure_unit_id === unitId) ? 'selected' : '';
                measureOptions += `<option value="${unitId}" ${selected}>${unitName}</option>`;
            });
        }
        
        let cropYearOptions = '<option value="">انتخاب سال زراعی</option>';
        if (cropYears.length > 0) {
            cropYears.forEach(year => {
                const yearName = year.crop_year_name || year.name || year.year || 'نامشخص';
                const yearId = year.id || year.crop_year_id;
                const selected = (item.crop_year_id === yearId) ? 'selected' : '';
                cropYearOptions += `<option value="${yearId}" ${selected}>${yearName}</option>`;
            });
        }
        
        Swal.fire({
            title: 'ویرایش کالا',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام کالا</label>
                        <input id="swal-product" class="swal2-input" type="text" value="${item.product_name || ''}" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">واحد اندازه‌گیری</label>
                        <select id="swal-measure_unit" class="swal2-input" style="width: 90%; margin: 0; padding: 10px;">
                            ${measureOptions}
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">سال زراعی</label>
                        <select id="swal-crop_year" class="swal2-input" style="width: 90%; margin: 0; padding: 10px;">
                            ${cropYearOptions}
                        </select>
                    </div>
                </div>
            `,
            width: '500px',
            showCancelButton: true,
            confirmButtonText: 'ذخیره',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#087e67',
            preConfirm: () => {
                const product_name = document.getElementById('swal-product').value.trim();
                const measure_unit_id = document.getElementById('swal-measure_unit').value;
                const crop_year_id = document.getElementById('swal-crop_year').value;
                
                if (!product_name || !measure_unit_id || !crop_year_id) {
                    Swal.showValidationMessage('لطفاً تمام فیلدها را پر کنید');
                    return false;
                }
                
                return { 
                    product_name: product_name, 
                    measure_unit_id: parseInt(measure_unit_id),
                    crop_year_id: parseInt(crop_year_id)
                };
            }
        }).then(result => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'info',
                    title: 'توجه',
                    text: 'عملیات ویرایش در حال حاضر پشتیبانی نمی‌شود. لطفاً کالا را حذف و دوباره ایجاد کنید.',
                    confirmButtonColor: '#087e67'
                });
            }
        });
    }
    
    // ==========================================
    // 🗑️ حذف کالا - DELETE /product/{product_name}
    // ==========================================
    function deleteItem(el, productName) {
        const decodedName = decodeURIComponent(productName);
        
        Swal.fire({
            title: 'حذف کالا',
            text: `آیا از حذف کالا "${decodedName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDelete(el, productName);
            }
        });
    }
    
    function performDelete(el, productName) {
        const token = getToken();
        
        Swal.fire({
            title: 'در حال حذف...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch(API_BASE_URL + '/product/' + productName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete product');
            return res.json();
        })
        .then(() => {
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateCount(document.querySelectorAll('#productTable tbody tr').length);
                
                Swal.fire({
                    icon: 'success',
                    title: 'حذف شد!',
                    text: 'کالا با موفقیت حذف شد',
                    confirmButtonColor: '#087e67',
                    timer: 1500
                });
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting product:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'خطا در حذف کالا',
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
        const rows = document.querySelectorAll('#productTable tbody tr');
        
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
    window.ProductPageModule = {
        loadData: loadData,
        loadMeasureUnits: loadMeasureUnits,
        loadCropYears: loadCropYears,
        addItem: addItem,
        editItem: editItem,
        deleteItem: deleteItem,
        filterTable: filterTable
    };
    
    console.log('✅ Product module loaded successfully');
    
    // بارگذاری خودکار در صورت وجود جدول
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.querySelector('#productTable')) {
                loadData();
            }
        });
    } else {
        setTimeout(() => {
            if (document.querySelector('#productTable')) {
                loadData();
            }
        }, 100);
    }
    
})();
