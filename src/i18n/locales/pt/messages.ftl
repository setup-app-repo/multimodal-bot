# Localização portuguesa para o bot do Telegram

# Mensagens gerais
welcome_description = Propósito: chatbot com suporte de contexto e modelos LLM.
current_model =  🤖 Modelo atual: {$model}
current_language =  🌐 Idioma: {$lang}
current_plan =  📦 Plano: {$plan}
current_limits =  ⚡ Limites: {$limits}

# Perfil (novas chaves)
profile_title = Perfil
profile_balance = Saldo: {$balance} SP
profile_premium = Premium: {$status}
yes = Sim
no = Não

# Botões de perfil
profile_premium_button = ⭐ Premium
profile_clear_button = 🧹 Limpar contexto
# Interface premium
premium_title = ⭐ Premium — Máxima potência de IA por 10 SP
premium_benefits_title = O que você ganha:
premium_benefit_1 = • Desconto em solicitações pagas
premium_benefit_2 = • Prioridade na fila (respostas mais rápidas)
premium_benefit_3 = • Limites aumentados e acesso a modelos poderosos
premium_activate_button = ✨ Ativar por 10 SP
premium_back_button = ◀️ Voltar
premium_activation_coming_soon = A ativação premium estará disponível em breve

# Premium — confirmação de compra
premium_confirm_title = ⭐ <b>Premium — 10 SP / 30 dias</b>
premium_confirm_benefits_title = <b>O que está incluído:</b>
premium_confirm_benefit_1 = <code>📉 Desconto em solicitações pagas</code>
premium_confirm_benefit_2 = <code>⚡ Prioridade na fila</code>
premium_confirm_benefit_3 = <code>📈 Limites aumentados e acesso a modelos poderosos</code>
premium_confirm_benefit_4 = <code>🧠 Janela de contexto estendida</code>
premium_confirm_benefit_5 = <code>👤 Suporte 24/7</code>
premium_confirm_benefit_6 = <code>🔒 Estabilidade mesmo em picos de carga</code>
premium_confirm_footer = <b>⬇️ Confirme a compra do Premium por 10 SP.</b>
premium_confirm_yes = ✅ Confirmar compra
premium_confirm_no = ❌ Cancelar

# Premium — cenários de ativação
premium_insufficient_sp = ⚠️ <b>SP insuficientes</b>
    Necessário: <b>10 SP</b>
    Você tem: <b>{$balance} SP</b>
premium_activated_success = Premium ativado! Bom trabalho ✨
premium_enable_autorenew_button = Ativar renovação automática
premium_later_button = Mais tarde
premium_autorenew_enabled = <b>Renovação automática ativada</b> ✅\n\nVocê pode desativar no Perfil
premium_autorenew_later_info = Você pode ativar a renovação automática mais tarde em Perfil → Premium

# Confirmação de renovação automática
premium_autorenew_confirm_enable = 🔄 Ativar renovação automática?
    Renovaremos sua assinatura automaticamente e cobraremos 10 SP no dia da renovação — {$expires_at}.
premium_autorenew_confirm_disable = ⏹ Desativar renovação automática?
    Após {$expires_at} a assinatura não será renovada automaticamente.
premium_autorenew_confirm_yes = ✅ Confirmar
premium_autorenew_confirm_no = ❌ Cancelar

# Confirmação de renovação
premium_extend_confirm = 🔁 Confirmar renovação
premium_extend_confirm_yes = ✅ Confirmar
premium_extend_confirm_no = 🚫 Cancelar
premium_extend_success = <b>✅ Renovação realizada com sucesso!</b>\n\n📅 Data de término da assinatura: {$end_date}

# Premium — status ativo
premium_active_title = ⭐ <b>Premium ativo</b>
premium_active_text = \n📅 <b>Válido até:</b> {$expires_at}\n⏳ <b>Restante:</b> {$days_left} dias\n🔄 <b>Renovação automática:</b> <b>{$autorenew}</b>\n💰 <b>Saldo:</b> {$balance} SP\n\n<b>Vantagens:</b>\n• Desconto em solicitações pagas\n• Prioridade na fila (respostas mais rápidas)\n• Limites aumentados e acesso a modelos poderosos\n• Janela de contexto estendida (mais histórico de conversa salvo)\n• Suporte 24/7\n• Estabilidade garantida mesmo em picos de carga
premium_extend_30_button = 🔄 Prorrogar por 30 dias — 10 SP
premium_autorenew_toggle_button_on = ⚙️ Renovação automática: {$on}
premium_autorenew_toggle_button_off = ⚙️ Renovação automática: {$off}
switch_on = ATIVADO
switch_off = DESATIVADO
# Botões do menu
help_button = Ajuda
profile_button = Perfil
model_selection_button = Selecionar modelo
profile_language_button = 🌍 Idioma
topup_sp_button = 💳 Recarregar SP
profile_change_plan_button = Alterar plano

