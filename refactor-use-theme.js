const fs = require('fs');
const path = require('path');
const dirs = ['app', 'components', 'lib'];
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('useThemeColors')) {
        content = content.replace(/import \{ useThemeColors \} from '@\/lib\/hooks\/useThemeColors';/g, "import { useTheme } from '@/lib/hooks/use-theme';");
        content = content.replace(/useThemeColors/g, 'useTheme');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}
dirs.forEach(processDir);
