// Головний скрипт міні-додатку
let currentAccountId = null;
let currentConversationId = null;
let accounts = [];
let currentTab = 'buying'; // 'buying' або 'selling'
let allChats = [];

// Ініціалізація
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Міні-додаток завантажується...');
    
    // Налаштування обробників подій
    setupEventListeners();
    
    // Завантажуємо аккаунти
    await loadAccounts();
});

// Налаштування обробників подій
function setupEventListeners() {
    // Вкладки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Кнопка назад
    document.getElementById('back-btn').addEventListener('click', () => {
        showChatsList();
    });
}

// Перемикання вкладок
function switchTab(tab) {
    currentTab = tab;
    
    // Оновлюємо активну вкладку
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Фільтруємо та відображаємо чати
    filterAndDisplayChats();
}

// Фільтрація та відображення чатів
function filterAndDisplayChats() {
    // Поки що показуємо всі чати (потім можна додати фільтрацію по my_ads)
    displayChatsList(allChats);
}

// Завантаження списку аккаунтів
async function loadAccounts() {
    try {
        showLoading();
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/accounts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': CONFIG.getInitData()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        accounts = await response.json();
        
        // Автоматично вибираємо перший аккаунт
        if (accounts.length > 0) {
            currentAccountId = accounts[0].id;
            await loadChats(currentAccountId);
        } else {
            showError('Не знайдено активних аккаунтів');
        }
        
    } catch (error) {
        console.error('Помилка завантаження аккаунтів:', error);
        showError(`Помилка завантаження аккаунтів: ${error.message}`);
    }
}

// Завантаження списку чатів
async function loadChats(accountId) {
    if (!accountId) {
        showError('Виберіть аккаунт');
        return;
    }
    
    try {
        showLoading();
        currentConversationId = null;
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/chats?account_id=${accountId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': CONFIG.getInitData()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        allChats = data.chats || [];
        
        // Відображаємо список чатів
        filterAndDisplayChats();
        showChatsList();
        
    } catch (error) {
        console.error('Помилка завантаження чатів:', error);
        showError(`Помилка завантаження чатів: ${error.message}`);
    }
}

// Відображення списку чатів
function displayChatsList(chats) {
    const container = document.getElementById('chats-list');
    container.innerHTML = '';
    
    if (chats.length === 0) {
        container.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #7f9799;">Немає чатів</div>';
        return;
    }
    
    // Сортуємо чати: спочатку непрочитані
    const sortedChats = [...chats].sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (a.unread_count === 0 && b.unread_count > 0) return 1;
        return 0;
    });
    
    sortedChats.forEach(chat => {
        const chatItem = createChatItem(chat);
        container.appendChild(chatItem);
    });
}

// Створення елемента чату
function createChatItem(chat) {
    const item = document.createElement('div');
    item.className = 'chat-item';
    if (chat.unread_count > 0) {
        item.classList.add('unread');
    }
    
    // Аватар (може бути фото товару)
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    const name = chat.respondent_name || chat.ad_title || '?';
    avatar.textContent = name.charAt(0).toUpperCase();
    
    // Контент
    const content = document.createElement('div');
    content.className = 'chat-content';
    
    // Заголовок
    const headerRow = document.createElement('div');
    headerRow.className = 'chat-header-row';
    
    const nameEl = document.createElement('div');
    nameEl.className = 'chat-name';
    nameEl.textContent = chat.respondent_name || 'Невідомий';
    
    const timeEl = document.createElement('div');
    timeEl.className = 'chat-time';
    if (chat.last_activity_at) {
        timeEl.textContent = formatDate(chat.last_activity_at);
    }
    
    headerRow.appendChild(nameEl);
    headerRow.appendChild(timeEl);
    
    // Прев'ю (назва товару)
    const preview = document.createElement('div');
    preview.className = 'chat-preview';
    preview.textContent = chat.ad_title || 'Без назви';
    
    content.appendChild(headerRow);
    content.appendChild(preview);
    
    // Права частина (закладка)
    const rightSide = document.createElement('div');
    rightSide.className = 'chat-item-right';
    
    const bookmark = document.createElement('button');
    bookmark.className = 'chat-bookmark';
    bookmark.innerHTML = '🔖';
    bookmark.onclick = (e) => {
        e.stopPropagation();
        // TODO: Додати логіку закладки
    };
    
    rightSide.appendChild(bookmark);
    
    item.appendChild(avatar);
    item.appendChild(content);
    item.appendChild(rightSide);
    
    // Обробник кліку
    item.addEventListener('click', () => {
        loadChat(currentAccountId, chat.conversation_id);
    });
    
    return item;
}

