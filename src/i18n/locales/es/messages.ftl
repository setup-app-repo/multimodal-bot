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
premium_activate_button = ✨ Activar por 10 SP
premium_back_button = ◀️ Atrás
premium_activation_coming_soon = La activación premium estará disponible pronto

# Premium — confirmación de compra
premium_confirm_title = ⭐ <b>Premium — 10 SP / 30 días</b>
premium_confirm_benefits_title = <b>Qué incluye:</b>
premium_confirm_benefit_1 = <code>📉 Descuento en solicitudes de pago</code>
premium_confirm_benefit_2 = <code>⚡ Prioridad en la cola</code>
premium_confirm_benefit_3 = <code>📈 Límites aumentados y acceso a modelos potentes</code>
premium_confirm_benefit_4 = <code>🧠 Ventana de contexto ampliada</code>
premium_confirm_benefit_5 = <code>👤 Soporte 24/7</code>
premium_confirm_benefit_6 = <code>🔒 Estabilidad incluso en picos de carga</code>
premium_confirm_footer = <b>⬇️ Confirma la compra de Premium por 10 SP.</b>
premium_confirm_yes = ✅ Confirmar compra
premium_confirm_no = ❌ Cancelar

# Premium — escenarios de activación
premium_insufficient_sp = ⚠️ <b>SP insuficientes</b>
    Necesario: <b>10 SP</b>
    Tienes: <b>{$balance} SP</b>
premium_activated_success = ¡Premium activado! Buen trabajo ✨
premium_enable_autorenew_button = Activar renovación automática
premium_later_button = Más tarde
premium_autorenew_enabled = <b>Renovación automática activada</b> ✅\n\nPuedes desactivarla en Perfil
premium_autorenew_later_info = Puedes activar la renovación automática más tarde en Perfil → Premium

# Confirmación de renovación automática
premium_autorenew_confirm_enable = 🔄 ¿Activar la renovación automática?
    Renovaremos tu suscripción automáticamente y cobraremos 10 SP el día de renovación — {$expires_at}.
premium_autorenew_confirm_disable = ⏹ ¿Desactivar la renovación automática?
    Después de {$expires_at} la suscripción no se renovará automáticamente.
premium_autorenew_confirm_yes = ✅ Confirmar
premium_autorenew_confirm_no = ❌ Cancelar

# Confirmación de extensión
premium_extend_confirm = 🔁 Confirmar renovación
premium_extend_confirm_yes = ✅ Confirmar
premium_extend_confirm_no = 🚫 Cancelar
premium_extend_success = <b>✅ ¡Renovación realizada con éxito!</b>\n\n📅 Fecha de fin de suscripción: {$end_date}

# Premium — estado activo
premium_active_title = ⭐ <b>Premium activo</b>
premium_active_text = \n📅 <b>Válido hasta:</b> {$expires_at}\n⏳ <b>Restan:</b> {$days_left} días\n🔄 <b>Renovación automática:</b> <b>{$autorenew}</b>\n💰 <b>Saldo:</b> {$balance} SP\n\n<b>Beneficios:</b>\n• Descuento en solicitudes de pago\n• Prioridad en la cola (respuestas más rápidas)\n• Límites aumentados y acceso a modelos potentes\n• Ventana de contexto ampliada (se guarda más historial de conversación)\n• Soporte 24/7\n• Estabilidad garantizada incluso en picos de carga
premium_extend_30_button = 🔄 Extender 30 días — 10 SP
premium_autorenew_toggle_button_on = ⚙️ Renovación automática: {$on}
premium_autorenew_toggle_button_off = ⚙️ Renovación automática: {$off}
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
help_usage = Cómo usar: envía texto/voz/imagen/documento o un enlace de video — lo procesaré y responderé
help_commands_title = Comandos:
help_start = /start — menú principal
help_help = /help — esta ayuda
help_model = /model — seleccionar modelo
help_profile = /profile — perfil de usuario
help_language = /language — idioma de la interfaz
help_clear = /clear — limpiar contexto
help_billing = /billing — facturación y uso


help_files = Archivos soportados (hasta 15 MB): PDF, DOCX, PPTX, CSV, texto.
help_photos = Fotos soportadas: JPG, JPEG, PNG, WEBP.
help_content_rules = Restricciones de contenido: prohibidos materiales ilegales, maliciosos, ofensivos.

# Soporte
help_contact_support_button = 🆘 Contactar soporte
support_premium_required = 👤 Puedes contactar con soporte con Premium activo.
support_open_chat_button = 🆘 Abrir chat de soporte
support_unavailable = El enlace de soporte no está disponible ahora. Intenta más tarde.

# Billing/Topping up
topup_sp_button = 💳 Recargar SP


