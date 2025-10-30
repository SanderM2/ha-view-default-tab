## View Default Tab

A simple and lightweight Lovelace plugin that automatically redirects users to their configured default tab when they visit a dashboard.

### Features

- ✅ User-specific default tab configuration
- ✅ No cards needed - works at dashboard level  
- ✅ One-time redirect per page load
- ✅ Users can freely navigate after initial redirect
- ✅ Works only in view mode (not edit mode)
- ✅ Dashboard-level configuration like `keep_texts_in_tabs`

### Quick Start

1. Install via HACS or manually
2. Add the configuration to your dashboard:

```yaml
view_default_tab:
  users:
    - username: "your-username"
      default_tab: 1
```

Perfect for households where different users prefer different starting views!