# Localisation française pour le bot Telegram

# Messages généraux
welcome_description = Objectif : chatbot avec support du contexte et modèles LLM.
current_model =  🤖 Modèle actuel : {$model}
current_language =  🌐 Langue : {$lang}
current_plan =  📦 Forfait : {$plan}
current_limits =  ⚡ Limites : {$limits}

# Profil (nouvelles clés)
profile_title = Paramètres
profile_balance = Solde : {$balance} SP
profile_premium = Premium : {$status}
yes = Oui
no = Non

# Boutons de profil
profile_premium_button = ⭐ Premium
profile_clear_button = 🧹 Réinitialiser le contexte
# Interface premium
premium_title = ⭐ Premium — Puissance IA maximale pour 10 SP
premium_benefits_title = Ce que vous obtenez :
premium_benefit_1 = • Réduction sur les requêtes payantes
premium_benefit_2 = • Priorité dans la file d'attente (réponses plus rapides)
premium_benefit_3 = • Limites augmentées et accès aux modèles puissants
premium_activate_button = ✨ Activer pour 10 SP
premium_back_button = ◀️ Retour
premium_activation_coming_soon = L'activation premium sera disponible prochainement

# Premium — confirmation d'achat
premium_confirm_title = ⭐ <b>Premium — 10 SP / 30 jours</b>
premium_confirm_benefits_title = <b>Ce qui est inclus :</b>
premium_confirm_benefit_1 = <code>📉 Réduction sur les requêtes payantes</code>
premium_confirm_benefit_2 = <code>⚡ Priorité dans la file d'attente</code>
premium_confirm_benefit_3 = <code>📈 Limites augmentées et accès aux modèles puissants</code>
premium_confirm_benefit_4 = <code>🧠 Fenêtre de contexte étendue</code>
premium_confirm_benefit_6 = <code>🔒 Stabilité même en période de forte charge</code>
premium_confirm_footer = <b>⬇️ Confirmez l'achat Premium pour 10 SP.</b>
premium_confirm_yes = ✅ Confirmer l'achat
premium_confirm_no = ❌ Annuler

# Premium — scénarios d'activation
premium_insufficient_sp = ⚠️ <b>SP insuffisants</b>
    Nécessaire : <b>10 SP</b>
    Vous avez : <b>{$balance} SP</b>
premium_activated_success = Premium activé ! Bon travail ✨
premium_enable_autorenew_button = Activer le renouvellement automatique
premium_later_button = Plus tard
premium_autorenew_enabled = <b>Renouvellement automatique activé</b> ✅\n\nVous pouvez le désactiver dans Paramètres
premium_autorenew_later_info = Vous pouvez activer le renouvellement automatique plus tard dans Paramètres → Premium

# Confirmation du renouvellement automatique
premium_autorenew_confirm_enable = 🔄 Activer le renouvellement automatique ?
    Nous renouvellerons automatiquement votre abonnement et prélèverons 10 SP le jour du renouvellement — {$expires_at}.
premium_autorenew_confirm_disable = ⏹ Désactiver le renouvellement automatique ?
    Après {$expires_at}, l'abonnement ne sera pas renouvelé automatiquement.
premium_autorenew_confirm_yes = ✅ Confirmer
premium_autorenew_confirm_no = ❌ Annuler

# Confirmation de prolongation
premium_extend_confirm = 🔁 Confirmer le renouvellement
premium_extend_confirm_yes = ✅ Confirmer
premium_extend_confirm_no = 🚫 Annuler
premium_extend_success = <b>✅ Renouvellement effectué avec succès !</b>\n\n📅 Date de fin d’abonnement : {$end_date}

# Premium — statut actif
premium_active_title = ⭐ <b>Premium actif</b>
premium_active_text = \n📅 <b>Valable jusqu’au :</b> {$expires_at}\n⏳ <b>Restant :</b> {$days_left} jours\n🔄 <b>Renouvellement auto :</b> <b>{$autorenew}</b>\n💰 <b>Solde :</b> {$balance} SP\n\n<b>Avantages :</b>\n• Réduction sur les requêtes payantes\n• Priorité dans la file (réponses plus rapides)\n• Limites augmentées et accès aux modèles puissants\n• Fenêtre de contexte étendue (plus d’historique conservé)\n• Stabilité garantie même en période de forte charge
premium_extend_30_button = 🔄 Prolonger de 30 jours — 10 SP
premium_autorenew_toggle_button_on = ⚙️ Renouvellement auto : {$on}
premium_autorenew_toggle_button_off = ⚙️ Renouvellement auto : {$off}
switch_on = ACTIVÉ
switch_off = DÉSACTIVÉ
# Boutons du menu
help_button = 🛟 Aide
profile_button = ⚙️ Paramètres
model_selection_button = 🧠 Sélectionner le modèle
profile_language_button = 🌍 Langue
profile_change_plan_button = Changer de forfait

