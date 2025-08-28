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
premium_title = ⭐ Премиум — максимум от ИИ за 10 SP
premium_benefits_title = Что даёт:
premium_benefit_1 = • Скидка на платные запросы
premium_benefit_2 = • Приоритет в очереди (быстрее ответы)
premium_benefit_3 = • Повышенные лимиты и доступ к мощным моделям
premium_activate_button = Активировать за 10 SP
premium_back_button = Назад
premium_activation_coming_soon = Активация премиума скоро будет доступна

# Кнопки меню
help_button = Помощь
profile_button = Профиль
model_selection_button = Выбор модели
setup_menu_button = Установить кнопку меню
profile_language_button = Язык
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
help_title = Справка:
help_commands_title = Команды:
help_start = /start — главное меню
help_help = /help — эта справка
help_model = /model — выбор модели
help_profile = /profile — профиль пользователя
help_language = /language — язык интерфейса
help_clear = /clear — очистить контекст
help_billing = /billing — биллинг и использование

help_context_rules_title = Правила контекста:
help_context_rules_1 = — Храним окно из последних 20 пар «Вопрос–Ответ».
help_context_rules_2 = — /clear полностью очищает историю.
help_context_rules_3 = — Для «Старт» контекст выключен.

help_files = Поддерживаемые файлы (до 15 МБ): PDF, DOCX, PPTX, CSV, текст.
help_models = Доступные модели: OpenAI, DeepSeek, Sonet, GPT Mini, Grok.
help_content_rules = Ограничения контента: запрещены незаконные, вредоносные, оскорбительные материалы.
help_disclaimer = Дисклеймер: ответы предоставляются «как есть» и могут содержать ошибки.

# Онбординг после выбора языка
onboarding_promo = Привет, {$first_name}! 👋\n\nЯ — AI-ассистент SETUP. Сейчас работаю только с текстом — быстро и по делу. Вот чем помогу:\n\n🧑‍💻 Код: подсказки, разбор ошибок, оптимизация\n✉️ Бизнес-тексты: письма, офферы, лендинги, скрипты продаж\n🧭 Структура: бриф → ТЗ → план/чек-лист за минуты\n🔎 Аналитика: факты, риски, выводы, next steps\n🧩 Масштабная персонализация: 50–500 вариантов по шаблону\n🧪 A/B-тест: заголовки, первые абзацы, CTA\n📊 Данные: извлечение сущностей → Markdown/CSV/JSON\n🌍 Языки и тон: RU/EN/ES/PT/FR/DE, единый голос бренда\nДля старта и знакомства с ИИ — бесплатные модели.\n\n🔥 Для серьёзных задач — платные ИИ. Премиум снижает стоимость и даёт приоритет.\n\nНажмите «Выбрать модель» — и поехали 🚀
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
language_switched = Язык переключён на: {$language}

# Биллинг
billing_coming_soon =  💳 Биллинг: скоро будет доступен.
change_plan_coming_soon =  🔧 Поменять тариф: скоро станет доступно.

# Очистка контекста
context_cleared =  🧹 Контекст очищен.

# Выбор модели
select_model =  🤖 Выберите модель для чата:
model_selected =  ✅ Выбрана модель: {$model}
invalid_model = Недопустимая модель

# Ошибки
error_processing_message =  ❌ Произошла ошибка при обработке вашего сообщения.
error_processing_file =  ❌ Произошла ошибка при обработке файла.
error_processing_file_retry =  ⚠️ Ошибка при обработке файла. Попробуйте загрузить файл заново.
unexpected_error =  ⚠️ Произошла непредвиденная ошибка. Попробуйте ещё раз.

# Предупреждения
warning_select_model_first =  ⚠️ Сначала выбери модель через /model
warning_file_size_limit =  ⚠️ Размер файла превышает лимит 15 МБ.
warning_unsupported_file_type =  ⚠️ Поддерживаются только PDF, DOCX, PPTX, CSV и текстовые файлы до 15 МБ.
warning_select_model_before_file =  ⚠️ Сначала выбери модель через /model, затем отправь файл.
warning_model_no_file_support =  🚫 Текущая модель не поддерживает работу с файлами. Пожалуйста, выбери другую в /model.

# Файлы
file_accepted =  📎 Файл принят! Теперь отправь свой вопрос, и я проанализирую содержимое файла.
file_name =  📄 Имя файла: {$name}
file_size =  📊 Размер: {$size} МБ
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
model_deepseek = DeepSeek Chat v3.1
model_gpt5 = GPT-5
model_claude_sonnet = Claude Sonnet 4
model_grok = Grok-4
model_gpt5_mini = GPT-5 Mini
model = Модель
model_not_selected = — не выбрана —

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
