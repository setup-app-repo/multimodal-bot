# Deutsche Lokalisierung für den Telegram Bot

# Allgemeine Nachrichten
welcome_description = Zweck: Chatbot mit Kontextunterstützung und LLM-Modellen.
current_model =  🤖 Aktuelles Modell: {$model}
current_language =  🌐 Sprache: {$lang}
current_plan =  📦 Paket: {$plan}
current_limits =  ⚡ Limits: {$limits}

# Profil (neue Schlüssel)
profile_title = Profil
profile_balance = Guthaben: {$balance} SP
profile_premium = Premium: {$status}
yes = Ja
no = Nein

# Profil-Buttons
profile_premium_button = ⭐ Premium
profile_clear_button = 🧹 Kontext löschen
# Premium-Benutzeroberfläche
premium_title = ⭐ Premium — Maximale KI-Power für 10 SP
premium_benefits_title = Was Sie erhalten:
premium_benefit_1 = • Rabatt auf bezahlte Anfragen
premium_benefit_2 = • Priorität in der Warteschlange (schnellere Antworten)
premium_benefit_3 = • Höhere Limits und Zugang zu leistungsstarken Modellen
premium_activate_button = ✨ Für 10 SP aktivieren
premium_back_button = ◀️ Zurück
premium_activation_coming_soon = Premium-Aktivierung wird bald verfügbar sein

# Premium — Kaufbestätigung
premium_confirm_title = ⭐ <b>Premium — 10 SP / 30 Tage</b>
premium_confirm_benefits_title = <b>Was enthalten ist:</b>
premium_confirm_benefit_1 = <code>📉 Rabatt auf kostenpflichtige Anfragen</code>
premium_confirm_benefit_2 = <code>⚡ Priorität in der Warteschlange</code>
premium_confirm_benefit_3 = <code>📈 Höhere Limits und Zugang zu leistungsstarken Modellen</code>
premium_confirm_benefit_4 = <code>🧠 Erweitertes Kontextfenster</code>
premium_confirm_benefit_5 = <code>👤 24/7 Support</code>
premium_confirm_benefit_6 = <code>🔒 Stabilität auch bei Spitzenlast</code>
premium_confirm_footer = <b>⬇️ Bestätigen Sie den Premium-Kauf für 10 SP.</b>
premium_confirm_yes = ✅ Kauf bestätigen
premium_confirm_no = ❌ Abbrechen

# Premium — Aktivierungsszenarien
premium_insufficient_sp = ⚠️ <b>Nicht genügend SP</b>
    Benötigt: <b>10 SP</b>
    Sie haben: <b>{$balance} SP</b>
premium_activated_success = Premium aktiviert! Viel Erfolg ✨
premium_enable_autorenew_button = Automatische Verlängerung aktivieren
premium_later_button = Später
premium_autorenew_enabled = <b>Automatische Verlängerung aktiviert</b> ✅\n\nSie können es im Profil deaktivieren
premium_autorenew_later_info = Sie können die automatische Verlängerung später in Profil → Premium aktivieren

# Bestätigung für automatische Verlängerung
premium_autorenew_confirm_enable = 🔄 Automatische Verlängerung aktivieren?
    Wir verlängern Ihr Abonnement automatisch und belasten 10 SP am Verlängerungstag — {$expires_at}.
premium_autorenew_confirm_disable = ⏹ Automatische Verlängerung deaktivieren?
    Nach {$expires_at} wird das Abonnement nicht automatisch verlängert.
premium_autorenew_confirm_yes = ✅ Bestätigen
premium_autorenew_confirm_no = ❌ Abbrechen

# Verlängerungsbestätigung
premium_extend_confirm = 🔁 Verlängerung bestätigen
premium_extend_confirm_yes = ✅ Bestätigen
premium_extend_confirm_no = 🚫 Abbrechen
premium_extend_success = <b>✅ Verlängerung erfolgreich!</b>\n\n📅 Ablaufdatum des Abonnements: {$end_date}

