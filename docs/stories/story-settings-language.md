# Story: Language Selection in Settings

## Metadata
- **Story ID:** SETTINGS-LANG-1
- **Epic:** Settings Enhancement & Internationalization
- **Status:** Ready for Development
- **Priority:** P1
- **Estimated Effort:** 6 hours
- **Assigned To:** Dev Team

---

## User Story

**As a** user,
**I want** to choose my preferred language in the Settings screen,
**so that** I can use the Penny app in my native language for better understanding and usability.

---

## Story Context

### Existing System Integration
- **Integrates with:** `SettingsScreen.js`, `AsyncStorage`, i18n library
- **Technology:** React Native, Expo, react-native-i18n or expo-localization, AsyncStorage
- **Follows pattern:** Existing Settings screen sections (Monthly Budget, Google Sheets Sync, Invitations)
- **Touch points:**
  - `src/screens/SettingsScreen.js` - Add new Language Selection section
  - `src/services/languageService.js` - New service for language management
  - `src/i18n/` - New directory for translation files
  - `src/contexts/LanguageContext.js` - New context for app-wide language state
  - All screen files - Wrap text strings with translation functions

### Current System Behavior
Settings screen currently has sections for:
- Profile (display name, email, avatar)
- My Collab Code (with copy/share functionality)
- Settings menu with:
  - Monthly Budget (expandable)
  - Google Sheets Sync (expandable)
  - Invitations & Sharing
  - Clear All Data
  - Log out

### Enhancement Details
Add "Language" menu item in Settings section that expands to show language options. Must match existing glass-morphism design and expandable pattern used by Monthly Budget and Google Sheets Sync sections.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Language Selection Menu Item**
- [ ] Settings menu displays "Language" menu item with globe icon
- [ ] Menu item positioned between "Monthly Budget" and "Google Sheets Sync"
- [ ] Tapping menu item expands/collapses language options
- [ ] Chevron icon rotates to indicate expanded/collapsed state
- [ ] Only one expandable section open at a time (auto-collapse others)

**AC2: Language Options Display**
- [ ] When expanded, shows 6 language options:
  - System Language (device default) ✓
  - English (English)
  - Français (French)
  - Español (Spanish)
  - العربية (Arabic)
  - Português (Portuguese)
- [ ] Each option displays native language name and English translation
- [ ] Current selection marked with checkmark icon
- [ ] Options displayed as radio buttons or selectable list items
- [ ] Clear visual feedback on selection (highlight/animation)

**AC3: System Language Option**
- [ ] "System Language" option uses device's locale setting
- [ ] When selected, app automatically detects device language
- [ ] If device language not supported, defaults to English
- [ ] System Language is default on first app launch
- [ ] Shows descriptive text: "Follows device settings"

**AC4: Language Persistence**
- [ ] Selected language saved to AsyncStorage immediately
- [ ] Language preference persists across app restarts
- [ ] Language preference synced across user's devices (if using cloud sync)
- [ ] Storage key: `@penny_user_language_preference`
- [ ] Handles AsyncStorage errors gracefully with fallback

**AC5: App-Wide Language Application**
- [ ] Language change applies immediately to entire app
- [ ] All screens update without requiring app restart
- [ ] Navigation labels update (Bottom tabs, headers)
- [ ] Button text updates across all screens
- [ ] Date/time formatting updates to match locale
- [ ] Currency formatting respects locale conventions
- [ ] Category names translated
- [ ] Error messages and alerts translated
- [ ] Toast notifications translated

**AC6: RTL Support for Arabic**
- [ ] When Arabic selected, entire app layout flips to RTL
- [ ] Text alignment changes to right-aligned
- [ ] Navigation flows reverse (back button on right side)
- [ ] Icons and visual elements mirror appropriately
- [ ] Numbers and currency remain LTR (e.g., $123.45)
- [ ] Charts and graphs adjust for RTL layout
- [ ] Forms and input fields align correctly

**AC7: Loading and Initialization**
- [ ] On app launch, load saved language preference within 100ms
- [ ] Show loading indicator if language loading takes >200ms
- [ ] Initialize i18n library before rendering main app
- [ ] Graceful fallback to English if language files fail to load
- [ ] No flash of untranslated content (FOUC)