# Comandos
start_command = Iniciar bot
help_command = Mostrar ajuda
model_command = Selecionar modelo
profile_command = Mostrar seu perfil
language_command = Selecionar idioma da interface
clear_command = Limpar histórico do chat
billing_command = Cobrança e uso

# Ajuda
help_usage = Como usar: envie texto/voz/imagem/documento ou um link de vídeo — eu resolvo e respondo
help_commands_title = Comandos:
help_start = /start — menu principal
help_help = /help — esta ajuda
help_model = /model — selecionar modelo
help_profile = /profile — perfil do usuário
help_language = /language — idioma da interface
help_clear = /clear — limpar contexto
help_billing = /billing — cobrança e uso


help_files = Arquivos suportados (até 15 MB): PDF, DOCX, PPTX, CSV, texto.
help_photos = Fotos suportadas: JPG, JPEG, PNG, WEBP.
help_content_rules = Restrições de conteúdo: proibidos materiais ilegais, maliciosos, ofensivos.

# Suporte
help_contact_support_button = 🆘 Contatar suporte
support_premium_required = 👤 Contatar o suporte está disponível com Premium ativo.
support_open_chat_button = 🆘 Abrir chat de suporte
support_unavailable = O link de suporte está indisponível no momento. Tente novamente mais tarde.


# Onboarding após seleção de idioma
onboarding_promo = **Oi, {$first_name}!** 👋\n\n**Sou o assistente de IA SETUP.**\n\n**Texto, foto ou voz** — analiso e transformo em resultados: de ideias e planos a análises e documentos prontos.\n\n🎙 **Voz** → transcrição, resumos, ideias estruturadas\n📸 **Foto** → análise de conteúdo, descrição, extração de dados\n🧑‍💻 **Código** → dicas, depuração, otimização\n✉️ **Textos de negócios** → emails, ofertas, landing pages, roteiros de vendas\n🧭 **Estrutura** → briefing → especificação → plano/checklist em minutos\n🔎 **Análise** → fatos, riscos, conclusões, próximos passos\n🧩 **Personalização em escala** → 50–500 variações por template\n🧪 **Teste A/B** → títulos, primeiros parágrafos, CTAs\n📊 **Dados** → extração de entidades → Markdown / CSV / JSON\n🌍 **Idiomas e tom** → RU / EN / ES / PT / FR / DE, uma única voz de marca\n\n✨ **Modelos gratuitos disponíveis para começar.**\n🔥 **Para tarefas sérias — IAs pagas:** mais rápido, mais inteligente e com Premium — ainda mais barato e prioritário.\n\n👉 Toque em **“Escolher modelo”** e vamos 🚀
onboarding_choose_model_button = 🚀 Escolher modelo

# Perfil
profile_coming_soon =  👤 Perfil: em breve disponível.

# Idioma
choose_language = Selecione o idioma:
start_language_welcome = Bem-vindo ao bot de IA multimodal! Escolha seu idioma para continuar.
language_english = 🇬🇧 Inglês
language_russian = 🇷🇺 Russo
language_spanish = 🇪🇸 Espanhol
language_german = 🇩🇪 Alemão
language_portuguese = 🇵🇹 Português
language_french = 🇫🇷 Francês
language_switched = Idioma alterado para: {$language}

# Cobrança
billing_coming_soon =  💰 Cobrança: em breve disponível.
change_plan_coming_soon =  🔧 Alterar plano: em breve disponível.

# Limpeza do contexto
clear_confirm =  **Limpar o chat atual?**
clear_yes_button = ✅ Sim, limpar
back_button = ◀️ Voltar
context_cleared =  🧹 **Contexto limpo com sucesso.**

# Seleção de modelo
select_model =  🤖 Selecione um modelo para o chat:
select_model_title = 
select_model_intro = <b>Escolha um modelo para saber mais 👇</b>
select_model_legend = 0.01 SP — custo por solicitação
    🧠 — inteligência do modelo (nível de "mente")
    🖼 — pode gerar imagens
    🔥 — modelo popular (top)
