# View Default Tab

A simple Lovelace plugin that automatically redirects users to their default tab when they visit a dashboard.

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

Add this configuration to your dashboard YAML at the top level, similar to other dashboard features like `keep_texts_in_tabs`.

### Configuration Method

#### If you are in storage mode (default mode)
1. Go to the dashboard in which you want to add the configuration
2. Click on the pencil icon located on the top-right corner (`Edit dashboard`)
3. Click on the three dots located on the top-right corner and then click on `Raw configuration editor`
4. Add the configuration at the very beginning of the code

#### If you are in yaml mode
1. Go to the dashboard yaml file in which you want to add the configuration
2. Add the configuration at the very beginning of the code

### Basic Configuration

```yaml
view_default_tab:
  users:
    - username: "john"
      default_tab: 1
    - username: "mary"  
      default_tab: 2
```

### Real-world Example

Here's how you can integrate it into an existing dashboard configuration:

```yaml
view_default_tab:
  users:
    - username: "parent1"
      default_tab: 0  # Master tab
    - username: "parent2" 
      default_tab: 0  # Master tab
    - username: "tibe"
      default_tab: 1  # Tibe tab
    - username: "menthe"
      default_tab: 2  # Menthe tab

views:
  - title: Master
    sections:
      - type: grid
        cards:
          # Your existing cards here
          - type: heading
            icon: mdi:lightbulb
            heading: Lights
            heading_style: subtitle
          # ... rest of your cards
    type: sections
    # ... rest of your view config
  - title: Tibe
    # ... your Tibe view config
  - title: Menthe
    # ... your Menthe view config
```

### Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| users | list | **Required** | List of user configurations
| users.username | string | **Required** | Home Assistant username
| users.default_tab | number | **Required** | Tab index to redirect to (0-based)

## How it works

- The plugin runs in the background automatically
- When a user opens the dashboard from the menu, it automatically redirects to their default tab
- Only redirects once per page load - users can freely navigate between tabs afterwards
- Users can manually click any tab and stay there without being redirected back
- Only works in view mode, not edit mode
- Reads configuration from dashboard top-level config (like `keep_texts_in_tabs`)

## Notes

- Tab indices are 0-based (first tab = 0, second tab = 1, etc.)
- The plugin only works in view mode, not edit mode
- Redirects only once when opening dashboard from menu
- Users can freely navigate between tabs after the initial redirect
- Works with standard Lovelace dashboards
- Configuration must be at dashboard top-level, not in views or cards