**AC8: Translation Completeness**
- [ ] All user-facing strings translated for each language
- [ ] Translation files use JSON structure with nested keys
- [ ] Fallback to English for missing translations
- [ ] Dynamic content (expense descriptions) not translated
- [ ] User-generated content (names, notes) not translated
- [ ] Console warning logged for missing translation keys

### UI/UX Requirements

**AC9: Visual Design**
- [ ] Language menu item matches existing menu item style
- [ ] Globe icon (FontAwesome5: 'globe') with glass-morphism background
- [ ] Purple accent color for selected language option
- [ ] Expanded content uses light background (colors.backgroundLight)
- [ ] Language options have 44px minimum touch target height
- [ ] Smooth expand/collapse animation (200ms duration)
- [ ] Proper spacing between language options (12px)

**AC10: Selection Feedback**
- [ ] Tapping language option shows immediate visual feedback
- [ ] Brief "language changed" toast notification appears
- [ ] Toast message in newly selected language
- [ ] Checkmark animates smoothly when selection changes
- [ ] No flickering or layout shift during language change

**AC11: Responsiveness**
- [ ] Language names don't truncate on small screens
- [ ] Options stack vertically on all screen sizes
- [ ] Scrollable if language list exceeds screen height
- [ ] Works on phones (iPhone SE to iPhone 15 Pro Max)
- [ ] Works on tablets (iPad, Android tablets)

**AC12: Accessibility**
- [ ] Language names readable in high contrast mode
- [ ] Clear visual indication of selected language
- [ ] Touch targets meet minimum size requirements (44x44)
- [ ] VoiceOver/TalkBack support for language options
- [ ] Semantic labels for screen readers

### Integration Requirements

**AC13: Existing Settings Sections Preserved**
- [ ] Profile section remains functional
- [ ] My Collab Code section remains functional
- [ ] Monthly Budget section remains functional and expandable
- [ ] Google Sheets Sync section remains functional and expandable
- [ ] Invitations & Sharing navigation works
- [ ] Clear All Data button works
- [ ] Logout button works
- [ ] No layout breaks or overlaps

**AC14: Navigation Integration**
- [ ] Bottom tab labels translate correctly
- [ ] Screen headers translate correctly
- [ ] Back button behavior consistent across languages
- [ ] Navigation gestures work in RTL mode (Arabic)

**AC15: Data and Forms Integration**
- [ ] Expense categories display in selected language
- [ ] Date picker shows dates in locale format
- [ ] Currency symbols and formatting respect locale
- [ ] Number input keyboards work correctly
- [ ] Form validation messages translated

**AC16: Performance**
- [ ] Settings screen loads within 1 second
- [ ] Language change completes within 500ms
- [ ] No lag when expanding language options
- [ ] Smooth scrolling maintained
- [ ] Memory usage increase <5MB for translation files
- [ ] App bundle size increase <500KB

### Quality Requirements

**AC17: Testing Coverage**
- [ ] Unit tests for language service (load, save, change)
- [ ] Unit tests for translation function
- [ ] Integration tests for Settings screen language section
- [ ] Integration tests for app-wide language application
- [ ] E2E tests for language selection flow
- [ ] Visual regression tests for RTL layout
- [ ] Device testing: iOS (English, Arabic) and Android (all languages)

**AC18: Error Handling**
- [ ] Graceful fallback if AsyncStorage unavailable
- [ ] Graceful fallback if translation file missing
- [ ] Error logged but app continues functioning
- [ ] User sees fallback language (English) without crash
- [ ] Toast notification for language loading errors (user-facing)

---

## Technical Implementation Notes

### Phase 1: Setup i18n Library

**Install Dependencies:**
```bash
npm install i18next react-i18next expo-localization
```

**Create i18n Configuration** (`src/i18n/config.js`):
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  ar: { translation: ar },
  pt: { translation: pt },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    compatibilityJSON: 'v3', // For i18next v21+
  });

export default i18n;
```

### Phase 2: Create Translation Files

**English** (`src/i18n/locales/en.json`):
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "done": "Done",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "settings": {
    "title": "Settings",
    "profile": "Profile",
    "language": "Language",
    "languageChanged": "Language changed to {{language}}",
    "monthlyBudget": "Monthly Budget",
    "googleSheets": "Google Sheets Sync",
    "invitations": "Invitations & Sharing",
    "clearData": "Clear All Data",
    "logout": "Log out"
  },
  "languages": {
    "system": "System Language",
    "systemDescription": "Follows device settings",
    "english": "English",
    "french": "French",
    "spanish": "Spanish",
    "arabic": "Arabic",
    "portuguese": "Portuguese"
  },
  "navigation": {
    "home": "Home",
    "expenses": "Expenses",
    "insights": "Insights",
    "settings": "Settings"
  },
  "categories": {
    "food": "Food",
    "transport": "Transport",
    "shopping": "Shopping",
    "entertainment": "Entertainment",
    "utilities": "Utilities",
    "health": "Health",
    "other": "Other"
  }
}
```

