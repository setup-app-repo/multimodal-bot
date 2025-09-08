# Русская локализация для Telegram бота

# Общие сообщения
welcome_description = Назначение: чат‑бот с поддержкой контекста и моделей LLM.
current_model =  🤖 Текущая модель: {$model}
current_language =  🌐 Язык: {$lang}
current_plan =  📦 Пакет: {$plan}
current_limits =  ⚡ Лимиты: {$limits}

# Профиль (новые ключи)
profile_title = Профиль
profile_balance = Баланс: {$balance} SP
profile_premium = Премиум: {$status}
yes = Да
no = Нет

# Кнопки профиля
profile_premium_button = ⭐ Премиум
profile_clear_button = 🧹 Сбросить контекст
# Премиум интерфейс
premium_title = ⭐ <b>Премиум — максимум от ИИ за 10 SP</b>
premium_benefits_title = <b>Что даёт:</b>
premium_benefit_1 = <b>• Скидка на платные запросы</b>
premium_benefit_2 = <b>• Приоритет в очереди (быстрее ответы)</b>
premium_benefit_3 = <b>• Повышенные лимиты и доступ к мощным моделям</b>
premium_benefit_4 = <b>• Расширенное контекстное окно (больше истории диалога сохраняется)</b>
premium_benefit_5 = <b>• Поддержка 24/7</b>
premium_benefit_6 = <b>• Гарантированная стабильность даже при пиковых нагрузках</b>
premium_activate_button = ✨ Активировать за 10 SP
premium_back_button = ◀️ Назад
premium_activation_coming_soon = Активация премиума скоро будет доступна

# Премиум — подтверждение покупки
premium_confirm_title = ⭐ <b>Премиум — 10 SP / 30 дней</b>
premium_confirm_benefits_title = <b>Что входит:</b>
premium_confirm_benefit_1 = <code>📉 Скидка на платные запросы</code>
premium_confirm_benefit_2 = <code>⚡ Приоритет в очереди</code>
premium_confirm_benefit_3 = <code>📈 Повышенные лимиты и доступ к мощным моделям</code>
premium_confirm_benefit_4 = <code>🧠 Расширенное контекстное окно</code>
premium_confirm_benefit_5 = <code>👤 Поддержка 24/7</code>
premium_confirm_benefit_6 = <code>🔒 Стабильность даже при пиковых нагрузках</code>
premium_confirm_footer = <b>⬇️ Подтвердите покупку Премиум за 10 SP.</b>
premium_confirm_yes = ✅ Подтвердить покупку
premium_confirm_no = ❌ Отмена

# Премиум — сценарии активации
premium_insufficient_sp = ⚠️ <b>Недостаточно SP</b>
    Нужно: <b>10 SP</b>
    У вас: <b>{$balance} SP</b>
topup_sp_button = 💳 Пополнить SP
premium_activated_success = Премиум активирован! Приятной работы ✨
premium_enable_autorenew_button = Включить автопродление
premium_later_button = Позже
premium_autorenew_enabled = <b>Автопродление включено</b> ✅\n\nОтключить можно в Профиле
premium_autorenew_later_info = Автопродление можно включить позже в Профиль → Премиум

# Подтверждение включения/выключения автопродления
premium_autorenew_confirm_enable = 🔄 Включить автопродление?
    Будем автоматически продлевать подписку и списывать 10 SP в день продления — {$expires_at}.
premium_autorenew_confirm_disable = ⏹ Отключить автопродление?
    После {$expires_at} подписка не продлится автоматически.
premium_autorenew_confirm_yes = ✅ Подтвердить
premium_autorenew_confirm_no = ❌ Отмена

