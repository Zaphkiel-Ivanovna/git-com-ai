# GitComAI

GitComAI est une extension VSCode qui génère automatiquement des messages de commit pertinents à partir d'un git diff, en utilisant l'API Anthropic (Claude).

## Fonctionnalités

- Analyse automatique des modifications git (diff)
- Génération de messages de commit suivant la convention Conventional Commits
- Interface simple pour modifier et appliquer les messages générés
- Support pour différents modèles Claude d'Anthropic
- Configuration de l'API key dans les paramètres VSCode

## Installation

1. Installez l'extension depuis le marketplace VSCode
2. Configurez votre clé API Anthropic dans les paramètres de l'extension

## Utilisation

1. Effectuez des modifications dans votre dépôt Git
2. Ajoutez vos changements à l'index Git (`git add .`)
3. Cliquez sur le bouton "Generate Commit Message with AI" dans la barre d'outils ou utilisez la commande dans la palette de commandes
4. Modifiez le message généré si nécessaire
5. Appliquez directement le message ou copiez-le dans votre clipboard

## Configuration

- `gitcomai.anthropicApiKey`: Votre clé API Anthropic
- `gitcomai.model`: Le modèle Claude à utiliser (Opus, Sonnet, ou Haiku)

## Licence

MIT

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
