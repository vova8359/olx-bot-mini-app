# -*- coding: utf-8 -*-
"""Головний файл для запуску Telegram бота"""
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv
import os

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage

from handlers.start import router as start_router

# Імпортуємо систему логування
from utils.logger import log

# Завантажуємо змінні з .env файлу (з папки config)
env_path = Path(__file__).parent.parent / "config" / ".env"
load_dotenv(env_path)

# Отримуємо токен бота
BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    log("ERROR", "Помилка: BOT_TOKEN не знайдено в .env файлі!")
    sys.exit(1)

async def main():
    """Головна функція для запуску бота"""
    # Створюємо бота
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    
    # Створюємо FSM storage (для станів користувачів)
    storage = MemoryStorage()
    
    # Створюємо диспетчер (обробляє повідомлення)
    dp = Dispatcher(storage=storage)
    
    # Підключаємо обробник команди /start
    dp.include_router(start_router)
    
    # Видаляємо старі вебхуки (якщо були)
    try:
        await bot.delete_webhook(drop_pending_updates=True)
    except Exception as e:
        log("ERROR", f"Помилка видалення вебхуків: {e}")
    
    log("INFO", "Бот запущено")
    
    # Запускаємо бота (polling - постійне опитування серверів Telegram)
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    except KeyboardInterrupt:
        pass
    finally:
        log("INFO", "Бот зупинено")
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        log("ERROR", f"Критична помилка: {e}")
        sys.exit(1)