# Премиум — активный статус
premium_active_title = ⭐ <b>Премиум активен</b>
premium_active_text = \n📅 <b>Действует до:</b> {$expires_at}\n⏳ <b>Осталось:</b> {$days_left} дней\n🔄 <b>Автопродление:</b> <b>{$autorenew}</b>\n💰 <b>Баланс:</b> {$balance} SP\n\n<b>Преимущества:</b>\n• Скидка на платные запросы\n• Приоритет в очереди (ответы приходят быстрее)\n• Повышенные лимиты и доступ к мощным моделям\n• Расширенное контекстное окно (больше истории диалога сохраняется)\n• Поддержка 24/7\n• Гарантированная стабильность даже при пиковых нагрузках
premium_extend_30_button = 🔄 Продлить на 30 дней — 10 SP
premium_autorenew_toggle_button_on = ⚙️ Автопродление: {$on}
premium_autorenew_toggle_button_off = ⚙️ Автопродление: {$off}
switch_on = ВКЛ
switch_off = ВЫКЛ

# Подтверждение продления
premium_extend_confirm = 🔁 Подтвердите продление
premium_extend_confirm_yes = ✅ Подтвердить
premium_extend_confirm_no = 🚫 Отменить
premium_extend_success = <b>✅ Продление успешно произведено!</b>\n\n📅 Дата окончания подписки: {$end_date}

# Кнопки меню
help_button = 🛟 Помощь
profile_button = 🪪 Профиль
model_selection_button = 🧠 Выбрать модель
setup_menu_button = Установить кнопку меню
profile_language_button = 🌍 Язык
profile_change_plan_button = Поменять тариф

# Команды
start_command = Запустить бота
help_command = Показать справку
model_command = Выбрать модель
profile_command = Показать ваш профиль
language_command = Выбрать язык интерфейса
clear_command = Очистить историю чата
billing_command = Биллинг и использование

# Справка
help_usage = Как использовать: отправляйте текст/голос/картинку/документ или ссылку на видео — я разберусь и отвечу
help_commands_title = Команды:
help_start = /start — главное меню
help_help = /help — эта справка
help_model = /model — выбор модели
help_profile = /profile — профиль пользователя
help_language = /language — язык интерфейса
help_clear = /clear — очистить контекст
help_billing = /billing — биллинг и использование


help_files = Поддерживаемые файлы (до 15 МБ): PDF, DOCX, PPTX, CSV, текст.
help_photos = Поддерживаемые фотографии: JPG, JPEG, PNG, WEBP.
help_content_rules = Ограничения контента: запрещены незаконные, вредоносные, оскорбительные материалы.

# Поддержка
help_contact_support_button = 🆘 Связаться с поддержкой
support_premium_required = 👤 Связаться с поддержкой можно при активном Premium.
support_open_chat_button = 🆘 Открыть чат поддержки
support_unavailable = Сейчас ссылка на поддержку недоступна. Попробуйте позже.


# Онбординг после выбора языка
onboarding_promo = **Привет, {$first_name}!** 👋\n\n**Я — AI-ассистент SETUP.**\n\n**Текст, фото или голос** — анализирую и превращаю в результат: от идей и планов до аналитики и готовых документов.\n\n🎙 **Голос** → текст, резюме, структурированные идеи\n📸 **Фото** → анализ содержимого, описание, извлечение данных\n🧑‍💻 **Код** → подсказки, разбор ошибок, оптимизация\n✉️ **Бизнес-тексты** → письма, офферы, лендинги, скрипты продаж\n🧭 **Структура** → бриф → ТЗ → план/чек-лист за минуты\n🔎 **Аналитика** → факты, риски, выводы, next steps\n🧩 **Масштабная персонализация** → 50–500 вариантов по шаблону\n🧪 **A/B-тест** → заголовки, первые абзацы, CTA\n📊 **Данные** → извлечение сущностей → Markdown / CSV / JSON\n🌍 **Языки и тон** → RU / EN / ES / PT / FR / DE, единый голос бренда\n\n✨ **Для старта доступны бесплатные модели.**\n🔥 **Для серьёзных задач — платные ИИ:** быстрее, умнее, а с Премиум — ещё дешевле и приоритетнее.\n\n👉 Жмите **«Выбрать модель»** — и поехали 🚀
onboarding_choose_model_button = 🚀 Выбрать модель