**French** (`src/i18n/locales/fr.json`):
```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "done": "Terminé",
    "loading": "Chargement...",
    "error": "Erreur",
    "success": "Succès"
  },
  "settings": {
    "title": "Paramètres",
    "profile": "Profil",
    "language": "Langue",
    "languageChanged": "Langue changée en {{language}}",
    "monthlyBudget": "Budget mensuel",
    "googleSheets": "Synchronisation Google Sheets",
    "invitations": "Invitations et partage",
    "clearData": "Effacer toutes les données",
    "logout": "Se déconnecter"
  },
  "languages": {
    "system": "Langue du système",
    "systemDescription": "Suit les paramètres de l'appareil",
    "english": "Anglais",
    "french": "Français",
    "spanish": "Espagnol",
    "arabic": "Arabe",
    "portuguese": "Portugais"
  },
  "navigation": {
    "home": "Accueil",
    "expenses": "Dépenses",
    "insights": "Aperçus",
    "settings": "Paramètres"
  },
  "categories": {
    "food": "Alimentation",
    "transport": "Transport",
    "shopping": "Achats",
    "entertainment": "Divertissement",
    "utilities": "Services publics",
    "health": "Santé",
    "other": "Autre"
  }
}
```

**Spanish** (`src/i18n/locales/es.json`):
```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "done": "Hecho",
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito"
  },
  "settings": {
    "title": "Configuración",
    "profile": "Perfil",
    "language": "Idioma",
    "languageChanged": "Idioma cambiado a {{language}}",
    "monthlyBudget": "Presupuesto mensual",
    "googleSheets": "Sincronización de Google Sheets",
    "invitations": "Invitaciones y compartir",
    "clearData": "Borrar todos los datos",
    "logout": "Cerrar sesión"
  },
  "languages": {
    "system": "Idioma del sistema",
    "systemDescription": "Sigue la configuración del dispositivo",
    "english": "Inglés",
    "french": "Francés",
    "spanish": "Español",
    "arabic": "Árabe",
    "portuguese": "Portugués"
  },
  "navigation": {
    "home": "Inicio",
    "expenses": "Gastos",
    "insights": "Perspectivas",
    "settings": "Configuración"
  },
  "categories": {
    "food": "Comida",
    "transport": "Transporte",
    "shopping": "Compras",
    "entertainment": "Entretenimiento",
    "utilities": "Servicios",
    "health": "Salud",
    "other": "Otro"
  }
}
```

**Arabic** (`src/i18n/locales/ar.json`):
```json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "done": "تم",
    "loading": "جاري التحميل...",
    "error": "خطأ",
    "success": "نجح"
  },
  "settings": {
    "title": "الإعدادات",
    "profile": "الملف الشخصي",
    "language": "اللغة",
    "languageChanged": "تم تغيير اللغة إلى {{language}}",
    "monthlyBudget": "الميزانية الشهرية",
    "googleSheets": "مزامنة جداول Google",
    "invitations": "الدعوات والمشاركة",
    "clearData": "مسح جميع البيانات",
    "logout": "تسجيل الخروج"
  },
  "languages": {
    "system": "لغة النظام",
    "systemDescription": "يتبع إعدادات الجهاز",
    "english": "الإنجليزية",
    "french": "الفرنسية",
    "spanish": "الإسبانية",
    "arabic": "العربية",
    "portuguese": "البرتغالية"
  },
  "navigation": {
    "home": "الرئيسية",
    "expenses": "المصروفات",
    "insights": "الإحصاءات",
    "settings": "الإعدادات"
  },
  "categories": {
    "food": "طعام",
    "transport": "نقل",
    "shopping": "تسوق",
    "entertainment": "ترفيه",
    "utilities": "خدمات",
    "health": "صحة",
    "other": "أخرى"
  }
}
```

