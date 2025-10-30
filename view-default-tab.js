class ViewDefaultTab {
  
  constructor() {
    this.initialized = false;
    this.baseDashboardUrl = null; // Store the dashboard base URL (without tab index)
    this.originalTabIndex = null; // Store the original tab when script first loads
    this.init();
  }
  
  init() {
    // Wait for Home Assistant to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }
  
  start() {
    // Get the base dashboard URL when script first loads
    this.setBaseDashboardUrl();
    // Setup URL change listeners for navigation detection
    this.setupUrlChangeListeners();
    // Observe for changes in the DOM to catch dashboard loads
    this.observeChanges();
    // Try initial check
    this.checkAndRedirect();
  }
  
  setBaseDashboardUrl() {
    const currentUrl = window.location.pathname;
    console.log('ViewDefaultTab KNUTS: Current URL on load:', currentUrl);
    
    // Extract base dashboard URL (everything before the last slash and number)
    // e.g. "/dashboard-test/0" becomes "/dashboard-test"
    const lastSlashIndex = currentUrl.lastIndexOf('/');
    if (lastSlashIndex > 0) {
      const afterSlash = currentUrl.substring(lastSlashIndex + 1);
      
      // Check if what's after the slash is a number (tab index)
      if (/^\d+$/.test(afterSlash)) {
        this.baseDashboardUrl = currentUrl.substring(0, lastSlashIndex);
        this.originalTabIndex = parseInt(afterSlash);
      } else {
        // No tab index in URL, use full path as base
        this.baseDashboardUrl = currentUrl;
        this.originalTabIndex = 0;
      }
    } else {
      this.baseDashboardUrl = currentUrl;
      this.originalTabIndex = 0;
    }
    
    console.log('ViewDefaultTab KNUTS: Base dashboard URL:', this.baseDashboardUrl);
    console.log('ViewDefaultTab KNUTS: Original tab index:', this.originalTabIndex);
  }
  
  isMenuNavigation() {
    const currentUrl = window.location.pathname;
    console.log('ViewDefaultTab KNUTS: Checking navigation type');
    console.log('ViewDefaultTab KNUTS: Current URL:', currentUrl);
    console.log('ViewDefaultTab KNUTS: Base dashboard URL:', this.baseDashboardUrl);
    console.log('ViewDefaultTab KNUTS: Original tab index:', this.originalTabIndex);
    
    // Extract current tab index from URL
    const lastSlashIndex = currentUrl.lastIndexOf('/');
    let currentTabIndex = 0;
    
    if (lastSlashIndex > 0) {
      const afterSlash = currentUrl.substring(lastSlashIndex + 1);
      if (/^\d+$/.test(afterSlash)) {
        currentTabIndex = parseInt(afterSlash);
      }
    }
    
    console.log('ViewDefaultTab KNUTS: Current tab index:', currentTabIndex);
    
    // If current URL matches the original URL (same tab index), it's menu navigation
    // If tab index is different, it was a tab click
    const isMenuNav = (currentTabIndex === this.originalTabIndex);
    console.log('ViewDefaultTab KNUTS: Is menu navigation?', isMenuNav);
    
    return isMenuNav;
  }
  
  setupUrlChangeListeners() {
    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', () => {
      console.log('ViewDefaultTab KNUTS: Popstate event detected');
      setTimeout(() => this.checkAndRedirect(), 100);
    });
    
    // Listen for hashchange events
    window.addEventListener('hashchange', () => {
      console.log('ViewDefaultTab KNUTS: Hash change event detected');
      setTimeout(() => this.checkAndRedirect(), 100);
    });
    
    // Override history.pushState to catch programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      console.log('ViewDefaultTab KNUTS: History pushState detected');
      originalPushState.apply(history, args);
      setTimeout(() => this.checkAndRedirect(), 100);
    };
  }
  
  observeChanges() {
    const observer = new MutationObserver(() => {
      this.checkAndRedirect();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  checkAndRedirect() {
    try {
      console.log('ViewDefaultTab KNUTS: 🔍 CheckAndRedirect called');
      
      // Only redirect if this is menu navigation (not tab navigation)
      if (!this.isMenuNavigation()) {
        console.log('ViewDefaultTab KNUTS: ⏸️ SKIPPING REDIRECT - Tab click navigation detected');
        return;
      }
      
      console.log('ViewDefaultTab KNUTS: ✅ Menu navigation detected - proceeding with redirect check');
      
      // Get the main Home Assistant elements
      const homeAssistant = document.querySelector('home-assistant');
      if (!homeAssistant) {
        console.log('ViewDefaultTab KNUTS: ❌ home-assistant element not found');
        return;
      }
      
      const root = homeAssistant.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;
      if (!root) {
        console.log('ViewDefaultTab KNUTS: ❌ home-assistant-main shadowRoot not found');
        return;
      }
      
      // Find the Lovelace panel
      const panel = root.querySelector('ha-panel-lovelace');
      if (!panel) {
        console.log('ViewDefaultTab KNUTS: ❌ ha-panel-lovelace not found');
        return;
      }
      
      const uiRoot = panel.shadowRoot?.querySelector('hui-root');
      if (!uiRoot) {
        console.log('ViewDefaultTab KNUTS: ❌ hui-root not found');
        return;
      }
      
      // Don't redirect in edit mode
      const isEditing = uiRoot.shadowRoot?.querySelector('.edit-mode');
      if (isEditing) {
        console.log('ViewDefaultTab KNUTS: ✏️ Edit mode detected, skipping redirect');
        return;
      }
      
      // Get the dashboard configuration
      const config = this.getDashboardConfig(uiRoot);
      if (!config || !config.view_default_tab || !config.view_default_tab.users) {
        console.log('ViewDefaultTab KNUTS: ❌ No view_default_tab configuration found');
        return;
      }
      
      // Get current user from hass object
      const hass = this.getHassObject();
      if (!hass || !hass.user) {
        console.log('ViewDefaultTab KNUTS: ❌ Hass object or user not found');
        return;
      }
      
      const currentUser = hass.user.name;
      console.log('ViewDefaultTab KNUTS: Current user:', currentUser);
      
      // Find configuration for current user
      const userConfig = config.view_default_tab.users.find(user => user.username === currentUser);
      if (!userConfig) {
        console.log('ViewDefaultTab KNUTS: ❌ No configuration found for user:', currentUser);
        return;
      }
      
      console.log('ViewDefaultTab KNUTS: User config found:', userConfig);
      
      // Get the tab group
      const tabs = uiRoot.shadowRoot?.querySelector('ha-tab-group');
      if (!tabs || !tabs.tabs) {
        console.log('ViewDefaultTab KNUTS: ❌ ha-tab-group or tabs not found');
        return;
      }
      
      const tabList = tabs.tabs;
      const targetTabIndex = userConfig.default_tab;
      
      // Validate tab index
      if (targetTabIndex < 0 || targetTabIndex >= tabList.length) {
        console.warn(`View Default Tab KNUTS: Invalid tab index ${targetTabIndex} for user ${currentUser}`);
        return;
      }
      
      // Get currently active tab
      const activeTab = Array.from(tabList).findIndex(tab => tab.hasAttribute('selected'));
      console.log('ViewDefaultTab KNUTS: Current active tab:', activeTab, 'Target tab:', targetTabIndex);
      
      // If we're already on the target tab, don't redirect
      if (activeTab === targetTabIndex) {
        console.log('ViewDefaultTab KNUTS: ✅ Already on target tab, no redirect needed');
        return;
      }
      
      // Perform the redirect
      console.log('ViewDefaultTab KNUTS: 🚀 Performing redirect to tab', targetTabIndex);
      setTimeout(() => {
        console.log(`View Default Tab KNUTS: Redirecting user ${currentUser} to tab ${targetTabIndex} (menu navigation detected)`);
        tabList[targetTabIndex].click();
      }, 100);
      
    } catch (error) {
      console.error('View Default Tab KNUTS Error:', error);
    }
  }
  
  getDashboardConfig(uiRoot) {
    try {
      // Get the dashboard config from hui-root
      const huiRoot = uiRoot;
      if (huiRoot && huiRoot.config) {
        return huiRoot.config;
      }
      
      // Alternative method: try to get from _config property
      if (huiRoot && huiRoot._config) {
        return huiRoot._config;
      }
      
      // Another alternative: check if config is in the lovelace object
      const homeAssistant = document.querySelector('home-assistant');
      if (homeAssistant && homeAssistant.hass && homeAssistant.hass.panels && homeAssistant.hass.panels.lovelace) {
        const lovelaceConfig = homeAssistant.hass.panels.lovelace.config;
        if (lovelaceConfig) {
          return lovelaceConfig;
        }
      }
      
      return null;
    } catch (error) {
      console.error('View Default Tab KNUTS: Error getting dashboard config:', error);
      return null;
    }
  }
  
  getHassObject() {
    try {
      const homeAssistant = document.querySelector('home-assistant');
      return homeAssistant?.hass || null;
    } catch (error) {
      console.error('View Default Tab KNUTS: Error getting hass object:', error);
      return null;
    }
  }
}

// Initialize the plugin when the script loads
new ViewDefaultTab();

console.info('%c VIEW-DEFAULT-TAB-KNUTS %c Version 1.0.0 ', 'color: orange; font-weight: bold; background: black', 'color: white; font-weight: bold; background: dimgray');