# Setup.app меню
setup_menu_started =  🔄 Устанавливаю кнопку меню...
setup_menu_success =  ✅ Кнопка меню установлена
setup_menu_error =  ❌ Не удалось установить кнопку меню. Попробуйте позже.

# Профиль
profile_coming_soon =  👤 Профиль: скоро будет доступен.

# Язык
choose_language = Выберите язык:
start_language_welcome = Добро пожаловать в мультимодального AI-бота! Выберите язык для дальнейшего взаимодействия.
language_english = 🇬🇧 Английский
language_russian = 🇷🇺 Русский
language_spanish = 🇪🇸 Испанский
language_german = 🇩🇪 Немецкий
language_portuguese = 🇵🇹 Португальский
language_french = 🇫🇷 Французский
language_vietnamese = 🇻🇳 Вьетнамский
language_switched = Язык переключён на: {$language}

# Биллинг
billing_coming_soon =  💳 Биллинг: скоро будет доступен.
change_plan_coming_soon =  🔧 Поменять тариф: скоро станет доступно.

# Очистка контекста
clear_confirm =  **Очистить текущий диалог?**
clear_yes_button = ✅ Да, очистить
back_button = ◀️ Назад
context_cleared =  🧹 **Контекст успешно очищен.**

# Выбор модели
select_model =  🤖 Выберите модель для чата:
select_model_title = 
select_model_intro = <b>Выбери модель, чтобы узнать подробнее 👇</b>
select_model_legend = <b>0.01 SP</b> — стоимость за запрос
    
    🧠 — интеллект модели (уровень «ума»)
    🖼 — умеет генерировать фотографии
    🔥 — топ-модель по популярности
model_selected =  ✅ Выбрана модель: {$model}
model_active = Модель активна: {$model}. Цена {$price} SP/запрос. Премиум снижает стоимость запроса.
model_buy_premium_button = ⭐ Купить Премиум
model_close_button = Закрыть
invalid_model = Недопустимая модель

# Возможности модели
model_capabilities_title = ✨ <b>Возможности модели:</b>
capability_text = Текст
capability_photos = Фотографии
capability_files = Файлы
capability_voice = Голосовые сообщения

# Блок подтверждения выбора модели
model_connected_title = 🚀 Ты подключил модель: <b>{$model}</b>!
model_price_line_with_premium = 🔹 <b>Цена: <s>{$price_without} SP</s> → {$price_with} SP / запрос с Премиум ⭐</b>
model_price_line_without_premium =
    🔹 <b>Цена: {$price_without} SP</b>
    🔹 <b>С Премиум {$price_with} SP — меньше расходов и выше приоритет ⭐</b>
model_price_line_free = 🔹 <b>Цена: бесплатно</b>
price_free_short = бесплатно
attachments_double_cost_note = 📎 Вложения (фото/аудио/файлы) удваивают стоимость запроса.
chat_start_hint = 💬 <b>Напиши сообщение в чат или задай вопрос — и я начну работать.</b>

# Ошибки
error_processing_message =  ❌ Произошла ошибка при обработке вашего сообщения.
error_processing_file =  ❌ Произошла ошибка при обработке файла.
error_processing_file_retry =  ⚠️ Ошибка при обработке файла. Попробуйте загрузить файл заново.
unexpected_error =  ⚠️ Произошла непредвиденная ошибка. Попробуйте ещё раз.
insufficient_funds =  ⚠️ Недостаточно средств.
daily_limit_reached =  🚫 Лимит бесплатных запросов на сегодня исчерпан. Повторите завтра или активируйте Премиум.
error_timeout =  ⏳ Превышено время ожидания ответа. Попробуйте ещё раз.
error_rate_limited =  ⏳ Слишком много запросов. Подождите немного и повторите.
service_unavailable =  ⚠️ Сервис временно недоступен или перегружен. Попробуйте позже.

