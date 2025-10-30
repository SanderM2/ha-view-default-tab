class ViewDefaultTab {
  
  constructor() {
    this.initialized = false;
    this.currentPath = null;
    this.isTabNavigation = false; // Flag to track if navigation came from tab click
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
    // Setup tab click detection
    this.setupTabClickDetection();
    // Setup URL change listeners for menu navigation
    this.setupUrlChangeListeners();
    // Observe for changes in the DOM to catch dashboard loads
    this.observeChanges();
    // Try initial check
    this.checkAndRedirect();
  }
  
  setupTabClickDetection() {
    console.log('ViewDefaultTab KNUTS: Setting up tab click detection');
    
    // Listen for clicks specifically on tab elements
    document.addEventListener('click', (event) => {
      console.log('ViewDefaultTab KNUTS: 🖱️ CLICK DETECTED');
      console.log('ViewDefaultTab KNUTS: Click target:', event.target);
      
      const clickedElement = event.target;
      
      // Check multiple ways to detect if this is a tab click
      const isTabClick = this.isTabClickEvent(clickedElement);
      
      if (isTabClick) {
        console.log('ViewDefaultTab KNUTS: ✅ TAB CLICK DETECTED - Setting flag');
        this.isTabNavigation = true;
        
        // Reset flag after a short delay (but before the URL change happens)
        setTimeout(() => {
          console.log('ViewDefaultTab KNUTS: Resetting tab navigation flag');
          this.isTabNavigation = false;
        }, 500);
      } else {
        console.log('ViewDefaultTab KNUTS: ❌ Not a tab click');
      }
    }, true);
  }
  
  isTabClickEvent(element) {
    // Check if clicked element or any parent is a tab
    const tabElement = element.closest('ha-tab-group-tab');
    const tabWithRole = element.closest('[role="tab"]');
    const isInTabGroup = element.closest('ha-tab-group');
    
    // Also check element attributes directly
    const hasTabRole = element.getAttribute('role') === 'tab';
    const hasTabId = element.id && element.id.includes('tab');
    const isTabGroupTab = element.tagName === 'HA-TAB-GROUP-TAB';
    
    console.log('ViewDefaultTab KNUTS: Tab detection results:', {
      tabElement: !!tabElement,
      tabWithRole: !!tabWithRole, 
      isInTabGroup: !!isInTabGroup,
      hasTabRole,
      hasTabId,
      isTabGroupTab
    });
    
    return !!(tabElement || tabWithRole || isTabGroupTab || hasTabRole || 
             (isInTabGroup && hasTabId));
  }
  
  setupUrlChangeListeners() {
    // Listen for popstate events (back/forward button or menu navigation)
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
      console.log('ViewDefaultTab KNUTS: Is tab navigation flag set?', this.isTabNavigation);
      
      originalPushState.apply(history, args);
      
      // Only trigger redirect check if this is NOT a tab navigation
      if (!this.isTabNavigation) {
        console.log('ViewDefaultTab KNUTS: Not tab navigation - checking for redirect');
        setTimeout(() => this.checkAndRedirect(), 100);
      } else {
        console.log('ViewDefaultTab KNUTS: Tab navigation detected - skipping redirect check');
      }
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
      console.log('ViewDefaultTab KNUTS: Is tab navigation?', this.isTabNavigation);
      
      // If this navigation came from a tab click, don't redirect
      if (this.isTabNavigation) {
        console.log('ViewDefaultTab KNUTS: ⏸️ BLOCKING REDIRECT - Tab navigation detected');
        return;
      }
      
      // Check if this is a new page load by monitoring URL path changes
      const currentPath = window.location.pathname + window.location.hash;
      const isNewPageLoad = !this.initialized || this.currentPath !== currentPath;
      
      console.log('ViewDefaultTab KNUTS: Current path:', currentPath);
      console.log('ViewDefaultTab KNUTS: Previous path:', this.currentPath);
      console.log('ViewDefaultTab KNUTS: Is new page load:', isNewPageLoad);
      
      if (!isNewPageLoad) {
        console.log('ViewDefaultTab KNUTS: ⏭️ Not a new page load, skipping redirect');
        return; // Not a new page load, don't redirect
      }
      
      console.log('ViewDefaultTab KNUTS: 🚀 New page detected via menu navigation, checking for redirect');
      
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
        console.warn(`View Default Tab KNUTS: Invalid tab index ${targetTabIndex} for user ${currentUser}`);
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
        console.log(`View Default Tab KNUTS: Redirecting user ${currentUser} to tab ${targetTabIndex} (new page load detected)`);
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