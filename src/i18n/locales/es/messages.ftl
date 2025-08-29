# Localización española para el bot de Telegram

# Mensajes generales
welcome_description = Propósito: chatbot con soporte de contexto y modelos LLM.
current_model =  🤖 Modelo actual: {$model}
current_language =  🌐 Idioma: {$lang}
current_plan =  📦 Plan: {$plan}
current_limits =  ⚡ Límites: {$limits}

# Perfil (nuevas claves)
profile_title = Perfil
profile_balance = Saldo: {$balance} SP
profile_premium = Premium: {$status}
yes = Sí
no = No

# Botones de perfil
profile_premium_button = ⭐ Premium
profile_clear_button = 🧹 Limpiar contexto
# Interfaz premium
premium_title = ⭐ Premium — Máxima potencia de IA por 10 SP
premium_benefits_title = Lo que obtienes:
premium_benefit_1 = • Descuento en solicitudes de pago
premium_benefit_2 = • Prioridad en cola (respuestas más rápidas)
premium_benefit_3 = • Límites mejorados y acceso a modelos potentes
premium_activate_button = Activar por 10 SP
premium_back_button = Atrás
premium_activation_coming_soon = La activación premium estará disponible pronto

# Premium — estado activo
premium_active_title = ⭐ Premium activo
premium_active_text = Válido hasta: {$expires_at} — + 30 días\n(restan {$days_left} días)\nRenovación automática: {$autorenew}\nSaldo: {$balance} SP\n\nBeneficios: descuento en solicitudes pagas, prioridad, límites superiores
premium_extend_30_button = Extender 30 días — 10 SP
premium_autorenew_toggle_button_on = Renovación automática: {$on}
premium_autorenew_toggle_button_off = Renovación automática: {$off}
switch_on = ACTIVADO
switch_off = DESACTIVADO
# Botones del menú
help_button = Ayuda
profile_button = Perfil
model_selection_button = Seleccionar modelo
profile_language_button = 🌍 Idioma
profile_change_plan_button = Cambiar plan

# Comandos
start_command = Iniciar bot
help_command = Mostrar ayuda
model_command = Seleccionar modelo
profile_command = Mostrar tu perfil
language_command = Seleccionar idioma de la interfaz
clear_command = Limpiar historial del chat
billing_command = Facturación y uso

# Ayuda
help_title = Ayuda:
help_usage = Cómo usar: envía texto/voz/imagen/documento o un enlace de video — lo procesaré y responderé
help_commands_title = Comandos:
help_start = /start — menú principal
help_help = /help — esta ayuda
help_model = /model — seleccionar modelo
help_profile = /profile — perfil de usuario
help_language = /language — idioma de la interfaz
help_clear = /clear — limpiar contexto
help_billing = /billing — facturación y uso

help_context_rules_title = Reglas del contexto:
help_context_rules_1 = — Mantenemos una ventana de las últimas 20 pares "Pregunta-Respuesta".
help_context_rules_2 = — /clear limpia completamente el historial.
help_context_rules_3 = — Para "Inicio" el contexto está desactivado.

help_files = Archivos soportados (hasta 15 MB): PDF, DOCX, PPTX, CSV, texto.
help_models = Modelos disponibles: OpenAI, DeepSeek, Sonet, GPT Mini, Grok.
help_content_rules = Restricciones de contenido: prohibidos materiales ilegales, maliciosos, ofensivos.
help_disclaimer = Descargo de responsabilidad: las respuestas se proporcionan "tal como están" y pueden contener errores.

# Botón de soporte
help_support_button = 👤 Contactar soporte

# Onboarding después de seleccionar idioma
onboarding_promo = ¡Hola, {$first_name}! 👋\n\nSoy el asistente de IA SETUP. Por ahora solo texto: rápido y al grano. Puedo ayudar con:\n\n🧑‍💻 Código: consejos, depuración, optimización\n✉️ Textos de negocio: emails, ofertas, landings, guiones de ventas\n🧭 Estructura: briefing → especificación → plan/checklist en minutos\n🔎 Análisis: hechos, riesgos, conclusiones, próximos pasos\n🧩 Personalización a escala: 50–500 variantes por plantilla\n🧪 A/B test: titulares, primeros párrafos, CTA\n📊 Datos: extracción de entidades → Markdown/CSV/JSON\n🌍 Idiomas y tono: RU/EN/ES/PT/FR/DE, una sola voz de marca\nModelos gratuitos para empezar y probar la IA.\n\n🔥 Para tareas serias — IA de pago. Premium reduce el costo y da prioridad.\n\nPulsa «Elegir modelo» y vamos 🚀
onboarding_choose_model_button = 🚀 Elegir modelo

