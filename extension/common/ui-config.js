/**
 * UI Configuration Constants
 * Centralized configuration for all UI-related values including z-indexes, timeouts, colors, and animations
 */

const UI_CONFIG = {
  // Z-Index Levels (follow stacking context hierarchy)
  zIndex: {
    pinButton: 10000,              // Pin button on ChatGPT
    chatOutlineButton: 10000,      // Chat outline button
    dropdown: 10001,               // Dropdown menus
    dialog: 100000,                // Main dialogs and modals
    modal: 100000,                 // Modal overlays
    upgradeNotification: 100001,   // Upgrade notifications (above dialogs)
    tooltip: 1                     // Tooltips (relative positioning)
  },

  // Animation & Timing (in milliseconds)
  timing: {
    notificationDuration: 2000,    // How long notifications are shown
    navigationWait: 500,            // Wait time before smooth scroll after jump to message
    navigationPolling: 1500,        // Total polling time for navigation
    navigationPollInterval: 100,    // Interval between poll attempts
    debounceDelay: 150,            // Debounce delay for UI interactions
    fadeOutDuration: 300,          // Fade out animation duration
    slideInDuration: 300,          // Slide in animation duration
    transitionDuration: 200        // General transition duration
  },

  // Dialog & Modal Styling
  dialog: {
    maxWidth: '500px',
    padding: '24px',
    borderRadius: '12px',
    boxShadowBlur: '60px',
    backdropFilter: 'blur(4px)'
  },

  // Colors (Light Mode)
  colors: {
    light: {
      // Primary
      primary: '#1a73e8',
      primaryLight: '#e8f0fe',
      primaryText: '#ffffff',
      
      // Neutral
      background: '#ffffff',
      surface: '#f8f9fa',
      border: '#dadce0',
      text: '#202124',
      textSecondary: '#5f6368',
      textTertiary: '#80868b',
      
      // Backgrounds
      inputBg: '#ffffff',
      previewBg: '#f8f9fa',
      tagBg: '#e8f0fe',
      cancelBg: '#ffffff',
      
      // Borders
      inputBorder: '#dadce0',
      previewBorder: '#e8eaed',
      
      // Semantic
      success: '#10a37f',
      error: '#d33b27',
      warning: '#f57c00',
      info: '#1a73e8'
    },
    dark: {
      // Primary
      primary: '#4f46e5',
      primaryLight: '#1e3a8a',
      primaryText: '#ffffff',
      
      // Neutral
      background: '#2d2d2d',
      surface: '#1a1a1a',
      border: '#404040',
      text: '#e4e4e4',
      textSecondary: '#b8b8b8',
      textTertiary: '#808080',
      
      // Backgrounds
      inputBg: '#1a1a1a',
      previewBg: '#1a1a1a',
      tagBg: '#1a3d5f',
      cancelBg: '#1a1a1a',
      
      // Borders
      inputBorder: '#404040',
      previewBorder: '#404040',
      
      // Semantic
      success: '#10a37f',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    }
  },

  // Button Styling
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transitionDuration: '0.2s'
  },

  // Input Styling
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    transitionDuration: '0.2s'
  },

  // Tag System
  tags: {
    maxPerPin: 3,
    maxLengthPerTag: 50,
    minLengthPerTag: 1
  },

  // Message Navigation
  navigation: {
    messageContainerSelector: '[data-message-author-role]',
    mainContentSelector: 'main',
    pollingAttempts: 5,
    scrollBehavior: 'smooth'
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UI_CONFIG };
}
