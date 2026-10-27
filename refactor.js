const fs = require('fs');
const path = require('path');

const explicitMapping = {
  'Settings': 'settings.title',
  'Retry': 'common.actions.retry',
  'About us': 'aboutUs.title',
  'About Us': 'aboutUs.title', // Handle capitalization variation
  'About the app': 'aboutApp.title',
  'Privacy Policy': 'privacy.title',
  'Today': 'time.today',
  '5 days': 'time.fiveDays',
  'Warnings': 'warnings.title',
  'Alerts': 'alerts.title',
  'Places': 'places.title',
  'Next 5 days': 'time.nextFiveDays',
  'Tap to change place': 'places.tapToChange',
  'Min': 'weather.min',
  'Max': 'weather.max',
  'Km/h': 'weather.kmh',
  'Rain': 'weather.rain',
  'mm': 'weather.mm',
  'Wind': 'weather.wind',
  'Time': 'time.time',
  'Temp': 'weather.temp',
  'Department of Climate Change and Meteorological Services (DCCMS)': 'aboutUs.partners.dccms',
  'Icons': 'aboutApp.icons',
  'partners': 'aboutApp.partners',
  'Geographical Data': 'aboutApp.geographicalData',
  'Language': 'settings.language.title',
  'English': 'settings.language.english',
  'Not available': 'common.states.notAvailable',
  'Sun': 'time.days.sun',
  'Mon': 'time.days.mon',
  'Tue': 'time.days.tue',
  'Wed': 'time.days.wed',
  'Thu': 'time.days.thu',
  'Fri': 'time.days.fri',
  'Sat': 'time.days.sat',
  'select.language.placeholder': 'settings.language.placeholder',
  'Forecast not available at the moment. Please try again later.': 'forecast.error.unavailable',
  'Loading': 'common.states.loading',
  'Forecast unavailable': 'forecast.states.unavailable',
  'There was an error getting the forecast': 'forecast.error.generic',
  'Search location': 'places.searchLocation',
  'Morning': 'time.periods.morning',
  'Afternoon': 'time.periods.afternoon',
  'Evening': 'time.periods.evening',
  'Night': 'time.periods.night',
  'placeholder_lorem_ipsum': 'placeholders.loremIpsum',
  'placeholder_app_title': 'placeholders.appTitle',
  'placeholder_app_description': 'placeholders.appDescription',
  'Preferences': 'settings.sections.preferences',
  'Dark Mode': 'settings.preferences.appearance.darkMode',
  'Show Onboarding': 'settings.preferences.showOnboarding',
  'About': 'settings.sections.about',
  'App Version': 'settings.about.appVersion',
  'rain': 'conditions.rain'
};

function getNewKey(oldKey) {
  return explicitMapping[oldKey] || oldKey;
}

function unflatten(data) {
  const result = {};
  for (const oldKey in data) {
    const newKey = getNewKey(oldKey);
    const keys = newKey.split('.');
    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) {
        current[k] = data[oldKey];
      } else {
        current[k] = current[k] || {};
        current = current[k];
      }
    }
  }
  return result;
}

const dir = path.resolve('lib/localization/translations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const nested = unflatten(data);
  fs.writeFileSync(filePath, JSON.stringify(nested, null, 2));
  console.log('Refactored JSON: ' + file);
});

function replaceInFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      replaceInFiles(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const [oldKey, newKey] of Object.entries(explicitMapping)) {
        // Match t('oldKey') or t("oldKey") or t(`oldKey`)
        const escapedKey = oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex1 = new RegExp("t\\([\"'`]" + escapedKey + "[\"'`]\\)", "g");
        if (regex1.test(content)) {
          content = content.replace(regex1, 't("' + newKey + '")');
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated strings in: ' + fullPath);
      }
    }
  }
}

replaceInFiles(path.resolve('app'));
replaceInFiles(path.resolve('components'));
replaceInFiles(path.resolve('lib'));