**Portuguese** (`src/i18n/locales/pt.json`):
```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "done": "Concluído",
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso"
  },
  "settings": {
    "title": "Configurações",
    "profile": "Perfil",
    "language": "Idioma",
    "languageChanged": "Idioma alterado para {{language}}",
    "monthlyBudget": "Orçamento mensal",
    "googleSheets": "Sincronização do Google Sheets",
    "invitations": "Convites e compartilhamento",
    "clearData": "Limpar todos os dados",
    "logout": "Sair"
  },
  "languages": {
    "system": "Idioma do sistema",
    "systemDescription": "Segue as configurações do dispositivo",
    "english": "Inglês",
    "french": "Francês",
    "spanish": "Espanhol",
    "arabic": "Árabe",
    "portuguese": "Português"
  },
  "navigation": {
    "home": "Início",
    "expenses": "Despesas",
    "insights": "Insights",
    "settings": "Configurações"
  },
  "categories": {
    "food": "Comida",
    "transport": "Transporte",
    "shopping": "Compras",
    "entertainment": "Entretenimento",
    "utilities": "Serviços",
    "health": "Saúde",
    "other": "Outro"
  }
}
```

### Phase 3: Create Language Service

**Language Service** (`src/services/languageService.js`):
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n/config';
import { I18nManager } from 'react-native';

const LANGUAGE_STORAGE_KEY = '@penny_user_language_preference';

export const SUPPORTED_LANGUAGES = [
  { code: 'system', name: 'System Language', nativeName: 'System Language', isRTL: false },
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRTL: false },
];

/**
 * Get device's current locale
 */
export const getDeviceLanguage = () => {
  const locale = Localization.locale; // e.g., "en-US"
  const languageCode = locale.split('-')[0]; // Extract "en"

  // Check if device language is supported
  const supported = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  return supported ? languageCode : 'en';
};

/**
 * Get saved language preference from AsyncStorage
 */
export const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage || 'system';
  } catch (error) {
    console.error('Error loading language preference:', error);
    return 'system';
  }
};

/**
 * Save language preference to AsyncStorage
 */
export const saveLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    return true;
  } catch (error) {
    console.error('Error saving language preference:', error);
    return false;
  }
};

/**
 * Change app language
 */
export const changeLanguage = async (languageCode) => {
  try {
    let actualLanguage = languageCode;

    // If "system" selected, detect device language
    if (languageCode === 'system') {
      actualLanguage = getDeviceLanguage();
    }

    // Update i18n language
    await i18n.changeLanguage(actualLanguage);

    // Get language object for RTL detection
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === actualLanguage);
    const isRTL = language?.isRTL || false;

    // Update RTL layout if needed
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // Note: RTL change requires app restart to fully apply
      // We can show an alert here suggesting restart
    }

    // Save preference
    await saveLanguage(languageCode);

    return {
      success: true,
      actualLanguage,
      isRTL,
      requiresRestart: I18nManager.isRTL !== isRTL,
    };
  } catch (error) {
    console.error('Error changing language:', error);
    return { success: false, error };
  }
};

/**
 * Initialize language on app startup
 */
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await getSavedLanguage();
    const result = await changeLanguage(savedLanguage);
    return result;
  } catch (error) {
    console.error('Error initializing language:', error);
    // Fallback to English
    await i18n.changeLanguage('en');
    return { success: false, error };
  }
};

/**
 * Get current active language code
 */
export const getCurrentLanguage = () => {
  return i18n.language;
};

/**
 * Get language display name
 */
export const getLanguageName = (code) => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language ? language.nativeName : 'Unknown';
};
```

### Phase 4: Create Language Context

**Language Context** (`src/contexts/LanguageContext.js`):
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  changeLanguage,
  getCurrentLanguage,
  getSavedLanguage,
  SUPPORTED_LANGUAGES,
} from '../services/languageService';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await getSavedLanguage();
      setCurrentLanguage(savedLanguage);
      setLoading(false);
    } catch (error) {
      console.error('Error loading language:', error);
      setLoading(false);
    }
  };

  const setLanguage = async (languageCode) => {
    try {
      const result = await changeLanguage(languageCode);

      if (result.success) {
        setCurrentLanguage(languageCode);

        // If RTL change requires restart, show alert
        if (result.requiresRestart) {
          Alert.alert(
            t('settings.restartRequired'),
            t('settings.restartRequiredMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('settings.restartNow'),
                onPress: () => {
                  // Note: In production, you might use Updates.reloadAsync() from expo-updates
                  // or RNRestart.Restart() from react-native-restart
                  console.log('Restart app to apply RTL changes');
                },
              },
            ]
          );
        }

        return true;
      } else {
        throw new Error('Failed to change language');
      }
    } catch (error) {
      console.error('Error setting language:', error);
      Alert.alert(t('common.error'), t('settings.languageChangeError'));
      return false;
    }
  };

  const value = {
    currentLanguage,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    loading,
    t,
    i18n,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
```

