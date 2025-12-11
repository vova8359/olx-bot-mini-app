const API_BASE_URL = CONFIG.API_BASE_URL || '/api';

// State
let state = {
    currentAccountId: null,
    currentConversationId: null,
    accounts: [],
    chats: [],
    currentTab: 'buying', // 'buying' | 'selling'
    pollingInterval: null
};

// DOM Elements
const els = {
    screens: {
        chatList: document.getElementById('screen-chat-list'),
        chat: document.getElementById('screen-chat')
    },
    drawer: {
        el: document.getElementById('account-drawer'),
        overlay: document.getElementById('drawer-overlay'),
        list: document.getElementById('accounts-list'),
        closeBtn: document.getElementById('close-drawer-btn')
    },
    header: {
        menuBtn: document.getElementById('menu-btn'),
        refreshBtn: document.getElementById('refresh-btn'),
        accountName: document.getElementById('current-account-name')
    },
    tabs: document.querySelectorAll('.tab-btn'),
    chatsContainer: document.getElementById('chats-container'),
    chat: {
        backBtn: document.getElementById('back-btn'),
        respondentName: document.getElementById('chat-respondent-name'),
        adTitle: document.getElementById('chat-ad-title'),
        messagesList: document.getElementById('messages-list'),
        input: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn')
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadAccounts();

    // Telegram WebApp setup
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
});

function setupEventListeners() {
    // Drawer
    els.header.menuBtn.addEventListener('click', openDrawer);
    els.drawer.closeBtn.addEventListener('click', closeDrawer);
    els.drawer.overlay.addEventListener('click', closeDrawer);

    // Tabs
    els.tabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.tabs.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentTab = e.target.dataset.tab;
            renderChats();
        });
    });

    // Chat Navigation
    els.chat.backBtn.addEventListener('click', () => {
        showScreen('chatList');
        state.currentConversationId = null;
        stopPolling();
    });

    // Sending Messages
    els.chat.sendBtn.addEventListener('click', sendMessage);
    els.chat.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Refresh
    els.header.refreshBtn.addEventListener('click', () => {
        if (state.currentAccountId) loadChats(state.currentAccountId);
    });
}

// Navigation
function showScreen(screenName) {
    Object.values(els.screens).forEach(el => el.classList.remove('active'));
    els.screens[screenName].classList.add('active');
}

function openDrawer() {
    els.drawer.el.classList.add('open');
    els.drawer.overlay.classList.add('open');
}

function closeDrawer() {
    els.drawer.el.classList.remove('open');
    els.drawer.overlay.classList.remove('open');
}

// API Calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const initData = CONFIG.getInitData();
    if (initData) headers['X-Telegram-Init-Data'] = initData;

    try {
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // alert('Помилка з\'єднання: ' + error.message);
        return null;
    }
}

// Logic
async function loadAccounts() {
    const accounts = await apiCall('/accounts');
    if (accounts && accounts.length > 0) {
        state.accounts = accounts;
        renderAccountsList();
        selectAccount(accounts[0].id);
    } else {
        els.chatsContainer.innerHTML = '<div style="text-align:center; padding:20px;">Немає доступних акаунтів</div>';
    }
}

