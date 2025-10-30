class ViewDefaultTab {
  
  constructor() {
    this.hasRedirected = false; // Simple flag to ensure we only redirect once per dashboard load
    this.currentDashboard = null; // Track which dashboard we're on
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
    // Listen for URL changes (SPA navigation)
    this.setupNavigationListeners();
    
    // Try immediate redirect
    this.tryRedirect();
    
    // Also set up observer for when DOM is ready (in case elements aren't loaded yet)
    this.waitForDashboard();
  }
  
  setupNavigationListeners() {
    // Listen for URL changes in SPA
    let lastUrl = location.href;
    
    // Override pushState to catch programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.onNavigationChange(), 100);
    };
    
    // Override replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.onNavigationChange(), 100);
    };
    
    // Listen for popstate (back/forward)
    window.addEventListener('popstate', () => {
      setTimeout(() => this.onNavigationChange(), 100);
    });
    
    // Fallback: periodically check URL
    setInterval(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.onNavigationChange();
      }
    }, 1000);
  }
  
  onNavigationChange() {
    const currentFullPath = window.location.pathname;
    
    // Extract dashboard base from both current and previous paths
    const currentDashboardBase = this.extractDashboardBase(currentFullPath);
    const previousDashboardBase = this.currentDashboard ? this.extractDashboardBase(this.currentDashboard) : null;
    
    if (currentDashboardBase !== previousDashboardBase) {
      this.currentDashboard = currentFullPath;
      this.hasRedirected = false; // Reset flag for new dashboard
      
      // Try redirect on new dashboard
      setTimeout(() => this.tryRedirect(), 200);
    } else {
      // Update current path but don't reset flag
      this.currentDashboard = currentFullPath;
    }
  }
  
  extractDashboardBase(path) {
    if (!path) return null;
    
    // For paths like /dashboard-test/tibe, /dashboard-test/master, /dashboard-test/0
    // Extract just the dashboard part: /dashboard-test
    const segments = path.split('/').filter(segment => segment !== '');
    
    if (segments.length >= 2) {
      // Return first two segments: /dashboard-test
      return '/' + segments[0];
    }
    
    return path;
  }
  
  waitForDashboard() {
    const checkInterval = setInterval(() => {
      if (this.hasRedirected) {
        clearInterval(checkInterval);
        return;
      }
      
      if (this.tryRedirect()) {
        clearInterval(checkInterval);
      }
    }, 500); // Check every 500ms
    
    // Stop trying after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  tryRedirect() {
    if (this.hasRedirected) {
      return true;
    }
    
    try {
      // Get the main Home Assistant elements
      const homeAssistant = document.querySelector('home-assistant');
      if (!homeAssistant) {
        return false;
      }
      
      const root = homeAssistant.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;
      if (!root) {
        return false;
      }
      
      // Find the Lovelace panel
      const panel = root.querySelector('ha-panel-lovelace');
      if (!panel) {
        return false;
      }
      
      const uiRoot = panel.shadowRoot?.querySelector('hui-root');
      if (!uiRoot) {
        return false;
      }
      
      // Don't redirect in edit mode
      const isEditing = uiRoot.shadowRoot?.querySelector('.edit-mode');
      if (isEditing) {
        this.hasRedirected = true; // Mark as done so we don't keep trying
        return true;
      }
      
      // Get the dashboard configuration
      const config = this.getDashboardConfig(uiRoot);
      if (!config || !config.view_default_tab || !config.view_default_tab.users) {
        this.hasRedirected = true; // Mark as done - no config means no redirect needed
        return true;
      }
      
      // Get current user from hass object
      const hass = this.getHassObject();
      if (!hass || !hass.user) {
        return false;
      }
      
      const currentUser = hass.user.name;
      
      // Find configuration for current user
      const userConfig = config.view_default_tab.users.find(user => user.username === currentUser);
      if (!userConfig) {
        this.hasRedirected = true; // Mark as done - no user config means no redirect needed
        return true;
      }
      
      // Get the tab group
      const tabs = uiRoot.shadowRoot?.querySelector('ha-tab-group');
      if (!tabs || !tabs.tabs) {
        return false;
      }
      
      const tabList = tabs.tabs;
      const targetTabIndex = userConfig.default_tab;
      
      // Validate tab index
      if (targetTabIndex < 0 || targetTabIndex >= tabList.length) {
        this.hasRedirected = true; // Mark as done - invalid config
        return true;
      }
      
      // Get currently active tab
      const activeTab = Array.from(tabList).findIndex(tab => tab.hasAttribute('selected'));
      
      // If we're already on the target tab, don't redirect
      if (activeTab === targetTabIndex) {
        this.hasRedirected = true;
        return true;
      }
      
      // Perform the redirect
      tabList[targetTabIndex].click();
      this.hasRedirected = true; // Mark as done
      return true;
      
    } catch (error) {
      return false;
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
      return null;
    }
  }
  
  getHassObject() {
    try {
      const homeAssistant = document.querySelector('home-assistant');
      return homeAssistant?.hass || null;
    } catch (error) {
      return null;
    }
  }
}

// Initialize the plugin when the script loads
new ViewDefaultTab();

console.info('%c VIEW-DEFAULT-TAB-KNUTS %c Version 1.0.0 ', 'color: orange; font-weight: bold; background: black', 'color: white; font-weight: bold; background: dimgray');