// Завантаження конкретного чату
async function loadChat(accountId, conversationId) {
    if (!accountId || !conversationId) {
        showError('Не вказано account_id або conversation_id');
        return;
    }
    
    try {
        showLoading();
        currentConversationId = conversationId;
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat?account_id=${accountId}&conversation_id=${conversationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': CONFIG.getInitData()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        const chat = data.chat || {};
        const messages = data.messages || [];
        
        // Відображаємо чат
        displayChat(chat, messages);
        showChatView();
        
    } catch (error) {
        console.error('Помилка завантаження чату:', error);
        showError(`Помилка завантаження чату: ${error.message}`);
    }
}

// Відображення чату
function displayChat(chat, messages) {
    // Заголовок
    const respondentName = chat.respondent_name || 'Невідомий';
    document.getElementById('chat-title').textContent = respondentName;
    document.getElementById('chat-subtitle').textContent = chat.ad_title || 'Без назви';
    
    // Аватар в заголовку
    const avatarText = document.getElementById('chat-avatar-text');
    avatarText.textContent = respondentName.charAt(0).toUpperCase();
    
    // Інформація про товар
    const productInfo = document.getElementById('product-info');
    if (chat.ad_title) {
        document.getElementById('product-title').textContent = chat.ad_title;
        // TODO: Додати реальну ціну та ID з API
        document.getElementById('product-price').textContent = 'Ціна не вказана';
        document.getElementById('product-id').textContent = '';
        productInfo.style.display = 'block';
    } else {
        productInfo.style.display = 'none';
    }
    
    // Повідомлення
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #7f9799;">Немає повідомлень</div>';
        return;
    }
    
    // Групуємо повідомлення по датах
    let currentDate = null;
    messages.forEach(message => {
        const messageDate = new Date(message.created_at);
        const dateStr = formatDateForSeparator(messageDate);
        
        // Додаємо роздільник дати якщо потрібно
        if (currentDate !== dateStr) {
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            separator.textContent = dateStr;
            container.appendChild(separator);
            currentDate = dateStr;
        }
        
        const messageEl = createMessageElement(message);
        container.appendChild(messageEl);
    });
    
    // Прокручуємо до останнього повідомлення
    container.scrollTop = container.scrollHeight;
}

// Створення елемента повідомлення
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    // Визначаємо напрямок
    const isIncoming = message.direction === 'incoming' || !message.is_outgoing;
    messageDiv.classList.add(isIncoming ? 'incoming' : 'outgoing');
    
    // Буба
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.text || '(пусте повідомлення)';
    
    // Час та статус
    const time = document.createElement('div');
    time.className = 'message-time';
    if (message.created_at) {
        const timeStr = formatTime(message.created_at);
        time.innerHTML = timeStr;
        if (!isIncoming) {
            // Додаємо статус прочитання (галочки)
            time.innerHTML += ' <span class="message-status">✓✓</span>';
        }
    }
    
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(time);
    
    return messageDiv;
}

// Форматування дати для списку чатів
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Сьогодні
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Вчора
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
        return 'Вчора';
    }
    
    // Старіше - формат ДД.ММ
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

// Форматування дати для роздільника
function formatDateForSeparator(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
        return 'СЬОГОДНІ';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
        return 'ВЧОРА';
    }
    
    // Формат: "24 ЛИСТ."
    const months = ['СІЧ', 'ЛЮТ', 'БЕР', 'КВІ', 'ТРА', 'ЧЕР', 'ЛИП', 'СЕР', 'ВЕР', 'ЖОВ', 'ЛИС', 'ГРУ'];
    return `${date.getDate()} ${months[date.getMonth()]}.`;
}

// Форматування часу
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

// Показ завантаження
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error').style.display = 'none';
    document.getElementById('chats-list').style.display = 'none';
    document.getElementById('chats-view').style.display = 'none';
    document.getElementById('chat-view').style.display = 'none';
}

// Показ помилки
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-text').textContent = message;
    document.getElementById('chats-list').style.display = 'none';
    document.getElementById('chats-view').style.display = 'none';
    document.getElementById('chat-view').style.display = 'none';
}

// Показ списку чатів
function showChatsList() {
    currentConversationId = null;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('chats-list').style.display = 'block';
    document.getElementById('chats-view').style.display = 'block';
    document.getElementById('chat-view').style.display = 'none';
}

// Показ екрану чату
function showChatView() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('chats-list').style.display = 'none';
    document.getElementById('chats-view').style.display = 'none';
    document.getElementById('chat-view').style.display = 'flex';
}