function renderAccountsList() {
    els.drawer.list.innerHTML = '';
    state.accounts.forEach(acc => {
        const item = document.createElement('div');
        item.className = `account-item ${state.currentAccountId === acc.id ? 'active' : ''}`;
        item.innerHTML = `
            <div class="account-avatar">${acc.profile_name ? acc.profile_name[0].toUpperCase() : 'A'}</div>
            <div class="account-info">
                <div class="account-name">${acc.profile_name || 'Акаунт ' + acc.id}</div>
                <div class="account-status">${acc.account_status}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            selectAccount(acc.id);
            closeDrawer();
        });
        els.drawer.list.appendChild(item);
    });
}

async function selectAccount(accountId) {
    state.currentAccountId = accountId;
    const account = state.accounts.find(a => a.id === accountId);
    if (account) {
        els.header.accountName.textContent = account.profile_name || `Акаунт ${account.id}`;
    }
    renderAccountsList(); // Update active state
    await loadChats(accountId);
}

async function loadChats(accountId) {
    els.chatsContainer.innerHTML = '<div class="loading-spinner"></div>';
    const data = await apiCall(`/chats?account_id=${accountId}`);
    if (data && data.chats) {
        state.chats = data.chats;
        renderChats();
    } else {
        els.chatsContainer.innerHTML = '<div style="text-align:center; padding:20px;">Помилка завантаження чатів</div>';
    }
}

function renderChats() {
    els.chatsContainer.innerHTML = '';

    // Filter chats based on tab
    // Note: We don't have a perfect way to distinguish buying/selling yet from the API
    // For now, we show all chats in both tabs, or we could try to filter if we had the data.
    // Let's assume for now we show all, but in future we will filter.
    // TODO: Implement proper filtering when backend supports it.

    const filteredChats = state.chats; // .filter(...) 

    if (filteredChats.length === 0) {
        els.chatsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Чатів немає</div>';
        return;
    }

    filteredChats.forEach(chat => {
        const card = document.createElement('div');
        card.className = 'chat-card';
        card.innerHTML = `
            <div class="chat-avatar">${chat.respondent_name ? chat.respondent_name[0].toUpperCase() : '?'}</div>
            <div class="chat-details">
                <div class="chat-top-row">
                    <span class="chat-name">${chat.respondent_name || 'Невідомий'}</span>
                    <span class="chat-time">${formatDate(chat.last_activity_at)}</span>
                </div>
                <div class="chat-ad-title">${chat.ad_title || 'Оголошення'}</div>
                <div class="chat-last-msg">Натисніть щоб відкрити...</div> 
            </div>
        `;
        card.addEventListener('click', () => openChat(chat));
        els.chatsContainer.appendChild(card);
    });
}

async function openChat(chat) {
    state.currentConversationId = chat.conversation_id;
    els.chat.respondentName.textContent = chat.respondent_name || 'Невідомий';
    els.chat.adTitle.textContent = chat.ad_title || 'Оголошення';
    els.chat.messagesList.innerHTML = '<div class="loading-spinner"></div>';

    showScreen('chat');

    await loadMessages(chat.conversation_id);
    startPolling();
}

async function loadMessages(conversationId) {
    if (state.currentConversationId !== conversationId) return;

    const data = await apiCall(`/chat?account_id=${state.currentAccountId}&conversation_id=${conversationId}`);
    if (data && data.messages) {
        renderMessages(data.messages);
    }
}

function renderMessages(messages) {
    const container = els.chat.messagesList;
    container.innerHTML = '';

    messages.forEach(msg => {
        const bubble = document.createElement('div');
        const isOutgoing = msg.is_outgoing || msg.direction === 'outgoing';
        bubble.className = `message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`;
        bubble.innerHTML = `
            ${msg.text}
            <div class="message-time">${formatTime(msg.created_at)}</div>
        `;
        container.appendChild(bubble);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const text = els.chat.input.value.trim();
    if (!text || !state.currentAccountId || !state.currentConversationId) return;

    // Optimistic UI update
    const tempMsg = {
        text: text,
        created_at: new Date().toISOString(),
        is_outgoing: true,
        direction: 'outgoing'
    };

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble outgoing';
    bubble.style.opacity = '0.7'; // Pending state
    bubble.innerHTML = `
        ${text}
        <div class="message-time">${formatTime(tempMsg.created_at)}</div>
    `;
    els.chat.messagesList.appendChild(bubble);
    els.chat.messagesList.scrollTop = els.chat.messagesList.scrollHeight;
    els.chat.input.value = '';

    // Send API request
    const result = await apiCall('/send_message', 'POST', {
        account_id: state.currentAccountId,
        conversation_id: state.currentConversationId,
        text: text
    });

    if (result && result.success) {
        bubble.style.opacity = '1';
        // Reload messages to get the real state
        await loadMessages(state.currentConversationId);
    } else {
        bubble.style.backgroundColor = '#ffdddd'; // Error state
        alert('Помилка відправки повідомлення');
    }
}

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function startPolling() {
    stopPolling();
    state.pollingInterval = setInterval(() => {
        if (state.currentConversationId) {
            loadMessages(state.currentConversationId);
        }
    }, 5000); // Poll every 5 seconds
}

function stopPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
}