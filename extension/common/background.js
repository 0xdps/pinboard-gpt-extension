// Universal browser API wrapper for extension background scripts
const getBrowserAPI = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return {
      runtime: chrome.runtime,
      storage: chrome.storage,
      tabs: chrome.tabs
    };
  } else if (typeof browser !== 'undefined' && browser.runtime) {
    return {
      runtime: browser.runtime,
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
    this.api.runtime.setUninstallURL('https://gptpins.dps.codes/goodbye.html');
  }

  async handleInstall(details) {
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


}

// Initialize the background script
new GPTPinboardBackground();