const fs = require('fs');
const path = require('path');

const projectRoot = 'D:\\Workspaces\\AndroidProjects\\climweb-weather-app';

const spaceMap = {
  '1': 'Spacing.sm',
  '2': 'Spacing.md',
  '3': 'Spacing.md',
  '4': 'Spacing.lg',
  '6': 'Spacing.xl',
  '8': 'Spacing.xxl',
  '10': 'Spacing.xxl',
  '12': 'Spacing.xxxl',
  '16': 'Spacing.xxxl'
};

const radiusMap = {
  'sm': 'Radius.small',
  'md': 'Radius.small',
  'lg': 'Radius.medium',
  'xl': 'Radius.large',
  'full': 'Radius.extraLarge'
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
          /export const space = \{.*?\} as const;/gs,
          `export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 64,
} as const;`
        );
        content = content.replace(
          /export const radius = \{.*?\} as const;/gs,
          `export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
} as const;`
        );
        changed = true;
      }

      // Replace space[X] with Spacing.Y
      const newContent = content
        .replace(/space\[(\d+)\]/g, (match, p1) => {
          return spaceMap[p1] || 'Spacing.md';
        })
        .replace(/radius\.([a-zA-Z]+)/g, (match, p1) => {
          return radiusMap[p1] || 'Radius.medium';
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
          if (imp === 'space') {
            newImports.push('Spacing');
            modified = true;
          } else if (imp === 'radius') {
            newImports.push('Radius');
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
