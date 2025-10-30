class ViewDefaultTab {
  
  constructor() {
    this.hasRedirected = false; // Simple flag to ensure we only redirect once per dashboard load
    this.currentDashboard = null; // Track which dashboard we're on
    this.init();
  }
  
  init() {
    console.log('ViewDefaultTab KNUTS: Initializing...');
    
    // Wait for Home Assistant to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }
  
  start() {
    console.log('ViewDefaultTab KNUTS: Starting...');
    
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
    const newDashboard = this.getCurrentDashboardPath();
    const currentFullPath = window.location.pathname;
    
    console.log('ViewDefaultTab KNUTS: Navigation detected - Full path:', currentFullPath);
    console.log('ViewDefaultTab KNUTS: Dashboard path:', newDashboard);
    console.log('ViewDefaultTab KNUTS: Previous dashboard:', this.currentDashboard);
    
    if (newDashboard !== this.currentDashboard) {
      console.log('ViewDefaultTab KNUTS: 🔄 DIFFERENT DASHBOARD detected - from', this.currentDashboard, 'to', newDashboard);
      this.currentDashboard = newDashboard;
      this.hasRedirected = false; // Reset flag for new dashboard
      
      // Try redirect on new dashboard
      setTimeout(() => this.tryRedirect(), 200);
    } else {
      console.log('ViewDefaultTab KNUTS: ⏸️ SAME DASHBOARD - tab navigation within', newDashboard, '- NOT resetting flag');
    }
  }
  
  getCurrentDashboardPath() {
    const path = window.location.pathname;
    
    // Split path into segments
    const segments = path.split('/').filter(segment => segment !== '');
    
    if (segments.length < 1) {
      return path;
    }
    
    // For paths like /dashboard-test/tibe or /dashboard-test/menthe
    // We want to return /dashboard-test only if the last segment is a TAB INDEX (number)
    // If last segment is a named tab (like 'tibe', 'menthe'), keep the full path as dashboard
    
    const lastSegment = segments[segments.length - 1];
    
    // If last segment is purely numeric, it's a tab index - remove it to get dashboard
    if (/^\d+$/.test(lastSegment)) {
      // Remove the numeric tab index
      return '/' + segments.slice(0, -1).join('/');
    } else {
      // Last segment is not numeric (named tab or dashboard), keep full path
      return path;
    }
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
      console.log('ViewDefaultTab KNUTS: Stopped trying after timeout');
    }, 10000);
  }
  
  tryRedirect() {
    if (this.hasRedirected) {
      console.log('ViewDefaultTab KNUTS: Already redirected, skipping');
      return true;
    }
    
    try {
      console.log('ViewDefaultTab KNUTS: 🔍 Trying redirect...');
      
      // Get the main Home Assistant elements
      const homeAssistant = document.querySelector('home-assistant');
      if (!homeAssistant) {
        console.log('ViewDefaultTab KNUTS: ❌ home-assistant element not found');
        return false;
      }
      
      const root = homeAssistant.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;
      if (!root) {
        console.log('ViewDefaultTab KNUTS: ❌ home-assistant-main shadowRoot not found');
        return false;
      }
      
      // Find the Lovelace panel
      const panel = root.querySelector('ha-panel-lovelace');
      if (!panel) {
        console.log('ViewDefaultTab KNUTS: ❌ ha-panel-lovelace not found');
        return false;
      }
      
      const uiRoot = panel.shadowRoot?.querySelector('hui-root');
      if (!uiRoot) {
        console.log('ViewDefaultTab KNUTS: ❌ hui-root not found');
        return false;
      }
      
      // Don't redirect in edit mode
      const isEditing = uiRoot.shadowRoot?.querySelector('.edit-mode');
      if (isEditing) {
        console.log('ViewDefaultTab KNUTS: ✏️ Edit mode detected, skipping redirect');
        this.hasRedirected = true; // Mark as done so we don't keep trying
        return true;
      }
      
      // Get the dashboard configuration
      const config = this.getDashboardConfig(uiRoot);
      if (!config || !config.view_default_tab || !config.view_default_tab.users) {
        console.log('ViewDefaultTab KNUTS: ❌ No view_default_tab configuration found');
        this.hasRedirected = true; // Mark as done - no config means no redirect needed
        return true;
      }
      
      // Get current user from hass object
      const hass = this.getHassObject();
      if (!hass || !hass.user) {
        console.log('ViewDefaultTab KNUTS: ❌ Hass object or user not found');
        return false;
      }
      
      const currentUser = hass.user.name;
      console.log('ViewDefaultTab KNUTS: Current user:', currentUser);
      
      // Find configuration for current user
      const userConfig = config.view_default_tab.users.find(user => user.username === currentUser);
      if (!userConfig) {
        console.log('ViewDefaultTab KNUTS: ❌ No configuration found for user:', currentUser);
        this.hasRedirected = true; // Mark as done - no user config means no redirect needed
        return true;
      }
      
      console.log('ViewDefaultTab KNUTS: User config found:', userConfig);
      
      // Get the tab group
      const tabs = uiRoot.shadowRoot?.querySelector('ha-tab-group');
      if (!tabs || !tabs.tabs) {
        console.log('ViewDefaultTab KNUTS: ❌ ha-tab-group or tabs not found');
        return false;
      }
      
      const tabList = tabs.tabs;
      const targetTabIndex = userConfig.default_tab;
      
      // Validate tab index
      if (targetTabIndex < 0 || targetTabIndex >= tabList.length) {
        console.warn(`View Default Tab KNUTS: Invalid tab index ${targetTabIndex} for user ${currentUser}`);
        this.hasRedirected = true; // Mark as done - invalid config
        return true;
      }
      
      // Get currently active tab
      const activeTab = Array.from(tabList).findIndex(tab => tab.hasAttribute('selected'));
      console.log('ViewDefaultTab KNUTS: Current active tab:', activeTab, 'Target tab:', targetTabIndex);
      
      // If we're already on the target tab, don't redirect
      if (activeTab === targetTabIndex) {
        console.log('ViewDefaultTab KNUTS: ✅ Already on target tab, no redirect needed');
        this.hasRedirected = true;
        return true;
      }
      
      // Perform the redirect
      console.log('ViewDefaultTab KNUTS: 🚀 Performing ONE-TIME redirect to tab', targetTabIndex);
      console.log(`View Default Tab KNUTS: Redirecting user ${currentUser} to tab ${targetTabIndex} (page load)`);
      
      tabList[targetTabIndex].click();
      this.hasRedirected = true; // Mark as done
      return true;
      
    } catch (error) {
      console.error('View Default Tab KNUTS Error:', error);
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