# Commandes
start_command = Démarrer le bot
help_command = Afficher l'aide
model_command = Sélectionner le modèle
profile_command = Ouvrir les paramètres
language_command = Sélectionner la langue de l'interface
clear_command = Effacer l'historique du chat

# Aide
help_usage =
    <b>Comment utiliser</b> : envoyez <b>texte/voix/image/document</b> ou un lien vidéo — je m’en charge et je réponds
    ℹ️ Lors du choix d’un modèle, appuyez dessus pour en savoir plus sur ses capacités et son usage
    <b>⭐ Le Premium s’applique à tous les modèles de l’assistant et offre des fonctionnalités étendues :</b>
    • Réduction sur les requêtes payantes
    • Priorité dans la file (réponses plus rapides)
    • Limites augmentées et accès aux modèles puissants
    • Fenêtre de contexte étendue (plus d’historique conservé)
    • Stabilité garantie même en période de forte charge
help_commands_title = Commandes :
help_start = /start — menu principal
help_help = /help — cette aide
help_model = /model — sélectionner le modèle
help_profile = /profile — paramètres
help_language = /language — langue de l'interface
help_clear = /clear — effacer le contexte


help_files = 📂 <b>Fichiers supportés (jusqu'à 15 Mo)</b> : PDF, DOCX, PPTX, CSV, texte.
help_photos = 🖼 <b>Photos prises en charge</b> : JPG, JPEG, PNG, WEBP.
help_content_rules = 🚫 <b>Restrictions de contenu</b> : interdits matériaux illégaux, malveillants, offensants.

# Support
help_contact_support_button = 🆘 Contacter le support
support_premium_required = 👤 Contacter le support est disponible avec Premium actif.
support_open_chat_button = 🆘 Ouvrir le chat du support
support_unavailable = Le lien du support est indisponible pour le moment. Réessayez plus tard.

# Facturation/Recharge
topup_sp_button = 💳 Recharger des SP


# Onboarding après la sélection de la langue
onboarding_promo = **Bonjour, {$first_name} !** 👋\n\n**Je suis l’assistant IA SETUP.**\n\n**Texte, photo ou voix** — j’analyse et je transforme en résultats : des idées et plans jusqu’à l’analyse et des documents prêts à l’usage.\n\n🎙 **Voix** → transcription, résumés, idées structurées\n📸 **Photo** → analyse de contenu, description, extraction de données\n🧑‍💻 **Code** → conseils, débogage, optimisation\n✉️ **Textes business** → emails, offres, landing pages, scripts de vente\n🧭 **Structure** → brief → cahier des charges → plan/checklist en quelques minutes\n🔎 **Analytique** → faits, risques, conclusions, next steps\n🧩 **Personnalisation à grande échelle** → 50–500 variantes par modèle\n🧪 **A/B test** → titres, premiers paragraphes, CTAs\n📊 **Données** → analyse et traitement → (CSV, PDF, etc.)\n🌍 **Langues et ton** → RU / EN / ES / PT / FR / DE, une seule voix de marque\n\n✨ **Des modèles gratuits sont disponibles pour commencer.**\n⭐ **Le Premium fonctionne immédiatement pour tous les modèles** — réduit le coût et donne la priorité.\n🧠 **Le contexte de conversation est conservé entre tous les modèles** — vous pouvez changer librement sans perdre l’historique\n\n🔥 **Pour les tâches sérieuses — IA payantes :** plus rapide, plus intelligent, et avec le Premium — moins cher et prioritaire.\n\n👉 Appuyez sur **« Choisir le modèle »** — c’est parti 🚀
onboarding_choose_model_button = 🚀 Choisir le modèle

# Profil
profile_coming_soon =  ⚙️ Paramètres : bientôt disponible.

# Langue
choose_language = Sélectionnez la langue :
start_language_welcome = Bienvenue sur le bot IA multimodal ! Veuillez choisir votre langue pour continuer.
language_english = 🇬🇧 Anglais
language_russian = 🇷🇺 Russe
language_spanish = 🇪🇸 Espagnol
language_german = 🇩🇪 Allemand
language_portuguese = 🇵🇹 Portugais
language_french = 🇫🇷 Français
language_vietnamese = 🇻🇳 Vietnamien
language_switched = Langue changée en : {$language}

change_plan_coming_soon =  🔧 Changer de forfait : bientôt disponible.

# Nettoyage du contexte
clear_confirm =  **Effacer la conversation actuelle ?**
clear_yes_button = ✅ Oui, effacer
back_button = ◀️ Retour
context_cleared =  🧹 **Contexte effacé avec succès.**

# Sélection du modèle
select_model =  🤖 Sélectionnez un modèle pour le chat :
select_model_title = 
select_model_intro = <b>Choisissez un modèle pour en savoir plus 👇</b>
select_model_legend = <b>0,01 SP</b> — coût par requête
    
    🧠 — intelligence du modèle (niveau de « raisonnement »)
    🖼 — peut générer des images
    🔥 — modèle le plus populaire
    🎙 — sait traiter les messages vocaux
model_active = Modèle actif : {$model}. Prix {$price} SP/requête. Le Premium réduit le coût par requête.
model_buy_premium_button = ⭐ Acheter Premium
model_back_button = ◀️ Retour
model_close_button = ❌ Fermer
model_selected =  ✅ Modèle sélectionné : **{$model}**
invalid_model = Modèle invalide

# Capacités du modèle
model_capabilities_title = ✨ <b>Capacités du modèle :</b>
capability_text = Texte
capability_photos = Photos
capability_files = Fichiers
capability_voice = Messages vocaux

# Bloc de confirmation de sélection du modèle
model_connected_title = 🚀 Vous avez connecté le modèle : <b>{$model}</b> !
model_about_title = ℹ️ <b>À propos du modèle :</b>
model_about_gpt5 = GPT-5 🧠🔥 — fleuron avec précision maximale et raisonnement profond. Universel pour les tâches sérieuses : analytique, stratégie, rédaction longue et requêtes complexes.
model_about_nano = Nano 🍌 ⚡🖼 — optimal pour les photos, notamment les portraits. Rapide et abordable : fournit des descriptions claires et des résultats rapides. Pour une meilleure qualité, décrivez la tâche de façon précise et détaillée.
model_about_claude37_sonnet = <b>Claude 3.7 Sonnet ✍️📚</b> — excellent sur les textes. Produit des réponses structurées et créatives ; idéal pour emails, scripts et idées.
model_about_grok4 = <b>Grok 4 (Vision) 👀🖼</b> — comprend images et texte. Utile pour analyser photos, infographies, documents et requêtes mixtes.
model_about_gemini25_pro = <b>Gemini 2.5 Pro 🌐🔬</b> — IA multimodale de Google. Équilibre texte, images et données. Pratique pour l’analyse, les tâches multilingues et excelle dans le traitement des messages vocaux — de la reconnaissance vocale à l’analyse et au résumé du contenu.
model_about_deepseek = <b>DeepSeek ⚡🧪</b> — allie vitesse et intelligence. Adapté aux requêtes en masse, A/B tests, marketing et génération d’idées.
model_about_qwen25 = <b>Qwen2.5 💡💸</b> — modèle basique et économique. Convient pour questions rapides, brouillons et textes simples.
model_about_gpt4o_mini = <b>GPT-4o — mini 🎯🆓</b> — modèle gratuit d’entrée de gamme. Bien pour débuter et les tâches légères.
model_price_base_line = 🔹 <b>Prix : {$price_without} SP</b>
model_price_with_premium_line = ⭐ <b>Avec Premium {$price_with} SP</b> — coûts plus bas et priorité plus élevée.
model_premium_applies_all = ⭐ Le Premium s’applique à tous les modèles.
model_price_line_free = 🔹 <b>Prix : gratuit</b>
price_free_short = gratuit
attachments_double_cost_note = 📎 Les pièces jointes (photos/audio/fichiers) doublent le coût de la requête.
chat_start_hint = 💬 <b>Envoyez un message ou posez une question — je me mets au travail.</b>

# Erreurs
error_processing_message =  ❌ Une erreur s'est produite lors du traitement de votre message.
error_processing_file =  ❌ Une erreur s'est produite lors du traitement du fichier.
error_processing_file_retry =  ⚠️ Erreur lors du traitement du fichier. Essayez de télécharger le fichier à nouveau.
unexpected_error =  ⚠️ Une erreur inattendue s'est produite. Essayez à nouveau.
insufficient_funds =  ⚠️ Fonds insuffisants.

# Avertissements
warning_select_model_first =  ⚠️ Sélectionnez d'abord un modèle via /model
warning_file_size_limit =  ⚠️ La taille du fichier dépasse la limite de 15 Mo.
warning_unsupported_file_type =  ⚠️ Seuls les fichiers PDF, DOCX, PPTX, CSV et texte jusqu'à 15 Mo sont supportés.
warning_unsupported_photo_type =  ⚠️ Seules les photos JPG, JPEG, PNG ou WEBP sont prises en charge.
warning_select_model_before_file =  ⚠️ Sélectionnez d'abord un modèle via /model, puis envoyez le fichier.
warning_model_no_file_support =  🚫 Le modèle actuel ne supporte pas le travail avec les fichiers. Veuillez en sélectionner un autre dans /model.
warning_model_no_voice_support =  🚫 Ce modèle ne supporte pas les messages vocaux. Veuillez essayer un autre modèle.
warning_model_no_photo_support =  🚫 Ce modèle ne supporte pas le traitement des photos. Veuillez essayer un autre modèle.

# Limitations du modèle gratuit
warning_free_model_no_media =  ⚠️ Dans le modèle gratuit, les photos/fichiers/messages vocaux ne sont pas pris en charge.

# Fichiers
file_accepted =  📎 Fichier accepté ! Maintenant envoyez votre question et j'analyserai le contenu du fichier.
file_name =  📁 Nom du fichier : {$name}
file_size =  📊 Taille : {$size}
file_type =  🔍 Type : {$type}
file_analyzing =  🔍 Analyse du contenu du fichier...

# Traitement des fichiers
file_processing_error = Erreur lors du traitement du fichier : {$error}
unsupported_file_type = Type de fichier non supporté : {$type}
pdf_text_extraction_error = Erreur lors de l'extraction du texte du PDF : {$error}
docx_text_extraction_error = Erreur lors de l'extraction du texte du DOCX : {$error}
pptx_text_extraction_error = Erreur lors de l'extraction du texte du PPTX : {$error}
csv_parsing_error = Erreur lors de l'analyse du CSV : {$error}

# Texte des fichiers
pdf_no_text = Aucun texte trouvé dans le fichier PDF
docx_no_text = Aucun texte trouvé dans le fichier DOCX
pptx_no_text = Aucun texte trouvé dans le fichier PPTX
csv_empty = Le fichier CSV est vide ou ne contient pas de données
csv_row = Ligne {$index} : {$content}

# Forfaits
plan_start_limits = 3 questions/jour et 1 photo
plan_custom_limits = limites personnalisées du forfait

# Modèles
model = Modèle
model_not_selected = — non sélectionné —

# Images
image_description = Description
image_generated_via_footer = ✨ Généré via <a href="{$url}">bot Multi-Chat</a>
image_generated_via_footer_plain = ✨ Généré via le bot Multi-Chat

# Messages système pour les fichiers
file_content_message = Contenu du fichier téléchargé :
file_analysis_request = Veuillez analyser ce fichier et répondre à la question de l'utilisateur.

# Commandes du bot (pour setMyCommands)
bot_command_start = Démarrer le bot
bot_command_help = Afficher l'aide
bot_command_model = Sélectionner le modèle
bot_command_profile = Ouvrir les paramètres
bot_command_language = Choisir la langue
bot_command_clear = Effacer l'historique

# Textes supplémentaires
profile_coming_soon_en =  👤 Profil : bientôt disponible.

# Division des messages
message_part = Partie {$current} de {$total}

# Indicateur de traitement
processing_request = ⏳ Traitement de votre demande...

# Notifications
notification_inactive_recall = {$first_name}, ça fait longtemps 👋\nEnvoyez n’importe quelle demande — je vous aide !
autorenew_failed_insufficient_sp = <b>⚠️ Échec du renouvellement du Premium</b>\n\n🔹 Requis : <b>{$required} SP</b>\n🔹 Solde actuel : <b>{$balance} SP</b>
autorenew_success = <b>✅ Renouvellement automatique réussi</b>\n\n🔹 Nouvelle échéance : <b>jusqu’au {$premium_expires_at}</b>\n🔹 Solde actuel : <b>{$balance} SP</b>
subscription_expiring_3_days = Premium ⭐ expire dans 3 jours — {$premium_expires_at}. Renouvelez pour conserver les réductions et la priorité.
subscription_expiring_1_day = Premium ⏳ expire demain — {$premium_expires_at}. Renouvelez pour 30 jours pour 10 SP.
premium_renew_button = 🔁 Renouveler
