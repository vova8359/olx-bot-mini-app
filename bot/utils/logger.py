# -*- coding: utf-8 -*-
"""Система логування для бота"""
from datetime import datetime
from pathlib import Path

# Шлях до папки logs (відносно кореня проекту)
LOGS_DIR = Path(__file__).parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Шлях до файлу логів
LOG_FILE = LOGS_DIR / "bot.log"

def log(level: str, message: str):
    """
    Логує повідомлення в консоль та файл
    
    Args:
        level: Рівень логування (INFO, ERROR, WARNING)
        message: Текст повідомлення
    """
    # Вивід в консоль - просто текст без префіксів
    print(message)
    
    # Вивід в файл - з датою та рівнем
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"{timestamp} [{level}] {message}\n"
    
    # Записуємо в файл
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    except Exception:
        pass  # Якщо не вдалося записати в файл - продовжуємо роботу

