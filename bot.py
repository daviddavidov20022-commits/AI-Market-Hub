#!/usr/bin/env python3
"""
MarketHub AI Bot — Telegram Bot Backend
Bot: @MarketHubAI_boT
"""

import logging
import json
import os
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters

# ─── CONFIG ─────────────────────────────────────────────────────────────────
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://daviddavidov20022-commits.github.io/AI-Market-Hub/")

# ─── LOGGING ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ─── PRODUCTS (стартовые 3 товара) ───────────────────────────────────────────
PRODUCTS = [
    {
        "id": 1,
        "name": "Беспроводные наушники Pro X",
        "price": 3990,
        "old_price": 5499,
        "description": "Активное шумоподавление ANC, 40ч автономности, кодек aptX HD",
        "emoji": "🎧",
        "category": "Электроника",
        "badge": "🔥 Хит продаж",
        "stock": 24
    },
    {
        "id": 2,
        "name": "Смарт-часы Vision S",
        "price": 6490,
        "old_price": 8999,
        "description": "AMOLED 1.85\", пульсоксиметр, GPS, 7 дней без зарядки",
        "emoji": "⌚",
        "category": "Электроника",
        "badge": "⚡ Новинка",
        "stock": 11
    },
    {
        "id": 3,
        "name": "Механическая клавиатура RGB",
        "price": 4750,
        "old_price": None,
        "description": "Переключатели Cherry MX Red, RGB подсветка, алюминиевый корпус",
        "emoji": "⌨️",
        "category": "Периферия",
        "badge": "✨ Топ выбор",
        "stock": 7
    }
]

# ─── HANDLERS ────────────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    name = user.first_name or "друг"

    keyboard = [
        [InlineKeyboardButton(
            "🛍 Открыть магазин",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [
            InlineKeyboardButton("📦 Каталог", callback_data="catalog"),
            InlineKeyboardButton("🛒 Корзина", callback_data="cart"),
        ],
        [InlineKeyboardButton("📞 Поддержка", callback_data="support")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"👋 Привет, *{name}*!\n\n"
        "🛒 Добро пожаловать в *MarketHub* — твой умный маркетплейс!\n\n"
        "🔥 Сегодня в наличии:\n"
        "• 🎧 Наушники Pro X — *3 990 ₽*\n"
        "• ⌚ Смарт-часы Vision S — *6 490 ₽*\n"
        "• ⌨️ Клавиатура RGB — *4 750 ₽*\n\n"
        "👇 Нажми кнопку, чтобы открыть магазин:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def catalog_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    text = "📦 *Каталог товаров*\n\n"
    for p in PRODUCTS:
        price_line = f"*{p['price']:,} ₽*".replace(",", " ")
        if p["old_price"]:
            price_line += f" ~~{p['old_price']:,} ₽~~".replace(",", " ")
        text += (
            f"{p['emoji']} *{p['name']}*\n"
            f"   {p['badge']}\n"
            f"   💰 {price_line}\n"
            f"   📝 {p['description']}\n"
            f"   📦 Остаток: {p['stock']} шт.\n\n"
        )

    keyboard = [[InlineKeyboardButton("🛍 Открыть в магазине", web_app=WebAppInfo(url=WEBAPP_URL))]]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

async def cart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    keyboard = [[InlineKeyboardButton("🛍 Перейти в магазин", web_app=WebAppInfo(url=WEBAPP_URL))]]
    await query.edit_message_text(
        "🛒 *Ваша корзина пуста*\n\n"
        "Перейдите в магазин, чтобы добавить товары.",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

async def support_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "📞 *Поддержка MarketHub*\n\n"
        "Мы всегда готовы помочь!\n\n"
        "💬 Напишите нам: @MarketHubSupport\n"
        "📧 Email: support@markethub.ai\n"
        "⏰ Работаем: 9:00 – 21:00 МСК",
        parse_mode="Markdown"
    )

async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик данных из Mini App (заказы)."""
    data_str = update.message.web_app_data.data
    try:
        data = json.loads(data_str)
        action = data.get("action", "")

        if action == "order":
            items = data.get("items", [])
            total = data.get("total", 0)
            items_text = "\n".join(
                f"  • {i['name']} × {i['qty']} = {i['total']:,} ₽".replace(",", " ")
                for i in items
            )
            await update.message.reply_text(
                f"✅ *Заказ оформлен!*\n\n"
                f"🛒 Товары:\n{items_text}\n\n"
                f"💰 Итого: *{total:,} ₽*\n\n".replace(",", " ") +
                "📦 Наш менеджер свяжется с вами в течение 15 минут!",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(f"📩 Получены данные: {data_str}")

    except Exception as e:
        logger.error(f"WebApp data error: {e}")
        await update.message.reply_text("❌ Ошибка обработки данных.")

async def products_api(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /products — список в JSON."""
    await update.message.reply_text(
        f"```json\n{json.dumps(PRODUCTS, ensure_ascii=False, indent=2)}\n```",
        parse_mode="Markdown"
    )

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("products", products_api))
    app.add_handler(CallbackQueryHandler(catalog_handler, pattern="^catalog$"))
    app.add_handler(CallbackQueryHandler(cart_handler, pattern="^cart$"))
    app.add_handler(CallbackQueryHandler(support_handler, pattern="^support$"))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data))

    logger.info("🚀 MarketHub Bot запущен!")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