model_active = Modelo ativo: {$model}. Preço {$price} SP/solicitação. O Premium reduz o custo por solicitação.
model_buy_premium_button = ⭐ Comprar Premium
model_close_button = Fechar
model_selected =  ✅ Modelo selecionado: **{$model}**
invalid_model = Modelo inválido

# Capacidades do modelo
model_capabilities_title = ✨ <b>Capacidades do modelo:</b>
capability_text = Texto
capability_photos = Fotos
capability_files = Arquivos
capability_voice = Mensagens de voz

# Bloco de confirmação de seleção do modelo
model_connected_title = 🚀 Você conectou o modelo: <b>{$model}</b>!
model_price_line_with_premium = 🔹 <b>Preço: <s>{$price_without} SP</s> → {$price_with} SP / solicitação com Premium ⭐</b>
model_price_line_without_premium =
    🔹 <b>Preço: {$price_without} SP</b>
    🔹 <b>Com Premium {$price_with} SP — menor custo e maior prioridade ⭐</b>
model_price_line_free = 🔹 <b>Preço: grátis</b>
price_free_short = grátis
attachments_double_cost_note = 📎 Anexos (fotos/áudio/arquivos) dobram o custo da solicitação.
chat_start_hint = 💬 <b>Envie uma mensagem ou faça uma pergunta — eu começo a trabalhar.</b>

# Erros
error_processing_message =  ❌ Ocorreu um erro ao processar sua mensagem.
error_processing_file =  ❌ Ocorreu um erro ao processar o arquivo.
error_processing_file_retry =  ⚠️ Erro ao processar o arquivo. Tente fazer upload do arquivo novamente.
unexpected_error =  ⚠️ Ocorreu um erro inesperado. Tente novamente.
insufficient_funds =  ⚠️ Fundos insuficientes.

# Avisos
warning_select_model_first =  ⚠️ Primeiro selecione um modelo através de /model
warning_file_size_limit =  ⚠️ O tamanho do arquivo excede o limite de 15 MB.
warning_unsupported_file_type =  ⚠️ Apenas arquivos PDF, DOCX, PPTX, CSV e de texto até 15 MB são suportados.
warning_unsupported_photo_type =  ⚠️ Apenas fotos JPG, JPEG, PNG ou WEBP são suportadas.
warning_select_model_before_file =  ⚠️ Primeiro selecione um modelo através de /model, depois envie o arquivo.
warning_model_no_file_support =  🚫 O modelo atual não suporta trabalho com arquivos. Por favor, selecione outro em /model.
warning_model_no_voice_support =  🚫 Este modelo não suporta mensagens de voz. Por favor, tente outro modelo.
warning_model_no_photo_support =  🚫 Este modelo não suporta processamento de fotos. Por favor, tente outro modelo.

# Limitações do modelo gratuito
warning_free_model_no_media =  ⚠️ No modelo gratuito, fotos/arquivos/mensagens de voz não são suportados.

# Arquivos
file_accepted =  ✅ Arquivo aceito! Agora envie sua pergunta e analisarei o conteúdo do arquivo.
file_name =  📄 Nome do arquivo: {$name}
file_size =  📊 Tamanho: {$size} MB
file_type =  🔧 Tipo: {$type}
file_analyzing =  🔍 Analisando o conteúdo do arquivo...

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
profile_coming_soon_en =  👤 Perfil: em breve disponível.
billing_coming_soon_en =  💳 Cobrança: em breve disponível.

# Divisão de mensagens
message_part = Parte {$current} de {$total}

# Indicador de processamento
processing_request = ⏳ Processando sua solicitação...

# Notificações
notification_inactive_recall = {$first_name}, há quanto tempo 👋\nEnvie qualquer pedido — eu ajudo!
autorenew_failed_insufficient_sp = <b>⚠️ Falha ao renovar o Premium</b>\n\n🔹 Necessário: <b>{$required} SP</b>\n🔹 Saldo atual: <b>{$balance} SP</b>
autorenew_success = <b>✅ Renovação automática bem-sucedida</b>\n\n🔹 Novo prazo: <b>até {$premium_expires_at}</b>\n🔹 Saldo atual: <b>{$balance} SP</b>
billing_topup_balance_button = 💳 Recarregar saldo
subscription_expiring_3_days = Premium ⭐ expira em 3 dias — {$premium_expires_at}. Renove para manter os descontos e a prioridade.
subscription_expiring_1_day = Premium ⏳ expira amanhã — {$premium_expires_at}. Renove por 30 dias por 10 SP.
premium_renew_button = 🔁 Renovar