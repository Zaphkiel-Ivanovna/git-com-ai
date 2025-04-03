# GitComAI - AI-Powered Git Commit Messages

![Logo](images/logo_full.png)

GitComAI is a VSCode extension that automatically generates meaningful Git commit messages by analyzing your code changes (git diff) using Anthropic's Claude AI technology. The extension follows the GitMoji and Conventional Commits specifications to create clear, informative commit messages.

[![Version](https://img.shields.io/visual-studio-marketplace/v/ZaphkielIvanovna.gitcomai)](https://marketplace.visualstudio.com/items?itemName=ZaphkielIvanovna.gitcomai)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/ZaphkielIvanovna.gitcomai)](https://marketplace.visualstudio.com/items?itemName=ZaphkielIvanovna.gitcomai)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/ZaphkielIvanovna.gitcomai)](https://marketplace.visualstudio.com/items?itemName=ZaphkielIvanovna.gitcomai)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 Table of Contents

- [GitComAI - AI-Powered Git Commit Messages](#gitcomai---ai-powered-git-commit-messages)
  - [📋 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [💾 Installation](#-installation)
    - [From VSCode Marketplace](#from-vscode-marketplace)
    - [Manual Installation](#manual-installation)
  - [🚀 Usage](#-usage)
  - [⚙️ Configuration](#️-configuration)
    - [Available Settings](#available-settings)
  - [🔍 How It Works](#-how-it-works)
  - [💻 Development](#-development)
    - [Project Structure](#project-structure)
    - [Setting Up Development Environment](#setting-up-development-environment)
    - [Building the Extension](#building-the-extension)
    - [Testing](#testing)
    - [Packaging](#packaging)
  - [❓ FAQ](#-faq)
  - [🔧 Troubleshooting](#-troubleshooting)
  - [👥 Contributing](#-contributing)
  - [📄 License](#-license)

## ✨ Features

- 🤖 **AI-Powered Analysis**: Leverages Anthropic's Claude AI to understand code changes contextually
- 📝 **Conventional Commits Format**: Generates commit messages following the GitMoji and Conventional Commits standards
- 🎯 **Contextual Understanding**: Focuses on the "why" behind changes, not just the "what"
- 🌐 **Multi-AI Provider Support**: Integrates with various AI providers (Anthropic, OpenAI, Mistral, and Ollama)
- 🔍 **Smart Diff Analysis**: Automatically analyzes staged Git changes
- ✏️ **Editable Suggestions**: Edit AI-generated commit messages before applying them
- 📋 **Copy to Clipboard**: Easy one-click copying of generated messages
- 🧩 **VSCode Integration**: Seamlessly integrates with your Git workflow in VSCode

## 💾 Installation

### From VSCode Marketplace

1. Open VSCode
2. Navigate to Extensions (or press `Ctrl+Shift+X`)
3. Search for "GitComAI"
4. Click "Install"

### Manual Installation

1. Download the `.vsix` file from the [latest release](https://github.com/Zaphkiel-Ivanovna/git-com-ai/releases)
2. In VSCode, go to Extensions
3. Click the "..." menu (top-right) and select "Install from VSIX..."
4. Select the downloaded file

## 🚀 Usage

1. Make changes to your code in a Git repository
2. Stage your changes (`git add .` or stage files in VSCode's Source Control panel)
3. Access GitComAI in one of these ways:
   - Click the "Generate Commit Message" button in the Source Control panel
   - Use the command palette (`Ctrl+Shift+P`) and search for "GitComAI: Generate Commit Message"
   - Use the assigned keyboard shortcut (if configured)
4. Review the AI-generated commit message
5. Edit the message if necessary
6. Apply the commit message directly or copy it to your clipboard

## ⚙️ Configuration

GitComAI can be configured through VSCode settings:

```json
{
  "gitcomai.anthropicApiKey": "YOUR_ANTHROPIC_API_KEY",
  "gitcomai.openaiApiKey": "YOUR_OPENAI_API_KEY",
  "gitcomai.mistralApiKey": "YOUR_MISTRAL_API_KEY",
  "gitcomai.ollamaBaseURL": "http://localhost:11434",
  "gitcomai.selectedModel": {
    "provider": "anthropic",
    "model": "claude-3-7-sonnet-latest"
  },
  "gitcomai.debug": false
}
```

### Available Settings

| Setting                    | Description                            | Default                                                           |
| -------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `gitcomai.anthropicApiKey` | Your Anthropic API key                 | `null`                                                            |
| `gitcomai.openaiApiKey`    | Your OpenAI API key                    | `null`                                                            |
| `gitcomai.mistralApiKey`   | Your Mistral API key                   | `null`                                                            |
| `gitcomai.ollamaBaseURL`   | Base URL for Ollama API                | `"http://localhost:11434"`                                        |
| `gitcomai.selectedModel`   | Selected AI model configuration        | `{ "provider": "anthropic", "model": "claude-3-7-sonnet-latest"}` |
| `gitcomai.debug`           | Enable debug mode for detailed logging | `false`                                                           |

## 🔍 How It Works

GitComAI operates in four main steps:

1. **Diff Analysis**: When triggered, the extension retrieves the currently staged Git changes using the `git diff --staged` command.

2. **Prompt Construction**: The extension combines your code changes with a carefully crafted prompt template (located in `resources/commit-prompt.md`) that instructs the AI on how to generate a commit message following the GitMoji and Conventional Commits specifications.

3. **AI Processing**: The constructed prompt is sent to the configured AI model (Anthropic Claude by default), which analyzes the code changes to understand:

   - The type of change (feature, bug fix, refactor, etc.)
   - The scope of the change (which component or module is affected)
   - A concise description of the change
   - Appropriate emoji to represent the change type

4. **Message Generation**: The AI returns a structured commit message, which the extension parses and presents to you for review and use.

## 💻 Development

### Project Structure

```
GitComAI/
├── .eslintrc.json # ESLint configuration
├── .vscodeignore # Files to ignore when packaging
├── README.md # Project documentation
├── tsconfig.json # TypeScript configuration
├── webpack.config.js # Webpack configuration
├── resources/
│ └── commit-prompt.md # AI prompt template for commit messages
└── src/
├── extension.ts # Extension entry point
├── logger.ts # Logging utility
├── gitService.ts # Git operations service
├── uiHandler.ts # UI interaction handler
├── commitSchema.ts # Commit message schema definitions
└── ai/
├── aiService.ts # AI service integration
└── promptLoader.ts # Prompt loading utility
```

### Setting Up Development Environment

1. **Prerequisites**:

   - Node.js (v14 or later)
   - npm or yarn
   - Git
   - VSCode

2. **Clone the repository**:

   ```bash
   git clone https://github.com/Zaphkiel-Ivanovna/git-com-ai.git
   cd gitcomai
   ```

3. **Install dependencies**:

   ```bash
   npm install

   # or

   yarn install
   ```

### Building the Extension

1. **Compile the extension**:

   ```bash
   npm run compile

   # or

   yarn compile
   ```

2. **Watch for changes** (development mode):

   ```bash
   npm run watch

   # or

   yarn watch
   ```

3. **Launch the extension in debug mode**:
   - Press `F5` in VSCode to launch a new VSCode instance with the extension loaded
   - Or use the "Run Extension" launch configuration in VSCode

### Testing

Run the tests with:

```bash
npm run test

# or

yarn test
```

### Packaging

Create a VSIX package for distribution:

```bash
npm run package

# or

yarn package
```

The VSIX file will be created in the project root directory.

## ❓ FAQ

**Q: Do I need an API key to use this extension?**  
A: Yes, you need at least one API key from Anthropic, OpenAI, or Mistral, or you can use Ollama locally.

**Q: How much does it cost to use this extension?**  
A: The extension itself is free, but you'll need to pay for API usage according to your chosen provider's pricing.

**Q: Does the extension send my code to external servers?**  
A: The extension only sends the git diff (changes) to the AI API, not your entire codebase.

**Q: Can I use this with non-English codebases?**  
A: Yes, though the generated commit messages will be in English as per convention.

**Q: Can I customize the commit message format?**  
A: Currently, the format follows the GitMoji and Conventional Commits standards. Custom formats are planned for future releases.

## 🔧 Troubleshooting

**Issue: No commit message is generated**

- Ensure you have valid API keys configured
- Check that you have staged changes in Git
- Review the GitComAI output channel in VSCode for error messages

**Issue: Error about missing API key**

- Add your API key in VSCode settings
- Restart VSCode after adding the key

**Issue: Generated messages are not relevant**

- Ensure your staged changes are focused and related
- Try using a more powerful AI model in the settings

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes using conventional commits
6. Push to your branch (`git push origin feature/my-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

For issues and feature requests, please [open an issue](https://github.com/Zaphkiel-Ivanovna/git-com-ai/issues).
