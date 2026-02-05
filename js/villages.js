
(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    let citiesData = [];
    let provincesData = [];
    let isLoading = false;
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function showLoadingState(message = 'در حال بارگذاری...') {
        const container = document.querySelector('#villageTable');
        if (container) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-state';
            loadingDiv.className = 'text-center py-8';
            loadingDiv.innerHTML = `
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mb-4"></div>
                <div class="text-gray-600">${message}</div>
            `;
            
            
            const oldLoading = document.getElementById('loading-state');
            if (oldLoading) oldLoading.remove();
            
            container.parentElement.insertBefore(loadingDiv, container);
        }
    }
    
    function hideLoadingState() {
        const loadingDiv = document.getElementById('loading-state');
        if (loadingDiv) loadingDiv.remove();
    }
    
    // ==========================================
    // 📊 بارگذاری روستاها از API
    // ==========================================
    function loadVillagesData() {
        console.log('📍 Loading villages from API...');
        const token = getToken();
        
        if (!token) {
            console.error('❌ No access token found!');
            return Promise.reject('No token');
        }
        
        return fetch(API_BASE_URL + '/village/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Villages response status:', res.status);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Villages data:', data);
            renderVillagesTable(data);
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading villages:', err);
            showError('خطا در دریافت لیست روستاها');
            throw err;
        });
    }
    
    // ==========================================
    // 🏙️ بارگذاری شهرها
    // ==========================================
    function loadCitiesData() {
        console.log('🏙️ Loading cities from API...');
        const token = getToken();
        
        return fetch(API_BASE_URL + '/city/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Cities response status:', res.status);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Cities data:', data);
            if (data.items) {
                citiesData = data.items;
                populateCityFilter();
            }
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading cities:', err);
            throw err;
        });
    }
    
    // ==========================================
    // 🗺️ بارگذاری استان‌ها
    // ==========================================
    function loadProvincesData() {
        console.log('🗺️ Loading provinces from API...');
        const token = getToken();
        
        return fetch(API_BASE_URL + '/province/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Provinces response status:', res.status);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Provinces data:', data);
            if (data.items) {
                provincesData = data.items;
                populateProvinceFilter(data.items);
            }
            return data;
        })
        .catch(err => {
            console.error('❌ Error loading provinces:', err);
            throw err;
        });
    }
    
    // ==========================================
    // 🚀 بارگذاری همه داده‌ها به ترتیب
    // ==========================================
    function loadAllData() {
        if (isLoading) {
            console.log('⏳ Already loading...');
            return;
        }
        
        isLoading = true;
        console.log('🚀 Starting data load sequence...');
        showLoadingState('در حال بارگذاری استان‌ها...');
        
        // مرحله 1: بارگذاری استان‌ها
        loadProvincesData()
            .then(() => {
                console.log('✅ Step 1/3: Provinces loaded');
                showLoadingState('در حال بارگذاری شهرها...');
                // مرحله 2: بارگذاری شهرها
                return loadCitiesData();
            })
            .then(() => {
                console.log('✅ Step 2/3: Cities loaded');
                showLoadingState('در حال بارگذاری روستاها...');
                // مرحله 3: بارگذاری روستاها
                return loadVillagesData();
            })
            .then(() => {
                console.log('✅ Step 3/3: Villages loaded');
                console.log('🎉 All data loaded successfully!');
                hideLoadingState();
                isLoading = false;
            })
            .catch(err => {
                console.error('❌ Error during data load:', err);
                hideLoadingState();
                showError('خطا در بارگذاری اطلاعات');
                isLoading = false;
            });
    }
    
    // ==========================================
    // 🎨 پر کردن فیلترها
    // ==========================================
    function populateProvinceFilter(provinces) {
        const select = document.getElementById('provinceFilter');
        if (!select) {
            console.warn('⚠️ Province filter not found');
            return;
        }
        
        select.innerHTML = '<option value="">همه استان‌ها</option>';
        
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.province;
            select.appendChild(option);
        });
        
        console.log('✅ Province filter populated with', provinces.length, 'items');
    }
    
    function populateCityFilter() {
        const select = document.getElementById('cityFilter');
        if (!select) {
            console.warn('⚠️ City filter not found');
            return;
        }
        
        select.innerHTML = '<option value="">همه شهرستان‌ها</option>';
        
        citiesData.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.city;
            select.appendChild(option);
        });
        
        console.log('✅ City filter populated with', citiesData.length, 'items');
    }
    
    // ==========================================
    // 🎨 رندر کردن جدول روستاها
    // ==========================================
    function renderVillagesTable(data) {
        console.log('🎨 Rendering villages table...');
        const tbody = document.querySelector('#villageTable tbody');
        if (!tbody) {
            console.error('❌ Table tbody not found!');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!data.items || data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="padding: 40px; color: #64748b;">هیچ روستایی یافت نشد</td></tr>';
            updateVillageCount(0);
            return;
        }
        
        data.items.forEach((village) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="روستا">
                    <div class="village-name">
                        <i class="ri-map-pin-line"></i>
                        <span>${village.village}</span>
                    </div>
                </td>
                <td data-label="تاریخ ایجاد">${village.created_at || getTodayPersian()}</td>
                <td data-label="عملیات">
                    <div class="flex justify-center gap-2">
                        <i class="action-icon edit fas fa-edit" title="ویرایش" onclick="window.villageModule.editVillage(this, '${village.village}')"></i>
                        <i class="action-icon delete fas fa-trash" title="حذف" onclick="window.villageModule.deleteVillage(this, '${village.village}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateVillageCount(data.items.length);
        console.log('✅ Table rendered with', data.items.length, 'villages');
    }
    
    
    function updateVillageCount(count) {
        const countElement = document.getElementById('villageCount');
        if (countElement) {
            countElement.innerText = convertToFarsiNumber(count);
        }
    }
    
    
    function addVillage() {
        console.log('➕ Adding new village...');
        
        if (citiesData.length === 0) {
            showError('لطفاً صبر کنید تا اطلاعات شهرها بارگذاری شود');
            return;
        }
        
        if (typeof Swal === 'undefined') {
            const villageName = prompt('نام روستا را وارد کنید:');
            if (villageName) {
                const cityId = prompt('شناسه شهر را وارد کنید:');
                if (cityId) {
                    performAddVillage(villageName, parseInt(cityId));
                }
            }
            return;
        }
        
       
        let cityOptions = '<option value="">انتخاب کنید</option>';
        citiesData.forEach(city => {
            cityOptions += `<option value="${city.id}">${city.city}</option>`;
        });
        
        Swal.fire({
            title: 'ایجاد روستا جدید',
            html: `
                <div style="text-align: right; padding: 10px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">نام روستا</label>
                        <input id="swal-village-name" class="swal2-input" placeholder="مثال: روستای جدید" style="width: 90%; margin: 0;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155;">شهرستان</label>
                        <select id="swal-city" class="swal2-input" style="width: 90%; margin: 0; padding: 10px;">
                            ${cityOptions}
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ثبت',
            cancelButtonText: 'انصراف',
            confirmButtonColor: '#078075',
            preConfirm: () => {
                const name = document.getElementById('swal-village-name').value;
                const cityId = document.getElementById('swal-city').value;
                if (!name || !cityId) {
                    Swal.showValidationMessage('لطفاً همه فیلدها را پر کنید');
                    return false;
                }
                return { name: name, cityId: parseInt(cityId) };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                performAddVillage(result.value.name, result.value.cityId);
            }
        });
    }
    
    function performAddVillage(villageName, cityId) {
        console.log('💾 Saving village:', villageName, 'City ID:', cityId);
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
        
        fetch(API_BASE_URL + '/village/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                village: villageName,
                city_id: cityId 
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log('✅ Village created:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'روستا ثبت شد',
                    text: `روستا "${villageName}" با موفقیت اضافه شد`,
                    confirmButtonColor: '#078075',
                    timer: 2000
                });
            } else {
                alert('روستا با موفقیت ثبت شد');
            }
            
            loadVillagesData();
        })
        .catch(err => {
            console.error('❌ Error creating village:', err);
            showError('خطا در ثبت روستا');
        });
    }
    
   
    function deleteVillage(el, villageName) {
        console.log('🗑️ Deleting village:', villageName);
        
        if (typeof Swal === 'undefined') {
            if (confirm(`آیا از حذف روستا "${villageName}" اطمینان دارید؟`)) {
                performDeleteVillage(el, villageName);
            }
            return;
        }
        
        Swal.fire({
            title: 'حذف روستا',
            text: `آیا از حذف روستا "${villageName}" اطمینان دارید؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف'
        }).then((result) => {
            if (result.isConfirmed) {
                performDeleteVillage(el, villageName);
            }
        });
    }
    
    function performDeleteVillage(el, villageName) {
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
        
        fetch(API_BASE_URL + '/village/' + villageName, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log('✅ Village deleted:', data);
            
            const row = el.closest('tr');
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                row.remove();
                updateVillageCount(document.querySelectorAll('#villageTable tbody tr').length);
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'حذف شد!',
                        text: 'روستا با موفقیت حذف شد',
                        confirmButtonColor: '#078075',
                        timer: 1500
                    });
                } else {
                    alert('روستا با موفقیت حذف شد');
                }
            }, 300);
        })
        .catch(err => {
            console.error('❌ Error deleting village:', err);
            showError('خطا در حذف روستا');
        });
    }
    
    
    function editVillage(el, villageName) {
        console.log('✏️ Editing village:', villageName);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'ویرایش روستا',
                text: 'API برای ویرایش روستا در مستندات موجود نیست',
                confirmButtonColor: '#078075'
            });
        } else {
            alert('API برای ویرایش روستا در مستندات موجود نیست');
        }
    }
    
   
    function filterVillageTable() {
        const searchInput = document.getElementById('searchInput');
        const provinceFilter = document.getElementById('provinceFilter');
        const cityFilter = document.getElementById('cityFilter');
        
        const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
        const provinceValue = provinceFilter ? provinceFilter.value : '';
        const cityValue = cityFilter ? cityFilter.value : '';
        
        const rows = document.querySelectorAll('#villageTable tbody tr');
        
        rows.forEach(row => {
            const villageName = row.cells[0]?.innerText.toLowerCase() || '';
            const shouldShow = villageName.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
   
    function changeRowsPerPage(value) {
        const rowsPerPage = parseInt(value);
        console.log('📏 Changing rows per page to:', rowsPerPage);
        
        const rows = document.querySelectorAll('#villageTable tbody tr');
        
        rows.forEach((row, index) => {
            if (index < rowsPerPage) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // ذخیره تنظیمات
        sessionStorage.setItem('villageRowsPerPage', rowsPerPage);
    }
    
    
    function refreshData() {
        console.log('🔄 Refreshing all data...');
        loadAllData();
    }
    
    
    function exportVillageData() {
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
    
    
    window.villageModule = {
        loadVillagesData: loadVillagesData,
        loadCitiesData: loadCitiesData,
        loadProvincesData: loadProvincesData,
        loadAllData: loadAllData,
        refreshData: refreshData,
        addVillage: addVillage,
        deleteVillage: deleteVillage,
        editVillage: editVillage,
        filterVillageTable: filterVillageTable,
        changeRowsPerPage: changeRowsPerPage,
        exportVillageData: exportVillageData
    };
    
    
    window.displayVillages = renderVillagesTable;
    window.displayCities = (data) => {
        if (data.items) {
            citiesData = data.items;
            populateCityFilter();
        }
    };
    
    console.log('✅ Villages module loaded successfully');
    
  
    setTimeout(() => {
        if (document.querySelector('#villageTable')) {
           
            console.log('📍 Starting villages page initialization...');
            loadAllData();
        }
    }, 100);
    
})();
