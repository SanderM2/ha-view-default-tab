# View Default Tab Card

A simple Lovelace card that automatically redirects users to their default tab when they visit a dashboard.

## Installation

### Via HACS

1. Add this repository as a custom repository in HACS
2. Install "View Default Tab"
3. Add the resource to your Lovelace resources

### Manual Installation

1. Download `view-default-tab.js`
2. Place it in your `config/www` folder
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/view-default-tab.js
    type: module
```

## Configuration

Add this card to your view. It will be invisible and automatically redirect users to their configured default tab when they open the dashboard from the menu.

```yaml
type: custom:view-default-tab
users:
  - username: "john"
    default_tab: 1
  - username: "mary"  
    default_tab: 2
```

### Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| users | list | **Required** | List of user configurations
| users.username | string | **Required** | Home Assistant username
| users.default_tab | number | **Required** | Tab index to redirect to (0-based)

## How it works

- The card is invisible and runs in the background
- When a user opens the dashboard from the menu, it automatically redirects to their default tab
- Only redirects once per page load - users can freely navigate between tabs afterwards
- Users can manually click any tab and stay there without being redirected back
- Only works in view mode, not edit mode

## Notes

- Tab indices are 0-based (first tab = 0, second tab = 1, etc.)
- The card only works in view mode, not edit mode
- Redirects only once when opening dashboard from menu
- Users can freely navigate between tabs after the initial redirect
- Works with standard Lovelace dashboards