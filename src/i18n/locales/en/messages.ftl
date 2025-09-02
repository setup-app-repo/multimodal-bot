# English localization for Telegram bot

# General messages
welcome_description = Purpose: chatbot with context support and LLM models.
current_model =  🤖 Current model: {$model}
current_language =  🌐 Language: {$lang}
current_plan =  📦 Plan: {$plan}
current_limits =  ⚡ Limits: {$limits}

# Profile (new keys)
profile_title = Profile
profile_balance = Balance: {$balance} SP
profile_premium = Premium: {$status}
yes = Yes
no = No

# Profile buttons
profile_premium_button = ⭐ Premium
profile_clear_button = 🧹 Clear context
# Premium interface
premium_title = ⭐ Premium — Maximum AI power for 10 SP
premium_benefits_title = What you get:
premium_benefit_1 = • Discount on paid requests
premium_benefit_2 = • Priority queue (faster responses)
premium_benefit_3 = • Higher limits and access to powerful models
premium_activate_button = Activate for 10 SP
premium_back_button = ◀️ Back
premium_activation_coming_soon = Premium activation will be available soon

# Premium — purchase confirmation
premium_confirm_title = ⭐ <b>Premium — 10 SP / 30 days</b>
premium_confirm_benefits_title = <b>What’s included:</b>
premium_confirm_benefit_1 = <code>📉 Discount on paid requests</code>
premium_confirm_benefit_2 = <code>⚡ Priority in the queue</code>
premium_confirm_benefit_3 = <code>📈 Higher limits and access to powerful models</code>
premium_confirm_benefit_4 = <code>🧠 Extended context window</code>
premium_confirm_benefit_5 = <code>👤 24/7 support</code>
premium_confirm_benefit_6 = <code>🔒 Stability even at peak loads</code>
premium_confirm_footer = <b>⬇️ Confirm Premium purchase for 10 SP.</b>
premium_confirm_yes = ✅ Confirm purchase
premium_confirm_no = ❌ Cancel
# Premium — activation scenarios
premium_insufficient_sp = Not enough SP: need 10, you have {$balance}. Top up and try again.
topup_sp_button = 💳 Top up SP
premium_activated_success = Premium activated! Enjoy ✨
premium_enable_autorenew_button = Enable auto-renewal
premium_later_button = Later
premium_autorenew_enabled = Auto-renewal enabled ✅\nWe will charge 10 SP on renewal day — {$expires_at}. You can disable it in Profile → Premium.
premium_autorenew_later_info = You can enable auto-renewal later in Profile → Premium

# Auto-renewal confirmation
premium_autorenew_confirm_enable = 🔄 Enable auto-renewal?
    We will automatically renew your subscription and charge 10 SP on the renewal day — {$expires_at}.
premium_autorenew_confirm_disable = ⏹ Disable auto-renewal?
    After {$expires_at} the subscription will not renew automatically.
premium_autorenew_confirm_yes = ✅ Confirm
premium_autorenew_confirm_no = ❌ Cancel

# Premium — active status
premium_active_title = ⭐ <b>Premium is active</b>
premium_active_text = \n📅 <b>Valid until:</b> {$expires_at}\n⏳ <b>Time left:</b> {$days_left} days\n🔄 <b>Auto-renewal:</b> <b>{$autorenew}</b>\n💰 <b>Balance:</b> {$balance} SP\n\n<b>Benefits:</b>\n• Discount on paid requests\n• Priority in the queue (faster responses)\n• Higher limits and access to powerful models\n• Extended context window (more conversation history is saved)\n• 24/7 support\n• Guaranteed stability even during peak load
premium_extend_30_button = 🔄 Extend for 30 days — 10 SP
premium_autorenew_toggle_button_on = ⚙️ Auto-renewal: {$on}
premium_autorenew_toggle_button_off = ⚙️ Auto-renewal: {$off}
switch_on = ON
switch_off = OFF
# Menu buttons
help_button = Help
profile_button = Profile
model_selection_button = Model Selection
profile_change_plan_button = Change plan
profile_language_button = 🌍 Language

# Commands
start_command = Start the bot
help_command = Show help
model_command = Select model
profile_command = Show your profile
language_command = Choose interface language
clear_command = Clear chat history
billing_command = Billing and usage

# Help
help_usage = How to use: send text/voice/image/document or a video link — I’ll handle it and reply
help_commands_title = Commands:
help_start = /start — main menu
help_help = /help — this help
help_model = /model — select model
help_profile = /profile — user profile
help_language = /language — interface language
help_clear = /clear — clear context
help_billing = /billing — billing and usage


help_files = Supported files (up to 15 MB): PDF, DOCX, PPTX, CSV, text.
help_content_rules = Content restrictions: illegal, harmful, offensive materials are prohibited.

# Support
help_contact_support_button = 🆘 Contact support
support_premium_required = 👤 Contacting support is available with an active Premium.
support_open_chat_button = 🆘 Open support chat
support_unavailable = Support link is unavailable right now. Please try again later.


