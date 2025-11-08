// Universal browser API wrapper for extension background scripts
const getBrowserAPI = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return {
      runtime: chrome.runtime,
      contextMenus: chrome.contextMenus,
      storage: chrome.storage,
      tabs: chrome.tabs
    };
  } else if (typeof browser !== 'undefined' && browser.runtime) {
    return {
      runtime: browser.runtime,
      contextMenus: browser.contextMenus,
      storage: browser.storage,
      tabs: browser.tabs
    };
  }
  throw new Error('No browser API available');
};

// Shared extension functionality
class GPTPinboardBackground {
  constructor() {
    this.api = getBrowserAPI();
    this.init();
  }

  init() {
    this.api.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    this.api.runtime.onMessageExternal.addListener(this.handleExternalMessage.bind(this));
    this.api.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));
    this.api.runtime.setUninstallURL('https://gptpins.dps.codes/goodbye.html');
  }

  async handleInstall(details) {
    const { enableContextMenu } = await this.api.storage.local.get(['enableContextMenu']);
    
    if (enableContextMenu === true) {
      this.createContextMenu();
    }

    if (details.reason === 'install') {
      const installationData = {
        extensionId: this.api.runtime.id,
        installDate: new Date().toISOString(),
        installToken: this.generateInstallToken(),
        version: this.api.runtime.getManifest().version
      };
      
      await this.api.storage.local.set({ 'gpt-pinboard-install': installationData });
      this.api.tabs.create({ url: 'https://gptpins.dps.codes/welcome.html' });
    }
  }

  createContextMenu() {
    this.api.contextMenus.create({
      id: "pin-selection",
      title: "Pin selection to GPT Pinboard",
      contexts: ["selection"],
      documentUrlPatterns: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
    }, () => {
      if (this.api.runtime.lastError) {
        console.log('Context menu already exists or error:', this.api.runtime.lastError.message);
      }
    });
  }

  removeContextMenu() {
    this.api.contextMenus.remove("pin-selection", () => {
      if (this.api.runtime.lastError) {
        console.log('Context menu not found or error:', this.api.runtime.lastError.message);
      }
    });
  }

  generateInstallToken() {
    return 'gpt-pin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  handleExternalMessage(request, sender, sendResponse) {
    if (request.action === 'verify-installation') {
      const allowedOrigins = [
        'https://gptpins.dps.codes',
        'http://localhost:8080',
        'https://localhost:8080'
      ];

      if (allowedOrigins.includes(sender.origin)) {
        this.api.storage.local.get(['gpt-pinboard-install'], (result) => {
          const installData = result['gpt-pinboard-install'];
          if (installData) {
            sendResponse({
              verified: true,
              extensionId: this.api.runtime.id,
              installToken: installData.installToken,
              installDate: installData.installDate,
              version: installData.version
            });
          } else {
            sendResponse({ verified: false });
          }
        });
        return true;
      }
    }
  }

  handleContextMenuClick(info, tab) {
    console.log('GPT Pinboard: Context menu clicked', info);
    if (info.menuItemId === 'pin-selection') {
      console.log('GPT Pinboard: Pin selection clicked, text:', info.selectionText);
      
      if (!tab?.id) {
        console.error('GPT Pinboard: No active tab found');
        return;
      }

      // Check if the tab is a valid ChatGPT page
      const validUrls = ['https://chatgpt.com/', 'https://chat.openai.com/'];
      const isValidUrl = validUrls.some(url => tab.url.startsWith(url));
      
      if (!isValidUrl) {
        console.error('GPT Pinboard: Invalid URL for context menu action');
        return;
      }

      // Send message to content script to pin the selection
      this.api.tabs.sendMessage(tab.id, {
        action: 'pin-selection',
        selectionText: info.selectionText,
        pageUrl: tab.url,
        pageTitle: tab.title
      }).catch(error => {
        console.error('GPT Pinboard: Error sending message to content script:', error);
      });
    }
  }

  // Exposed methods for settings management
  async updateContextMenu(enabled) {
    if (enabled) {
      this.createContextMenu();
    } else {
      this.removeContextMenu();
    }
  }
}

// Initialize the background script
new GPTPinboardBackground();