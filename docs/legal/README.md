# Legal Documents - Penny App

This folder contains the Privacy Policy and Terms of Service for the Penny mobile application.

## Files

- `privacy-policy.html` - Privacy Policy
- `terms.html` - Terms of Service

## Hosting Options

### Option 1: GitHub Pages (Free, Recommended)

1. **Enable GitHub Pages:**
   - Go to your repo Settings > Pages
   - Source: Deploy from branch `main`
   - Folder: `/docs`
   - Save

2. **URLs will be:**
   ```
   https://yourusername.github.io/penny/legal/privacy-policy.html
   https://yourusername.github.io/penny/legal/terms.html
   ```

3. **Update PaywallScreen.js** with these URLs

### Option 2: Termly.io (Free tier available)

1. Go to https://termly.io/
2. Create account and generate policies
3. Use their hosted URLs
4. Update PaywallScreen.js

### Option 3: Custom Domain

Host on your own domain/server:
```
https://www.pennyapp.com/privacy
https://www.pennyapp.com/terms
```

## Important Notes

- ⚠️ **Must be publicly accessible** - Apple requires valid, live URLs during review
- Update `[Your State/Country]` and `[Your Jurisdiction]` in terms.html
- Update contact emails: `privacy@pennyapp.com` and `support@pennyapp.com`
- Review and customize content to match your specific business practices
- Consider having a lawyer review before launch (recommended but not required for MVP)

## Updating PaywallScreen

After hosting, update `/src/screens/PaywallScreen.js`:

```javascript
<TouchableOpacity onPress={() => openURL('YOUR_PRIVACY_URL_HERE')}>
<TouchableOpacity onPress={() => openURL('YOUR_TERMS_URL_HERE')}>
```

## Maintenance

- Review and update annually
- Update "Last Updated" date when making changes
- Notify users of material changes via in-app notification

---

Generated: November 20, 2025