# Onboarding after language selection
onboarding_promo = **Hi, {$first_name}!** 👋\n\n**I’m the SETUP AI Assistant.**\n\n**Text, photo, or voice** — I analyze and turn it into results: from ideas and plans to analysis and finished documents.\n\n🎙 **Voice** → transcription, summaries, structured ideas\n📸 **Photo** → content analysis, description, data extraction\n🧑‍💻 **Code** → tips, debugging, optimization\n✉️ **Business writing** → emails, offers, landing pages, sales scripts\n🧭 **Structure** → brief → spec → plan/checklist in minutes\n🔎 **Analytics** → facts, risks, conclusions, next steps\n🧩 **Personalization at scale** → 50–500 variations by template\n🧪 **A/B testing** → headlines, first paragraphs, CTAs\n📊 **Data** → entity extraction → Markdown / CSV / JSON\n🌍 **Languages & tone** → RU / EN / ES / PT / FR / DE, one brand voice\n\n✨ **Free models available to start.**\n🔥 **For serious tasks — paid AIs:** faster, smarter, and with Premium — cheaper and prioritized.\n\n👉 Tap **“Choose model”** to begin 🚀
onboarding_choose_model_button = 🚀 Choose model

# Profile
profile_coming_soon =  👤 Profile: coming soon.

# Language
choose_language = Choose language:
start_language_welcome = Welcome to the multimodal AI bot! Please choose your language to continue.
language_english = 🇬🇧 English
language_russian = 🇷🇺 Russian
language_spanish = 🇪🇸 Spanish
language_german = 🇩🇪 German
language_portuguese = 🇵🇹 Portuguese
language_french = 🇫🇷 French
language_switched = Language switched to: {$language}

# Billing
billing_coming_soon =  💳 Billing: coming soon.

# Context clearing
clear_confirm =  **Clear the current chat?**
clear_yes_button = ✅ Yes, clear
back_button = ◀️ Back
context_cleared =  🧹 **Context has been cleared.**

# Model selection
select_model =  🤖 Select a model for chat:
select_model_title = Choose a model (SP/request • 🧠 brain power)
model_active = Model active: {$model}. Price {$price} SP/request. Premium reduces the cost per request.
model_buy_premium_button = ⭐ Buy Premium
model_close_button = Close
model_selected =  ✅ Selected model: {$model}
invalid_model = Invalid model

# Model capabilities
model_capabilities_title = ✨ <b>Model capabilities:</b>
capability_text = Text
capability_photos = Photos
capability_files = Files
capability_voice = Voice messages

# Model selection confirmation block
model_connected_title = 🚀 You connected the model: <b>{$model}</b>!
model_price_line_with_premium = 🔹 <b>Price: <s>{$price_without} SP</s> → {$price_with} SP / request with Premium ⭐</b>
model_price_line_without_premium =
    🔹 <b>Price: {$price_without} SP</b>
    🔹 <b>With Premium — lower cost and higher priority ⭐</b>
model_price_line_free = 🔹 <b>Price: Free</b>
price_free_short = free
attachments_double_cost_note = 📎 Attachments (photos/audio/files) double the cost of the request.
chat_start_hint = 💬 <b>Send a message or ask a question — I’ll get to work.</b>

# Errors
error_processing_message =  ❌ An error occurred while processing your message.
error_processing_file =  ❌ An error occurred while processing the file.
error_processing_file_retry =  ⚠️ Error processing file. Please try uploading the file again.
unexpected_error =  ⚠️ An unexpected error occurred. Please try again.
insufficient_funds =  ⚠️ Insufficient funds.
daily_limit_reached =  🚫 Daily free request limit reached. Try again tomorrow or activate Premium.

# Warnings
warning_select_model_first =  ⚠️ First select a model via /model
warning_file_size_limit =  ⚠️ File size exceeds the 15 MB limit.
warning_unsupported_file_type =  ⚠️ Only PDF, DOCX, PPTX, CSV and text files up to 15 MB are supported.
warning_select_model_before_file =  ⚠️ First select a model via /model, then send the file.
warning_model_no_file_support =  🚫 Current model does not support file processing. Please select another one in /model.
warning_model_no_voice_support =  🚫 This model does not support voice messages. Please try another model.
warning_model_no_photo_support =  🚫 This model does not support photo processing. Please try another model.

# Free model limitations
warning_free_model_no_media =  ⚠️ In the free model, photos/files/voice messages are not supported.

# Files
file_accepted =  📎 File accepted! Now send your question, and I will analyze the file content.
file_name =  📄 File name: {$name}
file_size =  📊 Size: {$size} MB
file_type =  🔍 Type: {$type}
file_analyzing =  🔍 Analyzing file content...

# File processing
file_processing_error = Error processing file: {$error}
unsupported_file_type = Unsupported file type: {$type}
pdf_text_extraction_error = Error extracting text from PDF: {$error}
docx_text_extraction_error = Error extracting text from DOCX: {$error}
pptx_text_extraction_error = Error extracting text from PPTX: {$error}
csv_parsing_error = Error parsing CSV: {$error}

# File text
pdf_no_text = No text found in PDF file
docx_no_text = No text found in DOCX file
pptx_no_text = No text found in PPTX file
csv_empty = CSV file is empty or contains no data
csv_row = Row {$index}: {$content}

# Plans
plan_start_limits = 3 questions/day and 1 photo
plan_custom_limits = custom plan restrictions

# Models
model = Model
model_not_selected = — not selected —

# System messages for files
file_content_message = Content of uploaded file:
file_analysis_request = Please analyze this file and answer the user's question.

# Bot commands (for setMyCommands)
bot_command_start = Start the bot
bot_command_help = Show help
bot_command_model = Select model
bot_command_profile = Show profile
bot_command_language = Choose language
bot_command_clear = Clear history
bot_command_billing = Billing

# Additional texts
profile_coming_soon_en =  👤 Profile: coming soon.
billing_coming_soon_en =  💳 Billing: coming soon.

# Message splitting
message_part = Part {$current} of {$total}

# Processing indicator
processing_request = ⏳ Processing your request...