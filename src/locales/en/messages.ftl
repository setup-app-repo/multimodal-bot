# English localization for Telegram bot

# General messages
welcome = 👋 Welcome!
welcome_description = Purpose: chatbot with context support and LLM models.
current_model = 🤖 Current model: {$model}
current_language = 🌐 Language: {$lang}
current_plan = 📦 Plan: {$plan}
current_limits = ⚡ Limits: {$limits}

# Menu buttons
help_button = Help
profile_button = Profile
model_selection_button = Model Selection
profile_change_plan_button = Change plan
profile_language_button = Language

# Commands
start_command = Start the bot
help_command = Show help
model_command = Select model
profile_command = Show your profile
language_command = Choose interface language
clear_command = Clear chat history
billing_command = Billing and usage

# Help
help_title = Help:
help_commands_title = Commands:
help_start = /start — main menu
help_help = /help — this help
help_model = /model — select model
help_profile = /profile — user profile
help_language = /language — interface language
help_clear = /clear — clear context
help_billing = /billing — billing and usage

help_context_rules_title = Context rules:
help_context_rules_1 = — We store a window of the last 20 "Question-Answer" pairs.
help_context_rules_2 = — /clear completely clears the history.
help_context_rules_3 = — For "Start" plan, context is disabled.

help_files = Supported files (up to 15 MB): PDF, DOCX, PPTX, CSV, text.
help_models = Available models: OpenAI, DeepSeek, Sonet, GPT Mini, Grok.
help_content_rules = Content restrictions: illegal, harmful, offensive materials are prohibited.
help_disclaimer = Disclaimer: answers are provided "as is" and may contain errors.

# Profile
profile_coming_soon = 👤 Profile: coming soon.

# Language
choose_language = Choose language:
language_english = English
language_russian = Russian
language_spanish = Spanish
language_german = German
language_portuguese = Portuguese
language_french = French

# Billing
billing_coming_soon = 💳 Billing: coming soon.

# Context clearing
context_cleared = 🧹 Context cleared.

# Model selection
select_model = 🤖 Select a model for chat:
model_selected = ✅ Selected model: {$model}
invalid_model = Invalid model

# Errors
error_processing_message = ❌ An error occurred while processing your message.
error_processing_file = ❌ An error occurred while processing the file.
error_processing_file_retry = ⚠️ Error processing file. Please try uploading the file again.
unexpected_error = ⚠️ An unexpected error occurred. Please try again.

# Warnings
warning_select_model_first = ⚠️ First select a model via /model
warning_file_size_limit = ⚠️ File size exceeds the 15 MB limit.
warning_unsupported_file_type = ⚠️ Only PDF, DOCX, PPTX, CSV and text files up to 15 MB are supported.
warning_select_model_before_file = ⚠️ First select a model via /model, then send the file.
warning_model_no_file_support = 🚫 Current model does not support file processing. Please select another one in /model.

# Files
file_accepted = 📎 File accepted! Now send your question, and I will analyze the file content.
file_name = 📄 File name: {$name}
file_size = 📊 Size: {$size} MB
file_type = 🔍 Type: {$type}
file_analyzing = 🔍 Analyzing file content...

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
model_deepseek = DeepSeek Chat v3.1
model_gpt5 = GPT-5
model_claude_sonnet = Claude Sonnet 4
model_grok = Grok-4
model_gpt5_mini = GPT-5 Mini
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
profile_coming_soon_en = 👤 Profile: coming soon.
billing_coming_soon_en = 💳 Billing: coming soon.