# Onboarding después de seleccionar idioma
onboarding_promo = **¡Hola, {$first_name}!** 👋\n\n**Soy el asistente de IA SETUP.**\n\n**Texto, foto o voz** — analizo y lo convierto en resultados: desde ideas y planes hasta análisis y documentos listos.\n\n🎙 **Voz** → transcripción, resúmenes, ideas estructuradas\n📸 **Foto** → análisis de contenido, descripción, extracción de datos\n🧑‍💻 **Código** → consejos, depuración, optimización\n✉️ **Textos de negocio** → emails, ofertas, landings, guiones de ventas\n🧭 **Estructura** → briefing → especificación → plan/checklist en minutos\n🔎 **Analítica** → hechos, riesgos, conclusiones, próximos pasos\n🧩 **Personalización a escala** → 50–500 variantes por plantilla\n🧪 **A/B test** → titulares, primeros párrafos, CTAs\n📊 **Datos** → extracción de entidades → Markdown / CSV / JSON\n🌍 **Idiomas y tono** → RU / EN / ES / PT / FR / DE, una sola voz de marca\n\n✨ **Modelos gratuitos disponibles para empezar.**\n🔥 **Para tareas serias — IA de pago:** más rápido, más inteligente y con Premium — más barato y con prioridad.\n\n👉 Pulsa **«Elegir modelo»** y vamos 🚀
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
clear_confirm =  **¿Limpiar el chat actual?**
clear_yes_button = ✅ Sí, limpiar
back_button = ◀️ Atrás
context_cleared =  🧹 **Contexto limpiado con éxito.**

# Selección de modelo
select_model =  🤖 Selecciona un modelo para el chat:
select_model_title = 
select_model_intro = <b>Elige un modelo para saber más 👇</b>
select_model_legend = 0.01 SP — costo por solicitud
    🧠 — inteligencia del modelo (nivel de inteligencia)
    🖼 — puede generar imágenes
    🔥 — modelo top por popularidad
model_active = Modelo activo: {$model}. Precio {$price} SP/solicitud. Premium reduce el coste por solicitud.
model_buy_premium_button = ⭐ Comprar Premium
model_close_button = Cerrar
model_selected =  ✅ Modelo seleccionado: **{$model}**
invalid_model = Modelo no válido

# Capacidades del modelo
model_capabilities_title = ✨ <b>Capacidades del modelo:</b>
capability_text = Texto
capability_photos = Fotos
capability_files = Archivos
capability_voice = Mensajes de voz

# Bloque de confirmación de selección de modelo
model_connected_title = 🚀 Has conectado el modelo: <b>{$model}</b>!
model_price_line_with_premium = 🔹 <b>Precio: <s>{$price_without} SP</s> → {$price_with} SP / solicitud con Premium ⭐</b>
model_price_line_without_premium =
    🔹 <b>Precio: {$price_without} SP</b>
    🔹 <b>Con Premium {$price_with} SP — menor costo y mayor prioridad ⭐</b>
model_price_line_free = 🔹 <b>Precio: gratis</b>
price_free_short = gratis
attachments_double_cost_note = 📎 Los adjuntos (fotos/audio/archivos) duplican el costo de la solicitud.
chat_start_hint = 💬 <b>Escribe un mensaje o haz una pregunta — me pondré a trabajar.</b>

# Errores
error_processing_message =  ❌ Ocurrió un error al procesar tu mensaje.
error_processing_file =  ❌ Ocurrió un error al procesar el archivo.
error_processing_file_retry =  ⚠️ Error al procesar el archivo. Intenta subir el archivo nuevamente.
unexpected_error =  ⚠️ Ocurrió un error inesperado. Inténtalo de nuevo.
insufficient_funds =  ⚠️ Fondos insuficientes.
daily_limit_reached =  🚫 Se alcanzó el límite diario de solicitudes gratuitas. Inténtalo mañana o activa Premium.

# Advertencias
warning_select_model_first =  ⚠️ Primero selecciona un modelo a través de /model
warning_file_size_limit =  ⚠️ El tamaño del archivo excede el límite de 15 MB.
warning_unsupported_file_type =  ⚠️ Solo se soportan archivos PDF, DOCX, PPTX, CSV y de texto hasta 15 MB.
warning_unsupported_photo_type =  ⚠️ Solo se admiten fotos JPG, JPEG, PNG o WEBP.
warning_select_model_before_file =  ⚠️ Primero selecciona un modelo a través de /model, luego envía el archivo.
warning_model_no_file_support =  🚫 El modelo actual no soporta trabajo con archivos. Por favor, selecciona otro en /model.
warning_model_no_voice_support =  🚫 Este modelo no soporta mensajes de voz. Por favor, prueba otro modelo.
warning_model_no_photo_support =  🚫 Este modelo no soporta procesamiento de fotos. Por favor, prueba otro modelo.

# Limitaciones del modelo gratuito
warning_free_model_no_media =  ⚠️ En el modelo gratuito no se admiten fotos/archivos/mensajes de voz.

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

# Indicador de procesamiento
processing_request = ⏳ Procesando tu solicitud...

# Notificaciones
notification_inactive_recall = {$first_name}, ¡cuánto tiempo! 👋\nEnvía cualquier consulta — ¡te ayudaré!
subscription_expiring_3_days = Premium ⭐ expira en 3 días — {$premium_expires_at}. Renueva para mantener los descuentos y la prioridad.
subscription_expiring_1_day = Premium ⏳ expira mañana — {$premium_expires_at}. Renueva por 30 días por 10 SP.
autorenew_failed_insufficient_sp = <b>⚠️ No se pudo renovar Premium</b>\n\n🔹 Requerido: <b>{$required} SP</b>\n🔹 Saldo actual: <b>{$balance} SP</b>
autorenew_success = <b>✅ Renovación automática exitosa</b>\n\n🔹 Nuevo vencimiento: <b>hasta {$premium_expires_at}</b>\n🔹 Saldo actual: <b>{$balance} SP</b>
billing_topup_balance_button = 💳 Recargar saldo
premium_renew_button = 🔁 Renovar
