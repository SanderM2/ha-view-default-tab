class ViewDefaultTab {
  
  constructor() {
    this.initialized = false;
    this.currentPath = null;
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
    // Observe for changes in the DOM to catch dashboard loads
    this.observeChanges();
    // Try initial check
    this.checkAndRedirect();
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
      // Check if this is a new page load by monitoring URL path changes
      const currentPath = window.location.pathname + window.location.hash;
      const isNewPageLoad = !this.initialized || this.currentPath !== currentPath;
      
      if (!isNewPageLoad) {
        return; // Not a new page load, don't redirect
      }
      
      // Update tracking variables
      this.currentPath = currentPath;
      this.initialized = true;
      
      // Get the main Home Assistant elements
      const homeAssistant = document.querySelector('home-assistant');
      if (!homeAssistant) return;
      
      const root = homeAssistant.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;
      if (!root) return;
      
      // Find the Lovelace panel
      const panel = root.querySelector('ha-panel-lovelace');
      if (!panel) return;
      
      const uiRoot = panel.shadowRoot?.querySelector('hui-root');
      if (!uiRoot) return;
      
      // Don't redirect in edit mode
      const isEditing = uiRoot.shadowRoot?.querySelector('.edit-mode');
      if (isEditing) return;
      
      // Get the dashboard configuration
      const config = this.getDashboardConfig(uiRoot);
      if (!config || !config.view_default_tab || !config.view_default_tab.users) return;
      
      // Get current user from hass object
      const hass = this.getHassObject();
      if (!hass || !hass.user) return;
      
      const currentUser = hass.user.name;
      
      // Find configuration for current user
      const userConfig = config.view_default_tab.users.find(user => user.username === currentUser);
      if (!userConfig) return;
      
      // Get the tab group
      const tabs = uiRoot.shadowRoot?.querySelector('ha-tab-group');
      if (!tabs || !tabs.tabs) return;
      
      const tabList = tabs.tabs;
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
      console.error('View Default Tab: Error getting dashboard config:', error);
      return null;
    }
  }
  
  getHassObject() {
    try {
      const homeAssistant = document.querySelector('home-assistant');
      return homeAssistant?.hass || null;
    } catch (error) {
      console.error('View Default Tab: Error getting hass object:', error);
      return null;
    }
  }
}

// Initialize the plugin when the script loads
new ViewDefaultTab();

console.info('%c VIEW-DEFAULT-TAB %c Version 1.0.0 ', 'color: orange; font-weight: bold; background: black', 'color: white; font-weight: bold; background: dimgray');