### Phase 5: Update SettingsScreen

**Modified File: src/screens/SettingsScreen.js**

Add imports:
```javascript
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
```

Add state and hooks:
```javascript
const { t } = useTranslation();
const { currentLanguage, setLanguage, languages } = useLanguage();
const [editingLanguage, setEditingLanguage] = useState(false);
const [changingLanguage, setChangingLanguage] = useState(false);
```

Add language selection handler:
```javascript
const handleLanguageSelect = async (languageCode) => {
  if (languageCode === currentLanguage) {
    setEditingLanguage(false);
    return;
  }

  setChangingLanguage(true);
  try {
    const success = await setLanguage(languageCode);
    if (success) {
      setEditingLanguage(false);

      // Get language name for toast
      const languageName = languages.find(l => l.code === languageCode)?.nativeName;

      Toast.show({
        type: 'success',
        text1: t('settings.languageChanged', { language: languageName }),
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  } catch (error) {
    console.error('Error changing language:', error);
    Toast.show({
      type: 'error',
      text1: t('common.error'),
      text2: t('settings.languageChangeError'),
      position: 'bottom',
    });
  } finally {
    setChangingLanguage(false);
  }
};

const handleCloseExpandedSections = (currentSection) => {
  // Auto-collapse other sections when one is opened
  if (currentSection !== 'language') setEditingLanguage(false);
  if (currentSection !== 'budget') setEditingBudget(false);
  if (currentSection !== 'webhook') setEditingWebhook(false);
};
```

Add JSX for Language section (insert after Monthly Budget section, before Google Sheets Sync):
```javascript
{/* Language Selection */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => {
    handleCloseExpandedSections('language');
    setEditingLanguage(!editingLanguage);
  }}
>
  <View style={styles.menuItemLeft}>
    <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
      <Icon name="globe" size={20} color={colors.primary} />
    </View>
    <Text style={styles.menuItemText}>{t('settings.language')}</Text>
  </View>
  {editingLanguage ? (
    <Icon name="chevron-down" size={18} color={colors.text.tertiary} />
  ) : (
    <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
  )}
</TouchableOpacity>

{editingLanguage && (
  <View style={styles.expandedContent}>
    {changingLanguage && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    )}

    <View style={styles.languageOptions}>
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageOption,
            currentLanguage === language.code && styles.languageOptionSelected,
          ]}
          onPress={() => handleLanguageSelect(language.code)}
          disabled={changingLanguage}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.languageNativeName}>{language.nativeName}</Text>
            {language.code === 'system' && (
              <Text style={styles.languageDescription}>
                {t('languages.systemDescription')}
              </Text>
            )}
            {language.code !== 'system' && language.code !== language.name && (
              <Text style={styles.languageEnglishName}>{language.name}</Text>
            )}
          </View>
          {currentLanguage === language.code && (
            <Icon name="check" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}
```

Add styles for language section:
```javascript
languageOptions: {
  marginTop: 10,
},
languageOption: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.glass.background,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.glass.borderLight,
  paddingVertical: 14,
  paddingHorizontal: 16,
  marginBottom: 10,
  minHeight: 60,
},
languageOptionSelected: {
  borderColor: colors.primary,
  borderWidth: 2,
  backgroundColor: 'rgba(138, 43, 226, 0.05)', // Light purple tint
},
languageInfo: {
  flex: 1,
},
languageNativeName: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.text.primary,
  marginBottom: 2,
},
languageEnglishName: {
  fontSize: 13,
  color: colors.text.secondary,
},
languageDescription: {
  fontSize: 12,
  color: colors.text.tertiary,
  marginTop: 2,
  fontStyle: 'italic',
},
loadingOverlay: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  marginBottom: 10,
},
loadingText: {
  marginLeft: 10,
  color: colors.text.secondary,
  fontSize: 14,
},
```

### Phase 6: Update App.js

