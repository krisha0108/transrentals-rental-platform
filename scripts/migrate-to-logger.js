#!/usr/bin/env node
/**
 * Script to migrate console.error/warn/log to structured logger
 *
 * Usage: node scripts/migrate-to-logger.js
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');
const LOGGER_IMPORT = "import logger from '@/lib/security/logger';";

// Patterns to replace
const PATTERNS = [
  {
    // console.error('message:', error);
    regex: /console\.error\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*(\w+)?\s*\)/g,
    replace: (match, message, errorVar) => {
      const cleanMsg = message.replace(/:\s*$/, '').replace(/['"`]/g, '');
      return errorVar ? `logger.error('${cleanMsg}', ${errorVar})` : `logger.error('${cleanMsg}')`;
    }
  },
  {
    // console.warn('message', ...);
    regex: /console\.warn\s*\(\s*['"`]([^'"`]+)['"`][^)]*\)/g,
    replace: (match, message) => {
      const cleanMsg = message.replace(/:\s*$/, '').replace(/['"`]/g, '');
      return `logger.warn('${cleanMsg}')`;
    }
  }
];

// Check if file already has logger import
function hasLoggerImport(content) {
  return content.includes("import logger from '@/lib/security/logger'") ||
         content.includes('import logger from "@/lib/security/logger"') ||
         content.includes("import { error, warn } from '@/lib/security/logger'");
}

// Add logger import after other imports
function addLoggerImport(content) {
  // Find the last import statement
  const importRegex = /^import .+from .+;?\s*$/gm;
  let lastImportMatch;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    lastImportMatch = match;
  }

  if (lastImportMatch) {
    const insertPos = lastImportMatch.index + lastImportMatch[0].length;
    return content.slice(0, insertPos) + '\n' + LOGGER_IMPORT + content.slice(insertPos);
  }

  // If no imports found, add at the beginning
  return LOGGER_IMPORT + '\n' + content;
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacementCount = 0;

  // Check if file has console.error or console.warn
  if (!content.includes('console.error') && !content.includes('console.warn')) {
    return { modified: false, replacements: 0 };
  }

  // Apply replacements
  for (const pattern of PATTERNS) {
    const newContent = content.replace(pattern.regex, (...args) => {
      replacementCount++;
      return pattern.replace(...args);
    });

    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  // Add logger import if needed and file was modified
  if (modified && !hasLoggerImport(content)) {
    content = addLoggerImport(content);
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
  }

  return { modified, replacements: replacementCount };
}

// Recursively find all route.ts files
function findRouteFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Main
console.log('🔍 Finding API route files...');
const files = findRouteFiles(API_DIR);
console.log(`Found ${files.length} route files\n`);

let totalModified = 0;
let totalReplacements = 0;

for (const file of files) {
  const relativePath = path.relative(API_DIR, file);
  const result = processFile(file);

  if (result.modified) {
    console.log(`✅ ${relativePath} (${result.replacements} replacements)`);
    totalModified++;
    totalReplacements += result.replacements;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${totalModified}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`\n✨ Done! Run 'npm test' to verify changes.`);
