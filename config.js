// Конфігурація міні-додатку
const CONFIG = {
    // URL API - замініть на URL вашого API сервера
    // Для локального тестування: 'http://localhost:8080'
    // Для продакшн: 'https://your-api-domain.com'
    // Якщо API на тому ж сервері що й бот, використовуйте: 'http://YOUR_SERVER_IP:8080'
    // ВАЖЛИВО: Замініть localhost на IP адресу або домен вашого сервера, де працює бот!
    API_BASE_URL: 'http://localhost:8080',
    
    // Налаштування Telegram Web App
    tg: null,
    
    // Ініціалізація Telegram Web App
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
            
            // Встановлюємо тему
            document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', this.tg.themeParams.secondary_bg_color || '#f1f1f1');
            document.documentElement.style.setProperty('--tg-theme-header-bg-color', this.tg.themeParams.header_bg_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-header-text-color', this.tg.themeParams.header_text_color || '#ffffff');
            
            console.log('Telegram Web App ініціалізовано');
            console.log('User:', this.tg.initDataUnsafe?.user);
        } else {
            console.warn('Telegram Web App API не доступний');
        }
    },
    
    // Отримуємо дані користувача
    getUser() {
        return this.tg?.initDataUnsafe?.user || null;
    },
    
    // Отримуємо initData для перевірки на сервері
    getInitData() {
        return this.tg?.initData || '';
    }
};

// Ініціалізуємо при завантаженні
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CONFIG.init());
} else {
    CONFIG.init();
}
