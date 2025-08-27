# Localização portuguesa para o bot do Telegram

# Mensagens gerais
welcome = 👋 Bem-vindo!
welcome_description = Propósito: chatbot com suporte de contexto e modelos LLM.
current_model = 🤖 Modelo atual: {$model}
current_language = 🌐 Idioma: {$lang}
current_plan = 📦 Plano: {$plan}
current_limits = ⚡ Limites: {$limits}

# Botões do menu
help_button = Ajuda
profile_button = Perfil
model_selection_button = Selecionar modelo

# Comandos
start_command = Iniciar bot
help_command = Mostrar ajuda
model_command = Selecionar modelo
profile_command = Mostrar seu perfil
language_command = Selecionar idioma da interface
clear_command = Limpar histórico do chat
billing_command = Cobrança e uso

# Ajuda
help_title = Ajuda:
help_commands_title = Comandos:
help_start = /start — menu principal
help_help = /help — esta ajuda
help_model = /model — selecionar modelo
help_profile = /profile — perfil do usuário
help_language = /language — idioma da interface
help_clear = /clear — limpar contexto
help_billing = /billing — cobrança e uso

help_context_rules_title = Regras do contexto:
help_context_rules_1 = — Mantemos uma janela das últimas 20 pares "Pergunta-Resposta".
help_context_rules_2 = — /clear limpa completamente o histórico.
help_context_rules_3 = — Para "Início" o contexto está desativado.

help_files = Arquivos suportados (até 15 MB): PDF, DOCX, PPTX, CSV, texto.
help_models = Modelos disponíveis: OpenAI, DeepSeek, Sonet, GPT Mini, Grok.
help_content_rules = Restrições de conteúdo: proibidos materiais ilegais, maliciosos, ofensivos.
help_disclaimer = Isenção de responsabilidade: as respostas são fornecidas "como estão" e podem conter erros.

# Perfil
profile_coming_soon = 👤 Perfil: em breve disponível.

# Idioma
choose_language = Selecione o idioma:
language_english = Inglês
language_russian = Russo
language_spanish = Espanhol
language_german = Alemão
language_portuguese = Português
language_french = Francês

# Cobrança
billing_coming_soon = 💰 Cobrança: em breve disponível.

# Limpeza do contexto
context_cleared = 🧹 Contexto limpo.

# Seleção de modelo
select_model = 🤖 Selecione um modelo para o chat:
model_selected = ✅ Modelo selecionado: **{$model}**
invalid_model = Modelo inválido

# Erros
error_processing_message = ❌ Ocorreu um erro ao processar sua mensagem.
error_processing_file = ❌ Ocorreu um erro ao processar o arquivo.
error_processing_file_retry = ⚠️ Erro ao processar o arquivo. Tente fazer upload do arquivo novamente.
unexpected_error = ⚠️ Ocorreu um erro inesperado. Tente novamente.

# Avisos
warning_select_model_first = ⚠️ Primeiro selecione um modelo através de /model
warning_file_size_limit = ⚠️ O tamanho do arquivo excede o limite de 15 MB.
warning_unsupported_file_type = ⚠️ Apenas arquivos PDF, DOCX, PPTX, CSV e de texto até 15 MB são suportados.
warning_select_model_before_file = ⚠️ Primeiro selecione um modelo através de /model, depois envie o arquivo.
warning_model_no_file_support = 🚫 O modelo atual não suporta trabalho com arquivos. Por favor, selecione outro em /model.

# Arquivos
file_accepted = ✅ Arquivo aceito! Agora envie sua pergunta e analisarei o conteúdo do arquivo.
file_name = 📄 Nome do arquivo: {$name}
file_size = 📊 Tamanho: {$size} MB
file_type = 🔧 Tipo: {$type}
file_analyzing = 🔍 Analisando o conteúdo do arquivo...

# Processamento de arquivos
file_processing_error = Erro ao processar o arquivo: {$error}
unsupported_file_type = Tipo de arquivo não suportado: {$type}
pdf_text_extraction_error = Erro ao extrair texto do PDF: {$error}
docx_text_extraction_error = Erro ao extrair texto do DOCX: {$error}
pptx_text_extraction_error = Erro ao extrair texto do PPTX: {$error}
csv_parsing_error = Erro ao analisar CSV: {$error}

# Texto de arquivos
pdf_no_text = Nenhum texto encontrado no arquivo PDF
docx_no_text = Nenhum texto encontrado no arquivo DOCX
pptx_no_text = Nenhum texto encontrado no arquivo PPTX
csv_empty = O arquivo CSV está vazio ou não contém dados
csv_row = Linha {$index}: {$content}

# Planos
plan_start_limits = 3 perguntas/dia e 1 foto
plan_custom_limits = limites personalizados do plano

# Modelos
model_deepseek = DeepSeek Chat v3.1
model_gpt5 = GPT-5
model_claude_sonnet = Claude Sonnet 4
model_grok = Grok-4
model_gpt5_mini = GPT-5 Mini
model = Modelo
model_not_selected = — não selecionado —

# Mensagens do sistema para arquivos
file_content_message = Conteúdo do arquivo carregado:
file_analysis_request = Por favor, analise este arquivo e responda à pergunta do usuário.

# Comandos do bot (para setMyCommands)
bot_command_start = Iniciar o bot
bot_command_help = Mostrar ajuda
bot_command_model = Selecionar modelo
bot_command_profile = Mostrar perfil
bot_command_language = Escolher idioma
bot_command_clear = Limpar histórico
bot_command_billing = Cobrança

# Textos adicionais
profile_coming_soon_en = 👤 Perfil: em breve disponível.
billing_coming_soon_en = 💳 Cobrança: em breve disponível.