# Premium — aktiver Status
premium_active_title = ⭐ <b>Premium aktiv</b>
premium_active_text = \n📅 <b>Gültig bis:</b> {$expires_at}\n⏳ <b>Verbleibend:</b> {$days_left} Tage\n🔄 <b>Automatische Verlängerung:</b> <b>{$autorenew}</b>\n💰 <b>Guthaben:</b> {$balance} SP\n\n<b>Vorteile:</b>\n• Rabatt auf kostenpflichtige Anfragen\n• Priorität in der Warteschlange (schnellere Antworten)\n• Höhere Limits und Zugang zu leistungsstarken Modellen\n• Erweitertes Kontextfenster (mehr Gesprächsverlauf wird gespeichert)\n• 24/7 Support\n• Garantierte Stabilität auch bei Spitzenlast
premium_extend_30_button = 🔄 Um 30 Tage verlängern — 10 SP
premium_autorenew_toggle_button_on = ⚙️ Automatische Verlängerung: {$on}
premium_autorenew_toggle_button_off = ⚙️ Automatische Verlängerung: {$off}
switch_on = EIN
switch_off = AUS
# Menü-Buttons
help_button = 🛟 Hilfe
profile_button = 🪪 Profil
model_selection_button = 🧠 Modell auswählen
profile_language_button = 🌍 Sprache
topup_sp_button = 💳 SP aufladen
profile_change_plan_button = Tarif ändern

# Befehle
start_command = Bot starten
help_command = Hilfe anzeigen
model_command = Modell auswählen
profile_command = Dein Profil anzeigen
language_command = Interface-Sprache auswählen
clear_command = Chat-Verlauf löschen

# Hilfe
help_usage = So verwenden Sie es: Senden Sie Text/Sprach-/Bild-/Dokumente oder einen Videolink — ich kümmere mich darum und antworte
help_commands_title = Befehle:
help_start = /start — Hauptmenü
help_help = /help — diese Hilfe
help_model = /model — Modell auswählen
help_profile = /profile — Benutzerprofil
help_language = /language — Interface-Sprache
help_clear = /clear — Kontext löschen


help_files = Unterstützte Dateien (bis 15 MB): PDF, DOCX, PPTX, CSV, Text.
help_photos = Unterstützte Fotos: JPG, JPEG, PNG, WEBP.
help_content_rules = Inhaltsbeschränkungen: illegale, schädliche, beleidigende Materialien verboten.

# Support
help_contact_support_button = 🆘 Support kontaktieren
support_premium_required = 👤 Support ist nur mit aktivem Premium verfügbar.
support_open_chat_button = 🆘 Support-Chat öffnen
support_unavailable = Der Support-Link ist derzeit nicht verfügbar. Bitte später erneut versuchen.


# Profil
profile_coming_soon =  👤 Profil: bald verfügbar.

# Sprache
choose_language = Wähle die Sprache:
start_language_welcome = Willkommen beim multimodalen KI-Bot! Bitte wählen Sie Ihre Sprache, um fortzufahren.
start_language_welcome = Willkommen beim multimodalen KI-Bot! Bitte wählen Sie Ihre Sprache, um fortzufahren.
language_english = 🇬🇧 Englisch
language_russian = 🇷🇺 Russisch
language_spanish = 🇪🇸 Spanisch
language_german = 🇩🇪 Deutsch
language_portuguese = 🇵🇹 Portugiesisch
language_french = 🇫🇷 Französisch
language_vietnamese = 🇻🇳 Vietnamesisch
language_switched = Sprache gewechselt zu: {$language}

change_plan_coming_soon =  🔧 Tarif ändern: bald verfügbar.

# Kontext löschen
clear_confirm =  **Aktuellen Chat löschen?**
clear_yes_button = ✅ Ja, löschen
back_button = ◀️ Zurück
context_cleared =  🧹 **Kontext erfolgreich gelöscht.**

# Modellauswahl
select_model =  🤖 Wähle ein Modell für den Chat:
select_model_title = 
select_model_intro = <b>Wähle ein Modell, um mehr zu erfahren 👇</b>
select_model_legend = <b>0.01 SP</b> — Kosten pro Anfrage
    
    🧠 — Intelligenz des Modells (Denkniveau)
    🖼 — kann Bilder generieren
    🔥 — Top-Modell nach Beliebtheit
