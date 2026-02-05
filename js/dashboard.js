

const API_BASE_URL = 'https://edu-api.havirkesht.ir';


if (!localStorage.getItem('access_token')) {
    window.location.href = 'login.html';
}

function getToken() {
    return localStorage.getItem('access_token');
}


let data = {
    1404: [],
    1403: []
};


async function fetchDashboardData(year) {
    try {
        const token = getToken();
        
        
        const response = await fetch(`${API_BASE_URL}/DashBoard?year=${year}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Dashboard data received:', result);
        
        
        if (result && result.data) {
            data[year] = formatApiData(result.data);
        } else if (Array.isArray(result)) {
            data[year] = formatApiData(result);
        } else {
           
            console.warn('Unexpected API response format:', result);
            data[year] = getDefaultData(year);
        }
        
        return result;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
       
        if (!data[year] || data[year].length === 0) {
            data[year] = getDefaultData(year);
        }
        return null;
    }
}


function formatApiData(apiData) {
    
    if (typeof apiData === 'object' && !Array.isArray(apiData)) {
        return [
            ['جمع بدهی به کشاورزان', formatNumber(apiData.totalDebt || 0) + ' تومان', '💰'],
            ['کل تناژ تحویلی', formatNumber(apiData.totalTonnage || 0) + ' تن', '⚖️'],
            ['تعداد قرارداد', formatNumber(apiData.contractCount || 0), '📋'],
            ['مانده حساب پیمانکار', formatNumber(apiData.contractorBalance || 0) + ' تومان', '💳'],
            ['کارمزد پیمانکار (۱٪)', formatNumber(apiData.contractorCommission || 0) + ' تومان', '💵'],
            ['جمع طلب از کشاورزان', formatNumber(apiData.totalClaim || 0) + ' تومان', '📊'],
            ['مانده تا تسویه', formatNumber(apiData.remainingBalance || 0) + ' تومان', '🔄'],
            ['وضعیت کلی پیمانکار', formatNumber(apiData.contractorStatus || 0) + ' تومان', '📈'],
            ['سود پیمانکار از سم', formatNumber(apiData.pesticideProfit || 0) + ' تومان', '💧'],
            ['سود پیمانکار از بذر', formatNumber(apiData.seedProfit || 0) + ' تومان', '🌱']
        ];
    }
    
    
    if (Array.isArray(apiData)) {
        return apiData;
    }
    
    return [];
}


function formatNumber(num) {
    if (!num) return '۰';
    
   
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return formatted.replace(/\d/g, digit => persianDigits[parseInt(digit)])
                    .replace(/,/g, '٬'); // کامای فارسی
}


function getDefaultData(year) {
    const defaultData = {
        1404: [
            ['جمع بدهی به کشاورزان', '۴۴٬۵۳۰٬۲۰۹٬۶۸۵ تومان', '💰'],
            ['کل تناژ تحویلی', '۱۶٬۰۱۰ تن', '⚖️'],
            ['تعداد قرارداد', '۴۲۹', '📋'],
            ['مانده حساب پیمانکار', '۳٬۸۲۷٬۸۱۴٬۵۵۰ تومان', '💳'],
            ['کارمزد پیمانکار (۱٪)', '۶۶۹٬۷۳۷٬۰۱۳ تومان', '💵'],
            ['جمع طلب از کشاورزان', '۱٬۲۲۱٬۲۵۲٬۷۳۴ تومان', '📊'],
            ['مانده تا تسویه', '۴۳٬۳۰۸٬۹۵۶٬۹۵۱ تومان', '🔄'],
            ['وضعیت کلی پیمانکار', '۳٬۸۲۷٬۸۱۴٬۵۵۰ تومان', '📈'],
            ['سود پیمانکار از سم', '۰ تومان', '💧'],
            ['سود پیمانکار از بذر', '۱٬۲۰۰٬۰۰۰٬۰۰۰ تومان', '🌱']
        ],
        1403: [
            ['جمع بدهی به کشاورزان', '۳۱٬۲۰۰٬۰۰۰٬۰۰۰ تومان', '💰'],
            ['کل تناژ تحویلی', '۱۲٬۵۰۰ تن', '⚖️'],
            ['تعداد قرارداد', '۳۸۰', '📋'],
            ['مانده حساب پیمانکار', '۲٬۹۰۰٬۰۰۰٬۰۰۰ تومان', '💳'],
            ['سود پیمانکار از سم', '۰ تومان', '💧'],
            ['سود پیمانکار از بذر', '۹۰۰٬۰۰۰٬۰۰۰ تومان', '🌱']
        ]
    };
    return defaultData[year] || [];
}


function getCardColor(label) {
    const debtKeywords = ['بدهی'];
    const claimKeywords = ['طلب', 'مانده حساب', 'سود پیمانکار', 'کارمزد', 'وضعیت کلی'];

    for (const kw of debtKeywords) if (label.includes(kw)) return 'text-red-600 card-value';
    for (const kw of claimKeywords) if (label.includes(kw)) return 'text-turquoise card-value';
    return 'text-gray-700 dark:text-gray-300 card-value';
}

async function renderCards(year) {
    const container = document.getElementById('cards');
    if (!container) return;
    
    container.innerHTML = '<div class="col-span-full text-center py-8"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise"></div></div>';
    
    
    await fetchDashboardData(year);
    
    container.innerHTML = '';

    if (!data[year] || data[year].length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">داده‌ای برای نمایش وجود ندارد</div>';
        return;
    }

    data[year]?.forEach((c, i) => {
        const card = document.createElement('div');
        const colorClass = getCardColor(c[0]);
        card.className = 'card p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center justify-center text-center';
        card.innerHTML = `
            <div class="card-icon text-3xl mb-2">${c[2]}</div>
            <div class="card-label text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">${c[0]}</div>
            <div class="card-value text-xl font-bold ${colorClass}">${c[1]}</div>
        `;
        container.appendChild(card);

        // انیمیشن کارت‌ها
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 100);
    });
}


function changeYear() {
    const year = document.getElementById('yearSelect')?.value || 1403;
    renderCards(year);
   
    sessionStorage.setItem('selectedYear', year);
}


function savePageState(page) {
    sessionStorage.setItem('currentPage', page);
}

function loadPageState() {
    return sessionStorage.getItem('currentPage') || 'dashboard';
}


function toggleDark() {
    document.getElementById('body').classList.toggle('dark');
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

// ==========================
// منوهای کشویی
// ==========================
function closeAllMenus(exceptId = '') {
    const menus = ['data','contractor','reports','sms','settings','support'];
    menus.forEach(id => {
        if (id !== exceptId) {
            document.getElementById(id+'-submenu')?.classList.add('hidden');
            document.getElementById(id+'-submenu-icon')?.classList.remove('rotate-90');
        }
    });
}

function toggleDataMenu() {
    closeAllMenus('data');
    document.getElementById('data-submenu')?.classList.toggle('hidden');
    document.getElementById('data-submenu-icon')?.classList.toggle('rotate-90');
}

function toggleContractorMenu() {
    closeAllMenus('contractor');
    document.getElementById('contractor-submenu')?.classList.toggle('hidden');
    document.getElementById('contractor-submenu-icon')?.classList.toggle('rotate-90');
}

function toggleReportsMenu() {
    closeAllMenus('reports');
    document.getElementById('reports-submenu')?.classList.toggle('hidden');
    document.getElementById('reports-submenu-icon')?.classList.toggle('rotate-90');
}

function toggleSmsMenu() {
    closeAllMenus('sms');
    document.getElementById('sms-submenu')?.classList.toggle('hidden');
    document.getElementById('sms-submenu-icon')?.classList.toggle('rotate-90');
}

function toggleSettingsMenu() {
    closeAllMenus('settings');
    document.getElementById('settings-submenu')?.classList.toggle('hidden');
    document.getElementById('settings-submenu-icon')?.classList.toggle('rotate-90');
}

function toggleSupportMenu() {
    closeAllMenus('support');
    document.getElementById('support-submenu')?.classList.toggle('hidden');
    document.getElementById('support-submenu-icon')?.classList.toggle('rotate-90');
}

// ==========================
// مدیریت اسکریپت‌های دینامیک
// ==========================
let loadedScripts = new Set();

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(src)) {
            resolve();
            return;
        }

        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) existingScript.remove();

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => {
            loadedScripts.add(src);
            console.log(`✅ Script loaded: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`❌ Failed to load script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(script);
    });
}

function executeInlineScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.src) {
            loadScript(script.src).catch(err => console.error(err));
        } else {
            try {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
                setTimeout(() => newScript.remove(), 100);
            } catch (error) {
                console.error('Error executing inline script:', error);
            }
        }
    });
}
  // تابع برای toggle منوی پروفایل
        function toggleProfileMenu() {
            const dropdown = document.getElementById('profileDropdown');
            const notificationDropdown = document.getElementById('notificationDropdown');
            
            // بستن منوی اعلان‌ها
            notificationDropdown.classList.remove('active');
            
            // باز/بسته کردن منوی پروفایل
            dropdown.classList.toggle('active');
        }
        
        // تابع برای toggle منوی اعلان‌ها
        function toggleNotifications() {
            const dropdown = document.getElementById('notificationDropdown');
            const profileDropdown = document.getElementById('profileDropdown');
            
            // بستن منوی پروفایل
            profileDropdown.classList.remove('active');
            
            // باز/بسته کردن منوی اعلان‌ها
            dropdown.classList.toggle('active');
        }
        
        // تابع خروج از پروفایل
        function logoutFromProfile() {
            // بستن منو
            document.getElementById('profileDropdown').classList.remove('active');
            
            // فراخوانی تابع خروج اصلی
            logout();
        }
        
        // بستن منوها هنگام کلیک بیرون از آنها
        document.addEventListener('click', function(event) {
            const profileDropdown = document.getElementById('profileDropdown');
            const notificationDropdown = document.getElementById('notificationDropdown');
            
            // بررسی کلیک برای منوی پروفایل
            if (!event.target.closest('.relative')) {
                profileDropdown.classList.remove('active');
                notificationDropdown.classList.remove('active');
            }
        });
        
        // تغییر آیکون دارک مود بر اساس حالت فعلی
        function updateDarkModeIcon() {
            const body = document.getElementById('body');
            const icon = document.getElementById('darkModeIcon');
            
            if (body.classList.contains('dark')) {
                icon.className = 'ri-moon-line';
            } else {
                icon.className = 'ri-sun-line';
            }
        }
        
        // بررسی حالت دارک مود هنگام لود صفحه
        document.addEventListener('DOMContentLoaded', function() {
            updateDarkModeIcon();
        });
        
        // تابع toggleDark را override می‌کنیم
        const originalToggleDark = window.toggleDark || toggleDark;
        window.toggleDark = function() {
            if (typeof originalToggleDark === 'function') {
                originalToggleDark();
            } else {
                document.getElementById('body').classList.toggle('dark');
            }
            updateDarkModeIcon();
        };
// ==========================
// بارگذاری صفحات داخلی
// ==========================
function loadPage(page) {
    const main = document.querySelector('main');
    if (!main) return;

    // ذخیره وضعیت صفحه
    savePageState(page);

    // داشبورد
    if (page === 'dashboard') {
        main.innerHTML = '<div id="cards" class="card-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>';
        const savedYear = sessionStorage.getItem('selectedYear') || 1404;
        if (document.getElementById('yearSelect')) {
            document.getElementById('yearSelect').value = savedYear;
        }
        renderCards(savedYear);
        return;
    }

    const pagesMap = {
        'ثبت استان': { html: 'provinces.html', script: 'js/provinces.js' },
        'ثبت سال زراعی': { html: 'years.html', script: 'js/years.js' },
        'ثبت روستا': { html: 'villages.html', script: 'js/villages.js' },
        'operations': { html: 'operations.html', script: 'js/operations.js' },
               
        'ثبت شهرستان': { html: 'CityRegiste.html', script: 'js/cityregiste.js' },
        'ثبت واحد اندازه‌گیری': { html: 'MeasurementPage.html', script: 'js/measurement.js' },
        'ثبت سم': { html: 'PoisonPage.html', script: 'js/poisonpage.js' },
        'ثبت محصول': { html: 'ProductPage.html', script: 'js/productpage.js' },
        'ثبت بذر': { html: 'SeedPage.html', script: 'js/seed.js' },
        'ثبت کارخانه': { html: 'factoryRegiste.html', script: 'js/factoryregiste.js' },
        'ثبت خودرو': { html: 'registerCar.html', script: 'js/registercar.js' },
        'ثبت راننده': { html: 'registerdriver.html', script: 'js/driver.js' }
    };

    if (pagesMap[page]) {
        const pageConfig = pagesMap[page];
        
        fetch(pageConfig.html)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                return r.text();
            })
            .then(html => {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const bodyContent = temp.querySelector('body');
                const cleanHtml = bodyContent ? bodyContent.innerHTML : html;

                main.innerHTML = cleanHtml;
                main.setAttribute('dir', 'rtl');
                main.style.direction = 'rtl';
                main.style.textAlign = 'right';

                if (pageConfig.script) {
                    loadScript(pageConfig.script)
                        .then(() => {
                            console.log(`✅ Page "${page}" loaded with script`);
                            
                            // فراخوانی تابع بارگذاری داده‌ها بعد از لود اسکریپت
                            setTimeout(() => {
                                if (page === 'ثبت استان' && typeof loadProvinces === 'function') {
                                    loadProvinces();
                                } else if (page === 'ثبت سال زراعی' && typeof loadCropYears === 'function') {
                                    loadCropYears();
                                } else if (page === 'ثبت روستا' && typeof loadVillages === 'function') {
                                    loadVillages();
                                    loadCities();
                                    loadProvinces();
                                }
                                
                                // صفحات جدید - فراخوانی از طریق Module Pattern
                                else if (page === 'ثبت شهرستان' && window.CityRegisteModule) {
                                    window.CityRegisteModule.init();
                                } else if (page === 'ثبت واحد اندازه‌گیری' && window.MeasurementModule) {
                                    window.MeasurementModule.init();
                                } else if (page === 'ثبت سم' && window.PoisonPageModule) {
                                    window.PoisonPageModule.init();
                                } else if (page === 'ثبت محصول' && window.ProductPageModule) {
                                    window.ProductPageModule.init();
                                } else if (page === 'ثبت بذر' && window.SeedModule) {
                                    window.SeedModule.init();
                                } else if (page === 'ثبت کارخانه' && window.FactoryRegisteModule) {
                                    window.FactoryRegisteModule.init();
                                } else if (page === 'ثبت خودرو' && window.RegisterCarModule) {
                                    window.RegisterCarModule.init();
                                } else if (page === 'ثبت راننده' && window.DriverModule) {
                                    window.DriverModule.init();
                                }
                            }, 100);
                            
                            executeInlineScripts(main);
                            activateDynamicEvents(main);
                        })
                        .catch(err => {
                            console.error(`❌ Error loading script for page "${page}":`, err);
                            executeInlineScripts(main);
                            activateDynamicEvents(main);
                        });
                } else {
                    executeInlineScripts(main);
                    activateDynamicEvents(main);
                }
            })
            .catch(err => {
                console.error(`Error loading page "${page}":`, err);
                main.innerHTML = `<p class="text-red-500">خطا در بارگذاری صفحه ${page}</p>`;
            });
        return;
    }

    // صفحات ساده متن
    switch (page) {
        case 'contractor': 
            main.innerHTML = '<h1 class="text-gray-600 dark:text-gray-400 mb-6">این بخش در حال توسعه است و به زودی راه‌اندازی می‌شود</h1>'; 
            break;
        case 'invoices': 
            main.innerHTML = '<h1 class="text-gray-600 dark:text-gray-400 mb-6">این بخش در حال توسعه است و به زودی راه‌اندازی می‌شود</h1>'; 
            break;
        case 'transport': 
            main.innerHTML = '<h1 class="text-gray-600 dark:text-gray-400 mb-6">این بخش در حال توسعه است و به زودی راه‌اندازی می‌شود</h1>'; 
            break;
        case 'مدیریت کاربران': 
            main.innerHTML = '<h1 class="text-gray-600 dark:text-gray-400 mb-6">این بخش در حال توسعه است و به زودی راه‌اندازی می‌شود</h1>'; 
            break;
        case 'تغییر رمز عبور': 
            main.innerHTML = '<h1 class="text-gray-600 dark:text-gray-400 mb-6">این بخش در حال توسعه است و به زودی راه‌اندازی می‌شود</h1>'; 
            break;
        case 'خروج': 
            logout(); 
            break;
        case 'ارتباط با ما': 
            main.innerHTML = '<h1 class="text-2xl font-bold mb-4">ارتباط با ما</h1>'; 
            break;
        default: 
            main.innerHTML = `<div class="text-center"><div class="text-6xl mb-4">🚧</div><h1 class="text-gray-600 dark:text-gray-400 mb-6">این بخش در حال توسعه است و به زودی راه‌اندازی می‌شود</h1></div>`; 
            break;
    }
}

// ==========================
// فعال کردن event ها روی صفحات جدید
// ==========================
function activateDynamicEvents(container) {
    container.querySelectorAll('.my-button').forEach(btn => {
        btn.addEventListener('click', () => alert('کلیک شد'));
    });

    container.querySelectorAll('.operation-card-pro').forEach(card => {
        if (card.dataset.listenerAdded) return;
        card.dataset.listenerAdded = 'true';
        
        card.addEventListener('click', () => {
            const title = card.querySelector('.operation-title-pro')?.textContent || 'عملیات';
            if (typeof handleClick === 'function') {
                handleClick(title);
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: title,
                    text: 'این بخش به زودی راه‌اندازی می‌شود',
                    icon: 'info',
                    confirmButtonText: 'متوجه شدم',
                    confirmButtonColor: '#087e67'
                });
            }
        });
    });

    console.log('✅ Dynamic events activated');
}

// ==========================
// خروج از سیستم (با API)
// ==========================
function logout() {
    const token = getToken();
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (confirm('آیا مطمئن هستید که می‌خواهید از سیستم خارج شوید؟')) {
        fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                access_token: token, 
                refresh_token: refreshToken 
            })
        })
        .then(() => console.log('Logged out'))
        .catch((err) => console.error('Logout error:', err))
        .finally(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }
}

// ==========================
// اجرای اولیه
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard initialized');
    
    // بازیابی صفحه قبلی بعد از رفرش
    const lastPage = loadPageState();
    if (lastPage && lastPage !== 'dashboard') {
        loadPage(lastPage);
    } else {
        const savedYear = sessionStorage.getItem('selectedYear') || 1404;
        renderCards(savedYear);
    }
});