# Предупреждения
warning_select_model_first =  ⚠️ Сначала выбери модель через /model
warning_file_size_limit =  ⚠️ Размер файла превышает лимит 15 МБ.
warning_unsupported_file_type =  ⚠️ Поддерживаются только PDF, DOCX, PPTX, CSV и текстовые файлы до 15 МБ.
warning_unsupported_photo_type =  ⚠️ Поддерживаются только фотографии JPG, JPEG, PNG или WEBP.
warning_select_model_before_file =  ⚠️ Сначала выбери модель через /model, затем отправь файл.
warning_model_no_file_support =  🚫 Текущая модель не поддерживает работу с файлами. Пожалуйста, выбери другую в /model.
warning_model_no_voice_support =  🚫 Эта модель не поддерживает голосовые сообщения. Попробуйте другую модель.
warning_model_no_photo_support =  🚫 Эта модель не поддерживает работу с фотографиями. Попробуйте другую модель.

# Ограничения бесплатной модели
warning_free_model_no_media =  ⚠️ В бесплатной модели поддержка фото/файлов/голосовых сообщений не осуществляется.

# Файлы
file_accepted =  📎 Файл принят! Теперь отправь свой вопрос, и я проанализирую содержимое файла.
file_name =  📄 Имя файла: {$name}
file_size =  📊 Размер: {$size}
file_type =  🔍 Тип: {$type}
file_analyzing =  🔍 Анализирую содержимое файла...

# Обработка файлов
file_processing_error = Ошибка при обработке файла: {$error}
unsupported_file_type = Неподдерживаемый тип файла: {$type}
pdf_text_extraction_error = Ошибка при извлечении текста из PDF: {$error}
docx_text_extraction_error = Ошибка при извлечении текста из DOCX: {$error}
pptx_text_extraction_error = Ошибка при извлечении текста из PPTX: {$error}
csv_parsing_error = Ошибка при парсинге CSV: {$error}

# Текст файлов
pdf_no_text = Текст не найден в PDF файле
docx_no_text = Текст не найден в DOCX файле
pptx_no_text = Текст не найден в PPTX файле
csv_empty = CSV файл пуст или не содержит данных
csv_row = Строка {$index}: {$content}

# Планы
plan_start_limits = 3 вопроса/день и 1 фото
plan_custom_limits = пользовательские ограничения пакета

# Модели
model = Модель
model_not_selected = — не выбрана —

# Изображения
image_description = Описание

# Системные сообщения для файлов
file_content_message = Содержимое загруженного файла:
file_analysis_request = Пожалуйста, проанализируй этот файл и ответь на вопрос пользователя.

# Команды бота (для setMyCommands)
bot_command_start = Запустить бота
bot_command_help = Показать справку
bot_command_model = Выбрать модель
bot_command_profile = Показать профиль
bot_command_language = Выбрать язык
bot_command_clear = Очистить историю
bot_command_billing = Биллинг

# Дополнительные тексты
profile_coming_soon_en =  👤 Profile: coming soon.
billing_coming_soon_en =  💳 Billing: coming soon.

# Разбивка сообщений
message_part = Часть {$current} из {$total}

# Индикатор обработки
processing_request = ⏳ Обрабатываю запрос...

# Уведомления
notification_inactive_recall = {$first_name}, давно не виделись 👋\nНапишите любой запрос — я помогу!
subscription_expiring_3_days = Премиум ⭐ заканчивается через 3 дня — {$premium_expires_at}. Продлите, чтобы сохранить скидки и приоритет.
subscription_expiring_1_day = Премиум ⏳ заканчивается завтра — {$premium_expires_at}. Продлите на 30 дней за 10 SP.
premium_renew_button = 🔁 Продлить
autorenew_failed_insufficient_sp = <b>⚠️ Не удалось продлить Премиум</b>\n\n🔹 Требуется: <b>{$required} SP</b>\n🔹 Текущий баланс: <b>{$balance} SP</b>
autorenew_success = <b>✅ Успешное автопродление</b>\n\n🔹 Новый срок действия: <b>до {$premium_expires_at}</b>\n🔹 Текущий баланс: <b>{$balance} SP</b>
billing_topup_balance_button = 💳 Пополнить баланс
