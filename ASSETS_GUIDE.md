# Assets Guide - Expense Monitor

## Overview
All app icons and images have been properly configured from the source logos in the `ios/` folder.

## Source Files
Located in `ios/` folder:
- **logo.svg** (3.6MB) - Vector source file
- **logo.png** (1.4MB, 1024x1024) - High-res PNG version
- **144x144.png** (11KB) - Notification icon size

## Generated Assets

### Main App Assets (`assets/` folder)

#### 1. **icon.png** (1.4MB, 1024x1024)
- **Purpose**: Main app icon for iOS and Android
- **Source**: Copied from `ios/logo.png`
- **Usage**: Home screen icon, app launcher
- **Configuration**: `app.json` → `"icon": "./assets/icon.png"`

#### 2. **adaptive-icon.png** (1.4MB, 1024x1024)
- **Purpose**: Android adaptive icon foreground
- **Source**: Copied from `ios/logo.png`
- **Usage**: Android 8.0+ adaptive icons
- **Background**: White (#ffffff)
- **Configuration**:
  ```json
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#ffffff"
  }
  ```

#### 3. **favicon.png** (1.9KB, 48x48)
- **Purpose**: Web favicon for browser tabs
- **Source**: Generated from `ios/logo.svg`
- **Usage**: Browser tab icon, bookmarks
- **Configuration**: `app.json` → `"web": { "favicon": "./assets/favicon.png" }`

#### 4. **og-image.png** (180KB, 1200x630)
- **Purpose**: Open Graph image for social media sharing
- **Source**: Generated from `ios/logo.svg`
- **Usage**: Facebook, Twitter, LinkedIn previews
- **Background**: Purple (#6C63FF - app theme color)
- **Configuration**: Meta tags in `public/index.html`

#### 5. **notification-icon.png** (11KB, 144x144)
- **Purpose**: Android notification icon
- **Source**: Copied from `ios/144x144.png`
- **Usage**: Push notifications, status bar
- **Color**: Purple (#6C63FF)
- **Configuration**:
  ```json
  "android": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#6C63FF"
    }
  }
  ```

#### 6. **splash.png** (152KB, 1242x2436)
- **Purpose**: Launch/splash screen
- **Source**: Generated from `ios/logo.svg`
- **Usage**: App startup screen
- **Background**: Blue (#2196F3)
- **Size**: 512x512 logo centered on splash dimensions
- **Configuration**: `app.json` → `"splash": { "image": "./assets/splash.png" }`

### Public Assets (`public/assets/` folder)
For web builds only:

1. **og-image.png** - Copy for web hosting
2. **favicon.png** - Copy for web hosting

## Configuration Files

### app.json
Complete asset configuration:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "meta": {
        "name": "Expense Monitor",
        "description": "Track your income and expenses effortlessly",
        "themeColor": "#6C63FF"
      }
    },
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2196F3"
    },
    "ios": {
      "infoPlist": {
        "CFBundleDisplayName": "Expense Monitor"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "notification": {
        "icon": "./assets/notification-icon.png",
        "color": "#6C63FF"
      }
    }
  }
}
```

### public/index.html
SEO and social media meta tags configured with:
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Theme color (#6C63FF)
- Apple touch icon
- Favicon link

## Color Scheme
- **Primary Purple**: #6C63FF (notifications, OG background, theme)
- **Primary Blue**: #2196F3 (splash background)
- **White**: #FFFFFF (adaptive icon background)

## Size Reference
| Asset | Dimensions | Size | Format |
|-------|------------|------|--------|
| icon.png | 1024x1024 | 1.4MB | PNG |
| adaptive-icon.png | 1024x1024 | 1.4MB | PNG |
| favicon.png | 48x48 | 1.9KB | PNG |
| og-image.png | 1200x630 | 180KB | PNG |
| notification-icon.png | 144x144 | 11KB | PNG |
| splash.png | 1242x2436 | 152KB | PNG |

## Regenerating Assets
If you need to regenerate any assets from the source logos:

1. Update `ios/logo.svg` or `ios/logo.png` with new design
2. Run the asset generation commands
3. The system will automatically create all required sizes

## Notes
- All PNG assets are optimized for quality and file size
- SVG source provides infinite scalability
- Assets follow Expo and platform guidelines
- OG image uses 1.91:1 ratio (optimal for social media)
- Favicon is 48x48 (standard web size)
- App icon is 1024x1024 (required by Apple/Google)
