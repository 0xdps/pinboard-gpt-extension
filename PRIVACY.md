# Privacy & Permissions

> **Purpose**: This file contains permission justifications and privacy statements required by the Chrome Web Store.
> Copy the relevant sections below into the "Privacy Practices" tab when submitting your extension.

## Permission Justifications

These justifications explain why each permission is necessary for GPT Pinboard to function.

### contextMenus
**Justification**: Enables a right-click context menu to quickly pin selected text from ChatGPT conversations. This is a user-initiated action to save selected content as a pin.

### host permissions (https://chatgpt.com/*, https://chat.openai.com/*)
**Justification**: Required to interact with ChatGPT conversation pages for pinning and highlighting functionality. All interactions are performed only on these domains and only after the user initiates actions.

### remote code
**Justification**: GPT Pinboard does not load or execute any remote code. All scripts and resources are bundled with the extension; no external code is fetched or executed at runtime.

### storage
**Justification**: Used to save user pins locally in IndexedDB (via our idb wrapper). No pin data is transmitted off-device.

### tabs
**Justification**: Helps locate or open ChatGPT tabs so a pin can be highlighted in the correct context. We only query and switch tabs to the target URL when the user triggers navigation through the popup or pin action.

## Privacy Statements

### Single Purpose Description
Pin individual ChatGPT messages or entire conversations for instant access later. Navigate long chats with Chat Outline and never lose that perfect answer.

### Detailed Description
GPT Pinboard saves and organizes individual ChatGPT messages or entire conversations locally. Use Chat Outline to navigate long conversations instantly. Add custom names and tags, search by text or tags, filter between message and chat pins, and jump directly back to the original conversation. All data stays on your device for complete privacy.

### Data Use Certification
All pin data is stored locally in the browser and is not sent to any external servers. No analytics or remote tracking is used.
