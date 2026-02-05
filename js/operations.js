

(function() {
    'use strict';
    
    const API_BASE_URL = 'https://edu-api.havirkesht.ir';
    
    function getToken() {
        return localStorage.getItem('access_token');
    }
    
    
    function handleOperationClick(operationType) {
        console.log('🎯 Operation clicked:', operationType);
        
        switch(operationType) {
            case 'قرارداد کشاورزان':
                loadCommitments();
                break;
            case 'بذر کشاورزان':
                loadFarmersSeeds();
                break;
            case 'سم کشاورزان':
                loadFarmersPesticides();
                break;
            case 'بار کشاورزان':
                loadFarmersLoads();
                break;
            case 'ضمانت کشاورزان':
                showComingSoon('ضمانت کشاورزان');
                break;
            case 'پرداختی کشاورزان':
                loadFarmersPayments();
                break;
            case 'تحویل تفاله':
                loadFarmersWasteDeliveries();
                break;
            case 'تحویل شکر':
                loadFarmersSugarDeliveries();
                break;
            default:
                showComingSoon(operationType);
        }
    }
    
    // ==========================================
    // 💡 نمایش پیام "به زودی"
    // ==========================================
    function showComingSoon(title) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                text: 'این بخش در دست توسعه است',
                icon: 'info',
                confirmButtonText: 'متوجه شدم',
                confirmButtonColor: '#087e67'
            });
        } else {
            alert(title + '\nاین بخش در دست توسعه است');
        }
    }
    
    // ==========================================
    // 📋 قرارداد کشاورزان (Commitments)
    // ==========================================
    function loadCommitments() {
        console.log('📋 Loading commitments...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/commitment/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Commitments response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Commitments:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'قرارداد کشاورزان',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد قراردادها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading commitments:', err);
            showError('خطا در بارگذاری قراردادها');
        });
    }
    
    // ==========================================
    // 🌱 بذر کشاورزان (Farmers Seeds)
    // ==========================================
    function loadFarmersSeeds() {
        console.log('🌱 Loading farmers seeds...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/farmers-seed/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Farmers Seeds response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Farmers Seeds:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'بذر کشاورزان',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد رکوردها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading farmers seeds:', err);
            showError('خطا در بارگذاری بذر کشاورزان');
        });
    }
    
    // ==========================================
    // 💧 سم کشاورزان (Farmers Pesticides)
    // ==========================================
    function loadFarmersPesticides() {
        console.log('💧 Loading farmers pesticides...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/farmers-pesticide/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Farmers Pesticides response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Farmers Pesticides:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'سم کشاورزان',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد رکوردها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading farmers pesticides:', err);
            showError('خطا در بارگذاری سم کشاورزان');
        });
    }
    
    // ==========================================
    // 📦 بار کشاورزان (Farmers Loads)
    // ==========================================
    function loadFarmersLoads() {
        console.log('📦 Loading farmers loads...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/farmers_load/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Farmers Loads response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Farmers Loads:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'بار کشاورزان',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد بارها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading farmers loads:', err);
            showError('خطا در بارگذاری بار کشاورزان');
        });
    }
    
    // ==========================================
    // 💰 پرداختی کشاورزان (Farmers Payments)
    // ==========================================
    function loadFarmersPayments() {
        console.log('💰 Loading farmers payments...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/farmers_payment/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Farmers Payments response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Farmers Payments:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'پرداختی کشاورزان',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد پرداخت‌ها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading farmers payments:', err);
            showError('خطا در بارگذاری پرداختی کشاورزان');
        });
    }
    
    // ==========================================
    // 🍬 تحویل شکر (Sugar Deliveries)
    // ==========================================
    function loadFarmersSugarDeliveries() {
        console.log('🍬 Loading sugar deliveries...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/farmers-sugar-delivery/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Sugar Deliveries response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Sugar Deliveries:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'تحویل شکر',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد تحویل‌ها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading sugar deliveries:', err);
            showError('خطا در بارگذاری تحویل شکر');
        });
    }
    
    // ==========================================
    // 🗑️ تحویل تفاله (Waste Deliveries)
    // ==========================================
    function loadFarmersWasteDeliveries() {
        console.log('🗑️ Loading waste deliveries...');
        const token = getToken();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'در حال بارگذاری...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        fetch(API_BASE_URL + '/farmers-waste-delivery/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            console.log('📥 Waste Deliveries response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('✅ Waste Deliveries:', data);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'تحویل تفاله',
                    html: `
                        <div style="text-align: right;">
                            <p>تعداد تحویل‌ها: ${data.total || 0}</p>
                            <p class="text-sm text-gray-600 mt-2">برای مشاهده جزئیات به بخش مربوطه بروید</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#087e67'
                });
            }
        })
        .catch(err => {
            console.error('❌ Error loading waste deliveries:', err);
            showError('خطا در بارگذاری تحویل تفاله');
        });
    }
    
    // ==========================================
    // ❌ نمایش پیام خطا
    // ==========================================
    function showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: message,
                confirmButtonColor: '#087e67'
            });
        } else {
            alert('خطا: ' + message);
        }
    }
    
    // ==========================================
    // Export توابع برای دسترسی global
    // ==========================================
    window.operationModule = {
        handleOperationClick: handleOperationClick,
        loadCommitments: loadCommitments,
        loadFarmersSeeds: loadFarmersSeeds,
        loadFarmersPesticides: loadFarmersPesticides,
        loadFarmersLoads: loadFarmersLoads,
        loadFarmersPayments: loadFarmersPayments,
        loadFarmersSugarDeliveries: loadFarmersSugarDeliveries,
        loadFarmersWasteDeliveries: loadFarmersWasteDeliveries,
        showComingSoon: showComingSoon
    };
    
    // برای سازگاری با کدهای قدیمی
    window.handleClick = handleOperationClick;
    
    console.log('✅ Operations module loaded successfully');
    
})();