# Perfil
profile_coming_soon =  👤 Perfil: próximamente disponible.

# Idioma
choose_language = Selecciona el idioma:
start_language_welcome = ¡Bienvenido al bot de IA multimodal! Elige tu idioma para continuar.
language_english = 🇬🇧 Inglés
language_russian = 🇷🇺 Ruso
language_spanish = 🇪🇸 Español
language_german = 🇩🇪 Alemán
language_portuguese = 🇵🇹 Portugués
language_french = 🇫🇷 Francés
language_switched = Idioma cambiado a: {$language}

# Facturación
billing_coming_soon =  💳 Facturación: próximamente disponible.
change_plan_coming_soon = 🔧 Cambiar plan: próximamente disponible.

# Limpieza del contexto
clear_confirm =  Confirmación: ¿Limpiar el chat actual?
cancel_button = Cancelar
context_cleared =  🧹 Contexto limpiado.

# Selección de modelo
select_model =  🤖 Selecciona un modelo para el chat:
select_model_title = Elige un modelo (SP/solicitud • 🧠 poder mental)
model_active = Modelo activo: {$model}. Precio {$price} SP/solicitud. Premium reduce el coste por solicitud.
model_buy_premium_button = ⭐ Comprar Premium
model_close_button = Cerrar
model_selected =  ✅ Modelo seleccionado: **{$model}**
invalid_model = Modelo no válido

# Errores
error_processing_message =  ❌ Ocurrió un error al procesar tu mensaje.
error_processing_file =  ❌ Ocurrió un error al procesar el archivo.
error_processing_file_retry =  ⚠️ Error al procesar el archivo. Intenta subir el archivo nuevamente.
unexpected_error =  ⚠️ Ocurrió un error inesperado. Inténtalo de nuevo.

# Advertencias
warning_select_model_first =  ⚠️ Primero selecciona un modelo a través de /model
warning_file_size_limit =  ⚠️ El tamaño del archivo excede el límite de 15 MB.
warning_unsupported_file_type =  ⚠️ Solo se soportan archivos PDF, DOCX, PPTX, CSV y de texto hasta 15 MB.
warning_select_model_before_file =  ⚠️ Primero selecciona un modelo a través de /model, luego envía el archivo.
warning_model_no_file_support =  🚫 El modelo actual no soporta trabajo con archivos. Por favor, selecciona otro en /model.

# Archivos
file_accepted =  📎 ¡Archivo aceptado! Ahora envía tu pregunta y analizaré el contenido del archivo.
file_name =  📄 Nombre del archivo: {$name}
file_size =  📊 Tamaño: {$size} MB
file_type =  🔍 Tipo: {$type}
file_analyzing =  🔍 Analizando el contenido del archivo...

# Procesamiento de archivos
file_processing_error = Error al procesar el archivo: {$error}
unsupported_file_type = Tipo de archivo no soportado: {$type}
pdf_text_extraction_error = Error al extraer texto del PDF: {$error}
docx_text_extraction_error = Error al extraer texto del DOCX: {$error}
pptx_text_extraction_error = Error al extraer texto del PPTX: {$error}
csv_parsing_error = Error al analizar CSV: {$error}

# Texto de archivos
pdf_no_text = No se encontró texto en el archivo PDF
docx_no_text = No se encontró texto en el archivo DOCX
pptx_no_text = No se encontró texto en el archivo PPTX
csv_empty = El archivo CSV está vacío o no contiene datos
csv_row = Fila {$index}: {$content}

# Planes
plan_start_limits = 3 preguntas/día y 1 foto
plan_custom_limits = límites personalizados del plan

# Modelos
model = Modelo
model_not_selected = — no seleccionado —

# Mensajes del sistema para archivos
file_content_message = Contenido del archivo cargado:
file_analysis_request = Por favor, analiza este archivo y responde a la pregunta del usuario.

# Comandos del bot (para setMyCommands)
bot_command_start = Iniciar el bot
bot_command_help = Mostrar ayuda
bot_command_model = Seleccionar modelo
bot_command_profile = Mostrar perfil
bot_command_language = Elegir idioma
bot_command_clear = Limpiar historial
bot_command_billing = Facturación

# Textos adicionales
profile_coming_soon_en =  👤 Perfil: próximamente disponible.
billing_coming_soon_en =  💳 Facturación: próximamente disponible.

# División de mensajes
message_part = Parte {$current} de {$total}
