# Privacy & Permissions Justifications for PinGPT

These justifications are ready to copy into the Chrome Web Store "Privacy Practices" tab.

- activeTab
  - Justification: Allows PinGPT to access the currently active ChatGPT tab so it can open, navigate, and highlight the original conversation when the user clicks a pin. We only act on the tab the user interacts with; no data is accessed without user action.

- contextMenus
  - Justification: Enables a right-click context menu to quickly pin selected text from ChatGPT conversations. This is a user-initiated action to save selected content as a pin.

- host permissions (https://chatgpt.com/*, https://chat.openai.com/*)
  - Justification: Required to interact with ChatGPT conversation pages for pinning and highlighting functionality. All interactions are performed only on these domains and only after the user initiates actions.

- remote code
  - Justification: PinGPT does not load or execute any remote code. All scripts and resources are bundled with the extension; no external code is fetched or executed at runtime.

- scripting
  - Justification: Used to programmatically inject content scripts and highlight elements in ChatGPT pages. This is necessary to restore page state and visually locate pinned messages when the user requests it.

- storage
  - Justification: Used to save user pins locally in IndexedDB (via our idb wrapper). No pin data is transmitted off-device.

- tabs
  - Justification: Helps locate or open ChatGPT tabs so a pin can be highlighted in the correct context. We only query and switch tabs to the target URL when the user triggers navigation through the popup or pin action.


# Short descriptions for the listing

- Single purpose description: Pin important ChatGPT messages, add notes, and jump back to them instantly.

- Detailed description (25+ chars): PinGPT saves and organizes ChatGPT messages locally. Add names and tags to pins, search them, and jump back directly to the original conversation. All data stays on your device.

- Data use certification: All pin data is stored locally in the browser and is not sent to any external servers. No analytics or remote tracking is used.