model_active = Modell aktiv: {$model}. Preis {$price} SP/Anfrage. Premium senkt die Kosten pro Anfrage.
model_buy_premium_button = ⭐ Premium kaufen
model_close_button = Schließen
model_selected =  ✅ Modell ausgewählt: **{$model}**
invalid_model = Ungültiges Modell

# Modelfähigkeiten
model_capabilities_title = ✨ <b>Fähigkeiten des Modells:</b>
capability_text = Text
capability_photos = Fotos
capability_files = Dateien
capability_voice = Sprachnachrichten

# Bestätigungsblock der Modellauswahl
model_connected_title = 🚀 Du hast das Modell verbunden: <b>{$model}</b>!
model_price_line_with_premium = 🔹 <b>Preis: <s>{$price_without} SP</s> → {$price_with} SP / Anfrage mit Premium ⭐</b>
model_price_line_without_premium =
    🔹 <b>Preis: {$price_without} SP</b>
    🔹 <b>Mit Premium {$price_with} SP — geringere Kosten und höhere Priorität ⭐</b>
model_price_line_free = 🔹 <b>Preis: kostenlos</b>
price_free_short = kostenlos
attachments_double_cost_note = 📎 Anhänge (Fotos/Audio/Dateien) verdoppeln die Kosten der Anfrage.
chat_start_hint = 💬 <b>Schreibe eine Nachricht oder stelle eine Frage — ich lege los.</b>

# Fehler
error_processing_message =  ❌ Beim Verarbeiten deiner Nachricht ist ein Fehler aufgetreten.
error_processing_file =  ❌ Beim Verarbeiten der Datei ist ein Fehler aufgetreten.
error_processing_file_retry =  ⚠️ Fehler beim Verarbeiten der Datei. Versuche, die Datei erneut hochzuladen.
unexpected_error =  ⚠️ Ein unerwarteter Fehler ist aufgetreten. Versuche es erneut.
insufficient_funds =  ⚠️ Unzureichendes Guthaben.

# Warnungen
warning_select_model_first =  ⚠️ Wähle zuerst ein Modell über /model
warning_file_size_limit =  ⚠️ Die Dateigröße überschreitet das Limit von 15 MB.
warning_unsupported_file_type =  ⚠️ Nur PDF-, DOCX-, PPTX-, CSV- und Textdateien bis 15 MB werden unterstützt.
warning_unsupported_photo_type =  ⚠️ Es werden nur Fotos im Format JPG, JPEG, PNG oder WEBP unterstützt.
warning_select_model_before_file =  ⚠️ Wähle zuerst ein Modell über /model, dann sende die Datei.
warning_model_no_file_support =  🚫 Das aktuelle Modell unterstützt keine Dateiarbeit. Bitte wähle ein anderes in /model.
warning_model_no_voice_support =  🚫 Dieses Modell unterstützt keine Sprachnachrichten. Bitte versuche ein anderes Modell.
warning_model_no_photo_support =  🚫 Dieses Modell unterstützt keine Fotoverarbeitung. Bitte versuche ein anderes Modell.

# Einschränkungen des kostenlosen Modells
warning_free_model_no_media =  ⚠️ Im kostenlosen Modell werden Fotos/Dateien/Sprachnachrichten nicht unterstützt.

# Dateien
file_accepted =  📎 Datei akzeptiert! Sende jetzt deine Frage und ich analysiere den Inhalt der Datei.
file_name =  📄 Dateiname: {$name}
file_size =  📊 Größe: {$size}
file_type =  🔍 Typ: {$type}
file_analyzing =  🔍 Analysiere den Dateiinhalt...

# Dateiverarbeitung
file_processing_error = Fehler beim Verarbeiten der Datei: {$error}
unsupported_file_type = Nicht unterstützter Dateityp: {$type}
pdf_text_extraction_error = Fehler beim Extrahieren des Texts aus der PDF: {$error}
docx_text_extraction_error = Fehler beim Extrahieren des Texts aus der DOCX: {$error}
pptx_text_extraction_error = Fehler beim Extrahieren des Texts aus der PPTX: {$error}
csv_parsing_error = Fehler beim Parsen der CSV: {$error}

