class ViewDefaultTabCard extends HTMLElement {
  
  constructor() {
    super();
    this._initialized = false;
    this._currentPath = null;
  }
  
  set hass(hass) {
    // Hide the card - it should be invisible
    this.style.display = 'none';
    
    // Don't run if no config or no users configured
    if (!this.config || !this.config.users || !Array.isArray(this.config.users)) {
      return;
    }
    
    try {
      // Check if this is a new page load by monitoring URL path changes
      const currentPath = window.location.pathname + window.location.hash;
      const isNewPageLoad = !this._initialized || this._currentPath !== currentPath;
      
      if (!isNewPageLoad) {
        return; // Not a new page load, don't redirect
      }
      
      // Update tracking variables
      this._currentPath = currentPath;
      this._initialized = true;
      
      // Get the main Home Assistant elements
      const homeAssistant = document.querySelector('home-assistant');
      if (!homeAssistant) return;
      
      const root = homeAssistant.shadowRoot.querySelector('home-assistant-main').shadowRoot;
      if (!root) return;
      
      // Find the Lovelace panel
      const panel = root.querySelector('ha-panel-lovelace');
      if (!panel) return;
      
      const uiRoot = panel.shadowRoot.querySelector('hui-root');
      if (!uiRoot) return;
      
      // Don't redirect in edit mode
      const isEditing = uiRoot.shadowRoot.querySelector('.edit-mode');
      if (isEditing) return;
      
      // Get the tab group
      const tabs = uiRoot.shadowRoot.querySelector('ha-tab-group');
      if (!tabs || !tabs.tabs) return;
      
      const tabList = tabs.tabs;
      const currentUser = hass.user.name;
      
      // Find configuration for current user
      const userConfig = this.config.users.find(user => user.username === currentUser);
      if (!userConfig) return;
      
      const targetTabIndex = userConfig.default_tab;
      
      // Validate tab index
      if (targetTabIndex < 0 || targetTabIndex >= tabList.length) {
        console.warn(`View Default Tab: Invalid tab index ${targetTabIndex} for user ${currentUser}`);
        return;
      }
      
      // Get currently active tab
      const activeTab = Array.from(tabList).findIndex(tab => tab.hasAttribute('selected'));
      
      // If we're already on the target tab, don't redirect
      if (activeTab === targetTabIndex) {
        return;
      }
      
      // Small delay to ensure UI is fully loaded before redirect
      setTimeout(() => {
        console.log(`View Default Tab: Redirecting user ${currentUser} to tab ${targetTabIndex} (new page load detected)`);
        tabList[targetTabIndex].click();
      }, 100);
      
    } catch (error) {
      console.error('View Default Tab Error:', error);
    }
  }
  
  setConfig(config) {
    // Validate configuration
    if (!config) {
      throw new Error('View Default Tab: No configuration provided');
    }
    
    if (!config.users || !Array.isArray(config.users)) {
      throw new Error('View Default Tab: You need to define users (array)');
    }
    
    if (config.users.length === 0) {
      throw new Error('View Default Tab: Users array cannot be empty');
    }
    
    // Validate each user configuration
    config.users.forEach((user, index) => {
      if (!user) {
        throw new Error(`View Default Tab: User at index ${index} is null or undefined`);
      }
      
      if (!user.username || typeof user.username !== 'string') {
        throw new Error(`View Default Tab: User at index ${index} needs a valid username (string)`);
      }
      
      if (user.default_tab === undefined || user.default_tab === null) {
        throw new Error(`View Default Tab: User '${user.username}' needs a default_tab (number)`);
      }
      
      if (typeof user.default_tab !== 'number' || !Number.isInteger(user.default_tab)) {
        throw new Error(`View Default Tab: User '${user.username}' default_tab must be an integer`);
      }
      
      if (user.default_tab < 0) {
        throw new Error(`View Default Tab: User '${user.username}' default_tab must be 0 or greater`);
      }
    });
    
    this.config = config;
  }
  
  // Required by Home Assistant - return card configuration
  getCardSize() {
    return 0; // Invisible card
  }
}

// Register the custom element
customElements.define('view-default-tab-card', ViewDefaultTabCard);

// Add to window for Lovelace
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'view-default-tab',
  name: 'View Default Tab Card',
  description: 'Automatically redirect users to their default tab',
  preview: false,
  documentationURL: 'https://github.com/SanderM2/ha-view-default-tab'
});

console.info('%c VIEW-DEFAULT-TAB-CARD %c Version 1.0.0 ', 'color: orange; font-weight: bold; background: black', 'color: white; font-weight: bold; background: dimgray');