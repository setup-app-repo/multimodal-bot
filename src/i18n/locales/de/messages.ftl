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
premium_activate_button = Für 10 SP aktivieren
premium_back_button = Zurück
premium_activation_coming_soon = Premium-Aktivierung wird bald verfügbar sein

# Premium — aktiver Status
premium_active_title = ⭐ Premium aktiv
premium_active_text = Gültig bis: {$expires_at} — + 30 Tage\n({$days_left} Tage verbleiben)\nAutomatische Verlängerung: {$autorenew}\nGuthaben: {$balance} SP\n\nVorteile: Rabatt auf bezahlte Anfragen, Priorität, höhere Limits
premium_extend_30_button = Um 30 Tage verlängern — 10 SP
premium_autorenew_toggle_button_on = Automatische Verlängerung: {$on}
premium_autorenew_toggle_button_off = Automatische Verlängerung: {$off}
switch_on = EIN
switch_off = AUS
# Menü-Buttons
help_button = Hilfe
profile_button = Profil
model_selection_button = Modell auswählen
profile_language_button = 🌍 Sprache
profile_change_plan_button = Tarif ändern

# Befehle
start_command = Bot starten
help_command = Hilfe anzeigen
model_command = Modell auswählen
profile_command = Dein Profil anzeigen
language_command = Interface-Sprache auswählen
clear_command = Chat-Verlauf löschen
billing_command = Abrechnung und Nutzung

# Hilfe
help_title = Hilfe:
help_usage = So verwenden Sie es: Senden Sie Text/Sprach-/Bild-/Dokumente oder einen Videolink — ich kümmere mich darum und antworte
help_commands_title = Befehle:
help_start = /start — Hauptmenü
help_help = /help — diese Hilfe
help_model = /model — Modell auswählen
help_profile = /profile — Benutzerprofil
help_language = /language — Interface-Sprache
help_clear = /clear — Kontext löschen
help_billing = /billing — Abrechnung und Nutzung

help_context_rules_title = Kontextregeln:
help_context_rules_1 = — Wir behalten ein Fenster der letzten 20 "Frage-Antwort"-Paare.
help_context_rules_2 = — /clear löscht den Verlauf vollständig.
help_context_rules_3 = — Für "Start" ist der Kontext deaktiviert.

help_files = Unterstützte Dateien (bis 15 MB): PDF, DOCX, PPTX, CSV, Text.
help_models = Verfügbare Modelle: OpenAI, DeepSeek, Sonet, GPT Mini, Grok.
help_content_rules = Inhaltsbeschränkungen: illegale, schädliche, beleidigende Materialien verboten.
help_disclaimer = Haftungsausschluss: Antworten werden "wie besehen" bereitgestellt und können Fehler enthalten.

# Support-Schaltfläche
help_support_button = 👤 Support kontaktieren

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
language_switched = Sprache gewechselt zu: {$language}

# Abrechnung
billing_coming_soon =  💳 Abrechnung: bald verfügbar.
change_plan_coming_soon =  🔧 Tarif ändern: bald verfügbar.

# Kontext löschen
clear_confirm =  Bestätigung: aktuellen Chat löschen?
cancel_button = Abbrechen
context_cleared =  🧹 Kontext gelöscht.

# Modellauswahl
select_model =  🤖 Wähle ein Modell für den Chat:
select_model_title = Wähle ein Modell (SP/Anfrage • 🧠 Denkleistung)
model_active = Modell aktiv: {$model}. Preis {$price} SP/Anfrage. Premium senkt die Kosten pro Anfrage.
model_buy_premium_button = ⭐ Premium kaufen
model_close_button = Schließen
model_selected =  ✅ Modell ausgewählt: **{$model}**
invalid_model = Ungültiges Modell

# Fehler
error_processing_message =  ❌ Beim Verarbeiten deiner Nachricht ist ein Fehler aufgetreten.
error_processing_file =  ❌ Beim Verarbeiten der Datei ist ein Fehler aufgetreten.
error_processing_file_retry =  ⚠️ Fehler beim Verarbeiten der Datei. Versuche, die Datei erneut hochzuladen.
unexpected_error =  ⚠️ Ein unerwarteter Fehler ist aufgetreten. Versuche es erneut.

# Warnungen
warning_select_model_first =  ⚠️ Wähle zuerst ein Modell über /model
warning_file_size_limit =  ⚠️ Die Dateigröße überschreitet das Limit von 15 MB.
warning_unsupported_file_type =  ⚠️ Nur PDF-, DOCX-, PPTX-, CSV- und Textdateien bis 15 MB werden unterstützt.
warning_select_model_before_file =  ⚠️ Wähle zuerst ein Modell über /model, dann sende die Datei.
warning_model_no_file_support =  🚫 Das aktuelle Modell unterstützt keine Dateiarbeit. Bitte wähle ein anderes in /model.

# Dateien
file_accepted =  📎 Datei akzeptiert! Sende jetzt deine Frage und ich analysiere den Inhalt der Datei.
file_name =  📄 Dateiname: {$name}
file_size =  📊 Größe: {$size} MB
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
bot_command_billing = Abrechnung

# Zusätzliche Texte
profile_coming_soon_en =  👤 Profil: demnächst verfügbar.
billing_coming_soon_en =  💳 Abrechnung: demnächst verfügbar.

# Nachrichtenteilung
message_part = Teil {$current} von {$total}
