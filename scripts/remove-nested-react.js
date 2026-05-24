/**
 * remove-nested-react.js
 *
 * Runs automatically after `npm install` (via "postinstall" in root package.json).
 *
 * Problem:
 *   expo-router@4 (student app) and expo-router@6 (another workspace) conflict,
 *   so npm keeps expo-router@4 at workspace level and nests react@18.3.1 inside
 *   it to satisfy its peer dependency. This creates two React copies in the
 *   Metro bundle → hook crashes / dispatcher errors.
 *
 *   The root package.json `overrides` field cannot prevent this because npm
 *   installs the nested copy to resolve a peer dependency version conflict,
 *   not a regular dependency.
 *
 * Fix:
 *   Delete the nested react (and react-dom) copies after every install.
 *   Metro's hierarchical walk-up then skips past the empty directory and
 *   finds react@19 at the monorepo root — single copy, no crash.
 */

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Add any other nested-react paths here if new workspaces are added
const NESTED_REACT_PATHS = [
  // expo-router@4 inside the student app workspace
  path.join(root, 'apps', 'frontend-student', 'node_modules', 'expo-router', 'node_modules', 'react'),
  path.join(root, 'apps', 'frontend-student', 'node_modules', 'expo-router', 'node_modules', 'react-dom'),
];

let removed = 0;

for (const target of NESTED_REACT_PATHS) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[remove-nested-react] removed ${path.relative(root, target)}`);
    removed++;
  }
}

if (removed === 0) {
  console.log('[remove-nested-react] no nested React copies found — nothing to do.');
}
