# -*- coding: utf-8 -*-
"""Обробник команди /start"""
import os
from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# Імпортуємо систему логування
from utils.logger import log

router = Router()

@router.message(Command("start"))
async def cmd_start(message: Message):
    """Обробник команди /start - відповідає на команду /start"""
    try:
        user = message.from_user
        user_id = user.id
        
        # Логуємо обробку команди
        log("INFO", f"Обробка /start від користувача {user_id}")
        
        # Текст привітання
        welcome_text = (
            "👋 Вітаю! Це бот для роботи з OLX.\n\n"
            "🔐 Авторизація через логін/пароль\n"
            "➕ Додавання акаунтів OLX\n"
            "💬 Робота з повідомленнями\n\n"
            "Функціонал буде додаватись поступово..."
        )
        
        # URL міні-додатку з .env або значення за замовчуванням
        # Використовуємо базовий URL - GitHub Pages автоматично відкриє index.html
        mini_app_base_url = os.getenv("MINI_APP_URL", "https://vova8359.github.io/olx-bot-mini-app/")
        # Видаляємо слеш в кінці якщо є, щоб не було подвійного слеша
        mini_app_base_url = mini_app_base_url.rstrip('/')
        web_app_url = f"{mini_app_base_url}/"
        
        # Створюємо кнопку для відкриття міні-додатку
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="📱 Відкрити додаток",
                web_app=WebAppInfo(url=web_app_url)
            )]
        ])
        
        # Відправляємо відповідь з кнопкою
        await message.answer(welcome_text, reply_markup=keyboard)
    except Exception as e:
        log("ERROR", f"Помилка обробки /start: {e}")
        try:
            await message.answer("❌ Виникла помилка при обробці команди. Спробуйте пізніше.")
        except Exception:
            pass  # Якщо не вдалося відправити повідомлення - логуємо і продовжуємо

