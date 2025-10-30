## View Default Tab Card

A simple and lightweight Lovelace card that automatically redirects users to their configured default tab when they visit a dashboard.

### Features

- ✅ User-specific default tab configuration
- ✅ No entities required - just username and tab index  
- ✅ One-time redirect per page load
- ✅ Users can freely navigate after initial redirect
- ✅ Works only in view mode (not edit mode)
- ✅ Invisible card - no UI clutter

### Quick Start

1. Install via HACS or manually
2. Add the card to your view:

```yaml
type: custom:view-default-tab
users:
  - username: "your-username"
    default_tab: 1
```

Perfect for households where different users prefer different starting views!