# Dateitext
pdf_no_text = Kein Text in der PDF-Datei gefunden
docx_no_text = Kein Text in der DOCX-Datei gefunden
pptx_no_text = Kein Text in der PPTX-Datei gefunden
csv_empty = Die CSV-Datei ist leer oder enthält keine Daten
csv_row = Zeile {$index}: {$content}

# Pakete
plan_start_limits = 3 Fragen/Tag und 1 Foto
plan_custom_limits = benutzerdefinierte Paketlimits

# Modelle
model = Modell
model_not_selected = — nicht ausgewählt —

# Bilder
image_description = Beschreibung
image_generated_via_footer = ✨ Generiert über <a href="{$url}">Multi-Chat-Bot</a>
image_generated_via_footer_plain = ✨ Generiert über den Multi-Chat-Bot

# Systemnachrichten für Dateien
file_content_message = Inhalt der hochgeladenen Datei:
file_analysis_request = Bitte analysiere diese Datei und beantworte die Frage des Benutzers.

# Bot-Befehle (für setMyCommands)
bot_command_start = Bot starten
bot_command_help = Hilfe anzeigen
bot_command_model = Modell auswählen
bot_command_profile = Profil anzeigen
bot_command_language = Sprache wählen
bot_command_clear = Verlauf löschen

# Zusätzliche Texte
profile_coming_soon_en =  👤 Profil: demnächst verfügbar.

# Nachrichtenteilung
message_part = Teil {$current} von {$total}

# Verarbeitungsindikator
processing_request = ⏳ Verarbeite deine Anfrage...

# Onboarding nach Sprachauswahl
onboarding_promo = **Hi, {$first_name}!** 👋\n\n**Ich bin der SETUP KI-Assistent.**\n\n**Text, Foto oder Stimme** — ich analysiere und verwandle es in Ergebnisse: von Ideen und Plänen bis hin zu Analysen und fertigen Dokumenten.\n\n🎙 **Stimme** → Transkription, Zusammenfassungen, strukturierte Ideen\n📸 **Foto** → Inhaltsanalyse, Beschreibung, Datenauszug\n🧑‍💻 **Code** → Tipps, Fehlersuche, Optimierung\n✉️ **Business-Texte** → E-Mails, Angebote, Landingpages, Vertriebsskripte\n🧭 **Struktur** → Briefing → Spezifikation → Plan/Checkliste in Minuten\n🔎 **Analytik** → Fakten, Risiken, Schlussfolgerungen, nächste Schritte\n🧩 **Skalierte Personalisierung** → 50–500 Varianten pro Vorlage\n🧪 **A/B-Test** → Überschriften, erste Absätze, CTAs\n📊 **Daten** → Entitätsextraktion → Markdown / CSV / JSON\n🌍 **Sprachen & Ton** → RU / EN / ES / PT / FR / DE, eine einheitliche Markenstimme\n\n✨ **Kostenlose Modelle zum Start verfügbar.**\n🔥 **Für ernsthafte Aufgaben — bezahlte KIs:** schneller, smarter, und mit Premium — günstiger und priorisiert.\n\n👉 Tippe **„Modell wählen“** — und los geht’s 🚀

# Benachrichtigungen
notification_inactive_recall = {$first_name}, lange nicht gesehen 👋\nSende eine Anfrage — ich helfe!
autorenew_failed_insufficient_sp = <b>⚠️ Premium konnte nicht verlängert werden</b>\n\n🔹 Erforderlich: <b>{$required} SP</b>\n🔹 Aktuelles Guthaben: <b>{$balance} SP</b>
autorenew_success = <b>✅ Automatische Verlängerung erfolgreich</b>\n\n🔹 Neues Ablaufdatum: <b>bis {$premium_expires_at}</b>\n🔹 Aktuelles Guthaben: <b>{$balance} SP</b>
subscription_expiring_3_days = Premium ⭐ läuft in 3 Tagen ab — {$premium_expires_at}. Verlängern Sie, um Rabatte und Priorität zu behalten.
subscription_expiring_1_day = Premium ⏳ läuft morgen ab — {$premium_expires_at}. Verlängern Sie um 30 Tage für 10 SP.
premium_renew_button = 🔁 Verlängern
