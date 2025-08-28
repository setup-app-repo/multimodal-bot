# Localisation française pour le bot Telegram

# Messages généraux
welcome_description = Objectif : chatbot avec support du contexte et modèles LLM.
current_model =  🤖 Modèle actuel : {$model}
current_language =  🌐 Langue : {$lang}
current_plan =  📦 Forfait : {$plan}
current_limits =  ⚡ Limites : {$limits}

# Profil (nouvelles clés)
profile_title = Profil
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
premium_activate_button = Activer pour 10 SP
premium_back_button = Retour
premium_activation_coming_soon = L'activation premium sera disponible prochainement
# Boutons du menu
help_button = Aide
profile_button = Profil
model_selection_button = Sélectionner le modèle
profile_language_button = Langue
profile_change_plan_button = Changer de forfait

# Commandes
start_command = Démarrer le bot
help_command = Afficher l'aide
model_command = Sélectionner le modèle
profile_command = Afficher votre profil
language_command = Sélectionner la langue de l'interface
clear_command = Effacer l'historique du chat
billing_command = Facturation et utilisation

# Aide
help_title = Aide :
help_commands_title = Commandes :
help_start = /start — menu principal
help_help = /help — cette aide
help_model = /model — sélectionner le modèle
help_profile = /profile — profil utilisateur
help_language = /language — langue de l'interface
help_clear = /clear — effacer le contexte
help_billing = /billing — facturation et utilisation

help_context_rules_title = Règles du contexte :
help_context_rules_1 = — Nous conservons une fenêtre des 20 derniers paires "Question-Réponse".
help_context_rules_2 = — /clear efface complètement l'historique.
help_context_rules_3 = — Pour "Démarrer" le contexte est désactivé.

help_files = Fichiers supportés (jusqu'à 15 Mo) : PDF, DOCX, PPTX, CSV, texte.
help_models = Modèles disponibles : OpenAI, DeepSeek, Sonet, GPT Mini, Grok.
help_content_rules = Restrictions de contenu : interdits matériaux illégaux, malveillants, offensants.
help_disclaimer = Avertissement : les réponses sont fournies "en l'état" et peuvent contenir des erreurs.

# Onboarding après la sélection de la langue
onboarding_promo = Salut, {$first_name} ! 👋\n\nJe suis l'assistant IA SETUP. Texte uniquement pour l'instant — rapide et efficace. Voici comment je peux aider :\n\n🧑‍💻 Code : conseils, débogage, optimisation\n✉️ Textes business : emails, offres, landing pages, scripts de vente\n🧭 Structure : brief → cahier des charges → plan/checklist en quelques minutes\n🔎 Analyse : faits, risques, conclusions, next steps\n🧩 Personnalisation à grande échelle : 50–500 variantes par modèle\n🧪 A/B test : titres, premiers paragraphes, CTA\n📊 Données : extraction d'entités → Markdown/CSV/JSON\n🌍 Langues et ton : RU/EN/ES/PT/FR/DE, une voix de marque unifiée\nModèles gratuits pour démarrer et découvrir l'IA.\n\n🔥 Pour les tâches sérieuses — IA payantes. Le Premium réduit le coût et donne la priorité.\n\nAppuyez sur « Choisir le modèle » — c'est parti 🚀
onboarding_choose_model_button = 🚀 Choisir le modèle

# Profil
profile_coming_soon =  👤 Profil : bientôt disponible.

# Langue
choose_language = Sélectionnez la langue :
start_language_welcome = Bienvenue sur le bot IA multimodal ! Veuillez choisir votre langue pour continuer.
language_english = 🇬🇧 Anglais
language_russian = 🇷🇺 Russe
language_spanish = 🇪🇸 Espagnol
language_german = 🇩🇪 Allemand
language_portuguese = 🇵🇹 Portugais
language_french = 🇫🇷 Français
language_switched = Langue changée en : {$language}

# Facturation
billing_coming_soon =  💳 Facturation : bientôt disponible.
change_plan_coming_soon =  🔧 Changer de forfait : bientôt disponible.

# Nettoyage du contexte
context_cleared =  🧹 Contexte effacé.

# Sélection du modèle
select_model =  🤖 Sélectionnez un modèle pour le chat :
model_selected =  ✅ Modèle sélectionné : **{$model}**
invalid_model = Modèle invalide

# Erreurs
error_processing_message =  ❌ Une erreur s'est produite lors du traitement de votre message.
error_processing_file =  ❌ Une erreur s'est produite lors du traitement du fichier.
error_processing_file_retry =  ⚠️ Erreur lors du traitement du fichier. Essayez de télécharger le fichier à nouveau.
unexpected_error =  ⚠️ Une erreur inattendue s'est produite. Essayez à nouveau.

# Avertissements
warning_select_model_first =  ⚠️ Sélectionnez d'abord un modèle via /model
warning_file_size_limit =  ⚠️ La taille du fichier dépasse la limite de 15 Mo.
warning_unsupported_file_type =  ⚠️ Seuls les fichiers PDF, DOCX, PPTX, CSV et texte jusqu'à 15 Mo sont supportés.
warning_select_model_before_file =  ⚠️ Sélectionnez d'abord un modèle via /model, puis envoyez le fichier.
warning_model_no_file_support =  🚫 Le modèle actuel ne supporte pas le travail avec les fichiers. Veuillez en sélectionner un autre dans /model.

# Fichiers
file_accepted =  📎 Fichier accepté ! Maintenant envoyez votre question et j'analyserai le contenu du fichier.
file_name =  📁 Nom du fichier : {$name}
file_size =  📊 Größe : {$size} Mo
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

# Messages système pour les fichiers
file_content_message = Contenu du fichier téléchargé :
file_analysis_request = Veuillez analyser ce fichier et répondre à la question de l'utilisateur.

# Commandes du bot (pour setMyCommands)
bot_command_start = Démarrer le bot
bot_command_help = Afficher l'aide
bot_command_model = Sélectionner le modèle
bot_command_profile = Afficher le profil
bot_command_language = Choisir la langue
bot_command_clear = Effacer l'historique
bot_command_billing = Facturation

# Textes supplémentaires
profile_coming_soon_en =  👤 Profil : bientôt disponible.
billing_coming_soon_en =  💳 Facturation : bientôt disponible.