Initialize i18n and wrap app with LanguageProvider:
```javascript
import './src/i18n/config'; // Initialize i18n
import { LanguageProvider } from './src/contexts/LanguageContext';

// In your App component:
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        {/* Rest of your app */}
      </AuthProvider>
    </LanguageProvider>
  );
}
```

### Phase 7: RTL Support Configuration

**Update app.json:**
```json
{
  "expo": {
    "supportsRTL": true,
    "android": {
      "supportsRTL": true
    },
    "ios": {
      "supportsRTL": true
    }
  }
}
```

**Add RTL stylesheet handling** (if needed):
```javascript
// In theme/colors.js or separate theme/rtl.js
import { I18nManager } from 'react-native';

export const getDirectionalStyle = (ltr, rtl) => {
  return I18nManager.isRTL ? rtl : ltr;
};

// Usage example:
paddingLeft: getDirectionalStyle(10, 0),
paddingRight: getDirectionalStyle(0, 10),
```

---

## Integration Verification

### IV1: Language Selection Works
**Verification Steps:**
1. Open Settings screen
2. Tap "Language" menu item - should expand
3. See all 6 language options displayed
4. Tap "Español" (Spanish) - should apply immediately
5. Verify menu item collapses after selection
6. Verify checkmark appears next to "Español"

**Expected Result:** Language selection works smoothly, app switches to Spanish

### IV2: Language Persists Across Restarts
**Verification Steps:**
1. Select a non-English language (e.g., French)
2. Close the app completely (swipe away from recent apps)
3. Reopen the app
4. Navigate to Settings > Language

**Expected Result:** French is still selected and app displays in French

### IV3: RTL Layout Works for Arabic
**Verification Steps:**
1. Select "العربية" (Arabic) from language options
2. Check if layout flips to RTL
3. Navigate through all screens (Home, Expenses, Insights, Settings)
4. Verify text alignment, icons, and navigation direction
5. Check forms and input fields

**Expected Result:** Entire app layout flips to RTL correctly

### IV4: System Language Option Works
**Verification Steps:**
1. Change device language to Spanish (iOS Settings > General > Language)
2. Open Penny app
3. Go to Settings > Language
4. Select "System Language"
5. Verify app displays in Spanish

**Expected Result:** App follows device language setting

### IV5: All Screens Translate Correctly
**Verification Steps:**
1. Select each language one by one
2. For each language, navigate to:
   - Home screen (check navigation tabs)
   - Expenses list (check headers, buttons)
   - Add Expense modal (check form labels)
   - Insights screen (check chart labels)
   - Settings screen (check all menu items)
3. Check for untranslated strings or layout issues

**Expected Result:** All screens display correctly in each language

### IV6: Existing Settings Functionality Preserved
**Verification Steps:**
1. After adding Language section, verify:
   - Monthly Budget expand/collapse works
   - Google Sheets Sync expand/collapse works
   - Invitations & Sharing navigation works
   - Clear All Data button works
   - Logout button works
2. Verify only one section expands at a time

**Expected Result:** All existing Settings functionality works perfectly

---

## Testing Strategy

### Unit Tests

**Language Service Tests** (`src/services/languageService.test.js`):
```javascript
describe('languageService', () => {
  describe('getDeviceLanguage', () => {
    it('should return device language code');
    it('should return "en" if device language not supported');
  });

  describe('getSavedLanguage', () => {
    it('should return saved language from AsyncStorage');
    it('should return "system" if no language saved');
    it('should handle AsyncStorage errors gracefully');
  });

  describe('saveLanguage', () => {
    it('should save language code to AsyncStorage');
    it('should return true on success');
    it('should return false on error');
  });

  describe('changeLanguage', () => {
    it('should change i18n language');
    it('should resolve "system" to device language');
    it('should detect RTL languages');
    it('should save language preference');
    it('should return success result with language info');
  });

  describe('initializeLanguage', () => {
    it('should load saved language on startup');
    it('should fallback to English on error');
  });
});
```

**Language Context Tests** (`src/contexts/LanguageContext.test.js`):
```javascript
describe('LanguageContext', () => {
  it('should provide current language');
  it('should provide setLanguage function');
  it('should provide languages list');
  it('should load language on mount');
  it('should show alert if RTL change requires restart');
  it('should handle language change errors');
});
```

