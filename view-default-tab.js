class ViewDefaultTab {
  
  constructor() {
    this.initialized = false;
    this.currentPath = null;
    this.lastTabClickTime = 0;
    this.tabClickCooldown = 2000; // 2 seconds cooldown after tab click (increased from 1s)
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
    
    // Listen for clicks on the entire document
    document.addEventListener('click', (event) => {
      console.log('ViewDefaultTab KNUTS: 🖱️ CLICK DETECTED');
      console.log('ViewDefaultTab KNUTS: Click target:', event.target);
      console.log('ViewDefaultTab KNUTS: Click target tagName:', event.target.tagName);
      console.log('ViewDefaultTab KNUTS: Click target classes:', event.target.className);
      console.log('ViewDefaultTab KNUTS: Click target id:', event.target.id);
      
      // Check if the click was on a tab or inside a tab
      const clickedElement = event.target;
      
      // Try multiple ways to detect tab clicks
      const tabElement = clickedElement.closest('ha-tab-group-tab');
      const tabGroup = clickedElement.closest('ha-tab-group');
      const tabWithRole = clickedElement.closest('[role="tab"]');
      
      console.log('ViewDefaultTab KNUTS: Closest ha-tab-group-tab:', tabElement);
      console.log('ViewDefaultTab KNUTS: Closest ha-tab-group:', tabGroup);
      console.log('ViewDefaultTab KNUTS: Closest [role="tab"]:', tabWithRole);
      
      // Check if element has tab-related attributes
      const hasTabRole = clickedElement.getAttribute('role') === 'tab';
      const hasTabId = clickedElement.id && clickedElement.id.includes('tab');
      const hasTabClass = clickedElement.className && clickedElement.className.includes('tab');
      
      console.log('ViewDefaultTab KNUTS: Has role="tab":', hasTabRole);
      console.log('ViewDefaultTab KNUTS: Has tab in id:', hasTabId);
      console.log('ViewDefaultTab KNUTS: Has tab in class:', hasTabClass);
      
      if (tabElement || tabWithRole || hasTabRole || (tabGroup && (hasTabId || hasTabClass))) {
        console.log('ViewDefaultTab KNUTS: ✅ TAB CLICK DETECTED! Setting cooldown timer');
        console.log('ViewDefaultTab KNUTS: Detection method:', {
          tabElement: !!tabElement,
          tabWithRole: !!tabWithRole,
          hasTabRole,
          tabGroupAndId: !!(tabGroup && hasTabId),
          tabGroupAndClass: !!(tabGroup && hasTabClass)
        });
        
        this.lastTabClickTime = Date.now();
        console.log('ViewDefaultTab KNUTS: lastTabClickTime set to:', this.lastTabClickTime);
      } else {
        console.log('ViewDefaultTab KNUTS: ❌ Not detected as tab click');
      }
    }, true); // Use capture phase to catch it early
    
    console.log('ViewDefaultTab KNUTS: Tab click detection setup complete');
  }
  
  setupUrlChangeListeners() {
    // Listen for popstate events (back/forward button or menu navigation)
    window.addEventListener('popstate', () => {
      console.log('ViewDefaultTab KNUTS: Popstate event detected (menu navigation)');
      setTimeout(() => this.checkAndRedirect(), 200);
    });
    
    // Listen for hashchange events
    window.addEventListener('hashchange', () => {
      console.log('ViewDefaultTab KNUTS: Hash change event detected');
      setTimeout(() => this.checkAndRedirect(), 200);
    });
    
    // Override history.pushState to catch programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      console.log('ViewDefaultTab KNUTS: History pushState detected - could be menu OR tab navigation');
      originalPushState.apply(history, args);
      // Longer delay to allow tab click detection to set the timer first
      setTimeout(() => this.checkAndRedirect(), 300);
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
      
      // Check if we recently had a tab click - if so, don't redirect
      const timeSinceTabClick = Date.now() - this.lastTabClickTime;
      console.log('ViewDefaultTab KNUTS: Time since last tab click:', timeSinceTabClick, 'ms');
      console.log('ViewDefaultTab KNUTS: Cooldown period:', this.tabClickCooldown, 'ms');
      console.log('ViewDefaultTab KNUTS: lastTabClickTime:', this.lastTabClickTime);
      
      if (timeSinceTabClick < this.tabClickCooldown) {
        console.log('ViewDefaultTab KNUTS: ⏸️ BLOCKING REDIRECT - Recent tab click detected, skipping redirect. Time since click:', timeSinceTabClick, 'ms');
        return;
      } else {
        console.log('ViewDefaultTab KNUTS: ✅ No recent tab click, proceeding with redirect check');
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
      
      console.log('ViewDefaultTab KNUTS: 🚀 New page detected, checking for redirect. Path:', currentPath);
      
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