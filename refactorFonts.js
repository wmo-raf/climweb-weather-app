const fs = require('fs');
const path = require('path');

const projectRoot = 'D:\\Workspaces\\AndroidProjects\\climweb-weather-app';

const fontMap = {
  'fonts.regular': 'Fonts.sans.regular',
  'fonts.medium': 'Fonts.sans.medium',
  'fonts.semiBold': 'Fonts.sans.bold', // mapping to bold since sans has regular, medium, bold
  'fonts.bold': 'Fonts.sans.bold',
  'fonts.extraBold': 'Fonts.sans.bold'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.expo') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Update lib/theme/index.ts specifically
      if (fullPath.replace(/\\/g, '/').endsWith('lib/theme/index.ts')) {
        content = content.replace(
          /export const fonts = \{[\s\S]*?\} as const;/g,
          `export const Fonts = {
  sans: Platform.select({
    ios: {
      regular: 'OpenSans_400Regular',
      medium: 'OpenSans_500Medium',
      bold: 'OpenSans_700Bold',
    },
    android: {
      regular: 'OpenSans_400Regular',
      medium: 'OpenSans_500Medium',
      bold: 'OpenSans_700Bold',
    },
    default: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
  }),
  mono: Platform.select({
    ios: { regular: 'Courier New', bold: 'Courier-Bold' },
    android: { regular: 'monospace', bold: 'monospace' },
    web: { regular: 'monospace', bold: 'monospace' },
    default: { regular: 'monospace', bold: 'monospace' },
  }),
} as const;`
        );
        changed = true;
      }

      // Replace usages of fonts.X
      const newContent = content.replace(/fonts\.(regular|medium|semiBold|bold|extraBold)/g, (match) => {
        return fontMap[match] || match;
      });
      
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }

      // Replace imports
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/lib\/theme['"]/g;
      const updatedImportContent = content.replace(importRegex, (match, p1) => {
        let imports = p1.split(',').map(i => i.trim());
        let newImports = [];
        let modified = false;
        for (let imp of imports) {
          if (imp === 'fonts') {
            newImports.push('Fonts');
            modified = true;
          } else {
            newImports.push(imp);
          }
        }
        return modified ? `import { ${newImports.join(', ')} } from '@/lib/theme'` : match;
      });

      if (updatedImportContent !== content) {
        content = updatedImportContent;
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(projectRoot);
console.log('Done.');