**Settings Screen Tests** (`src/screens/SettingsScreen.test.js`):
```javascript
describe('SettingsScreen - Language Section', () => {
  it('should render Language menu item');
  it('should expand language options when tapped');
  it('should collapse language options when tapped again');
  it('should display all 6 language options');
  it('should highlight current language');
  it('should call setLanguage when option selected');
  it('should show loading indicator during change');
  it('should show success toast after language change');
  it('should close other expanded sections when Language opened');
});
```

### Integration Tests

```javascript
describe('Language Selection Flow', () => {
  it('should change app language from Settings');
  it('should persist language across app restarts');
  it('should apply language to all screens');
  it('should handle RTL layout for Arabic');
  it('should fall back to English for missing translations');
});
```

### E2E Tests

```javascript
describe('E2E: Language Selection', () => {
  it('should allow user to change language and see immediate results');
  it('should maintain language preference after app restart');
  it('should switch between LTR and RTL languages correctly');
});
```

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC18) are met
- [ ] i18n library installed and configured
- [ ] Translation files created for all 6 languages
- [ ] Language service created and tested
- [ ] Language context created and integrated
- [ ] SettingsScreen updated with Language section
- [ ] App.js updated with LanguageProvider
- [ ] RTL support configured in app.json
- [ ] Language selection works on iOS and Android
- [ ] Language persists across app restarts
- [ ] All screens translate correctly
- [ ] RTL layout works for Arabic
- [ ] System Language option works
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Integration verification (IV1-IV6) completed successfully
- [ ] Visual design matches existing Settings sections
- [ ] No console errors or warnings
- [ ] Performance benchmarks met (AC16)
- [ ] Tested on iOS (iPhone 12, iPhone SE) and Android (Pixel 5, Samsung S21)
- [ ] Accessibility requirements met (VoiceOver/TalkBack)
- [ ] Documentation updated (README, API docs if applicable)

---

## Risk Assessment

### Primary Risk
**Risk:** RTL layout breaks existing UI components

**Likelihood:** Medium

**Impact:** High (affects Arabic users)

**Mitigation:**
- Thoroughly test all screens in RTL mode
- Use Flexbox layouts that adapt to RTL automatically
- Avoid hardcoded left/right positioning
- Use `start`/`end` instead of `left`/`right` in styles
- Test with real Arabic content, not just English test strings
- Create visual regression tests for RTL mode

### Secondary Risk
**Risk:** Missing or incomplete translations

**Likelihood:** Medium

**Impact:** Medium (affects user experience)

**Mitigation:**
- Use translation keys consistently across all files
- Implement fallback to English for missing keys
- Log warnings for missing translations in development
- Use translation management tool (e.g., i18next-scanner) to extract keys
- Have native speakers review translations
- Create automated tests to detect missing translation keys

### Tertiary Risk
**Risk:** App restart required for RTL changes interrupts user flow

**Likelihood:** High (for Arabic users)

**Impact:** Medium (user inconvenience)

**Mitigation:**
- Clearly communicate to user that restart is needed
- Provide "Restart Now" option in alert
- Consider using `Updates.reloadAsync()` from expo-updates for smoother restart
- Document this limitation in user-facing help text
- Future enhancement: Apply RTL dynamically without restart (requires significant refactoring)

### Rollback Plan
If this feature causes critical issues:
1. Comment out Language menu item in SettingsScreen
2. Remove LanguageProvider wrapper from App.js
3. Revert app.json changes (supportsRTL)
4. App returns to English-only mode
5. Investigate issue and redeploy fix

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Install i18n dependencies (i18next, react-i18next, expo-localization)
- [ ] Task 2: Create i18n configuration file
- [ ] Task 3: Create translation files for all 6 languages
- [ ] Task 4: Create languageService with AsyncStorage integration
- [ ] Task 5: Create LanguageContext for app-wide state management
- [ ] Task 6: Update App.js to initialize i18n and wrap with LanguageProvider
- [ ] Task 7: Update SettingsScreen with Language menu item and expandable section
- [ ] Task 8: Implement language selection logic with auto-collapse
- [ ] Task 9: Add styles for language section (match existing glass-morphism)
- [ ] Task 10: Configure RTL support in app.json
- [ ] Task 11: Update all screens to use translation function (t())
- [ ] Task 12: Test language switching on iOS and Android
- [ ] Task 13: Test RTL layout for Arabic
- [ ] Task 14: Test System Language option with different device locales
- [ ] Task 15: Write unit tests for languageService
- [ ] Task 16: Write unit tests for LanguageContext
- [ ] Task 17: Write integration tests for SettingsScreen language section
- [ ] Task 18: Write E2E tests for language selection flow
- [ ] Task 19: Verify integration verification steps (IV1-IV6)
- [ ] Task 20: Performance testing (load time, memory usage)
- [ ] Task 21: Accessibility testing (VoiceOver/TalkBack)
- [ ] Task 22: Final QA on multiple devices and screen sizes

