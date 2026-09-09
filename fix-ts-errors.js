const fs = require('fs');
const path = require('path');

const filesToFix = [
  'D:/Workspaces/AndroidProjects/climweb-weather-app/app/settings/about-us.tsx',
  'D:/Workspaces/AndroidProjects/climweb-weather-app/app/settings/index.tsx',
  'D:/Workspaces/AndroidProjects/climweb-weather-app/app/settings/language.tsx'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace themeColor="textSecondary" with themeColor="textSubtle"
    content = content.replace(/themeColor="textSecondary"/g, 'themeColor="textSubtle"');
    
    // Replace type="surfaceVariant" with type="bgAlt"
    content = content.replace(/type="surfaceVariant"/g, 'type="bgAlt"');
    
    // Replace theme.surfaceContainer with theme.bgMuted
    content = content.replace(/theme\.surfaceContainer/g, 'theme.bgMuted');
    
    // Remove unused SettingsHeader import
    content = content.replace(/import SettingsHeader from "@\/components\/settings-header";\n?/g, '');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
}