### Debug Log
<!-- Dev: Add debug notes here during implementation -->

### Completion Notes
<!-- Dev: Add completion summary here -->

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-11-13 | Story created | Dev Team |

---

## Dependencies

**Blocks:**
- Future stories requiring localized content
- Multi-language marketing materials
- International user expansion

**Blocked By:**
- None (can be implemented independently)

**Nice-to-Have (Future Enhancements):**
- Additional languages (German, Italian, Chinese, Japanese)
- Translation management system integration
- Crowdsourced translations from community
- Language-specific date/time formats
- Currency conversion based on language/region
- Voice-to-text in user's language

---

## Additional Notes

### Translation Guidelines
1. **Keep it concise:** Mobile screens have limited space
2. **Context matters:** Provide context to translators (button vs. heading)
3. **Variables:** Use {{variable}} syntax for dynamic content
4. **Pluralization:** Use i18next pluralization features where needed
5. **Formal vs. informal:** Use informal tone ("tu" in French/Spanish)
6. **Cultural sensitivity:** Ensure translations are culturally appropriate
7. **Native review:** Have native speakers review before launch

### User Flow
1. User opens Settings screen
2. Taps "Language" menu item → options expand
3. Sees current language checked
4. Taps desired language (e.g., "Français")
5. App immediately switches to French
6. Toast appears: "Langue changée en Français"
7. User navigates around app to see French everywhere
8. Language preference saved for future sessions

### RTL Considerations
- **Text alignment:** All text should align right in Arabic
- **Icons:** Directional icons (arrows, back button) should mirror
- **Charts:** Consider x-axis direction in bar charts
- **Forms:** Input fields align right, labels on right side
- **Navigation:** Swipe gestures may need reversal
- **Time:** Consider 12-hour vs. 24-hour formats
- **Numerals:** Arabic-Indic numerals (٠١٢٣) vs. Western (0123) - keep Western for numbers/currency

### Performance Optimization
- **Lazy load translations:** Load only active language file
- **Cache translations:** Avoid reloading on every screen change
- **Minimize bundle size:** Use compact JSON structure
- **Async initialization:** Don't block app startup
- **Memory management:** Unload unused language files

### PM Notes
- This is a foundational feature for international expansion
- Priority on quality over quantity (6 languages done well vs. 20 poorly)
- User testing with native speakers before public release
- Consider soft launch with beta users from target countries
- Analytics: Track language distribution to prioritize future additions
- Marketing: Announce multilingual support as major feature update

---

## Future Enhancements (Not in Scope)

1. **Language Auto-Detection:** Detect user's language from phone number or email domain
2. **In-App Language Tutorials:** Onboarding explaining how to change language
3. **QR Code Language Share:** Share language preference via QR code for easy setup
4. **Voice Commands:** "Hey Penny, switch to French"
5. **Mixed Language Support:** Allow different languages for different family members
6. **Translation Contributions:** Let users suggest better translations
7. **Contextual Help:** Language-specific help articles and FAQs
8. **Dialect Support:** Regional variants (Brazilian vs. European Portuguese)
9. **Text-to-Speech:** Read expenses aloud in selected language
10. **Keyboard Layouts:** Auto-switch keyboard based on language for better input

---

## Success Metrics

Track these metrics post-launch:
- **Adoption Rate:** % of users who change from default language
- **Language Distribution:** Which languages are most popular
- **Retention:** Do multilingual users have better retention?
- **Completion Rate:** % of users who complete language change flow
- **Error Rate:** # of language-related crashes or errors
- **Load Time Impact:** Settings screen load time before/after feature
- **User Feedback:** App store reviews mentioning language support
- **Geographic Expansion:** New users from non-English countries

**Target Metrics:**
- 30% of non-English region users change language within first week
- <1% error rate for language change operations
- <50ms impact on Settings screen load time
- 4.5+ star rating in app stores for supported languages
