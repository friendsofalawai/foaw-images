import fs from 'fs';
import path from 'path';

// Define recognized media extensions
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']);

// Directories to skip scanning
const IGNORED_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts']);

function processDirectory(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`Failed to read directory: ${dirPath}`, err);
    return;
  }

  const imageFiles = [];
  const videoFiles = [];
  const subDirs = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        subDirs.push(path.join(dirPath, entry.name));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        imageFiles.push(entry.name);
      } else if (VIDEO_EXTENSIONS.has(ext)) {
        videoFiles.push(entry.name);
      }
    }
  }

  // Sort alphabetically to maintain consistent JSON formatting
  imageFiles.sort();
  videoFiles.sort();

  // Update manifests for the current folder
  updateJsonFile(path.join(dirPath, 'images.json'), imageFiles);
  updateJsonFile(path.join(dirPath, 'videos.json'), videoFiles);

  // Recursively process child directories
  for (const subDir of subDirs) {
    processDirectory(subDir);
  }
}

function updateJsonFile(filePath, fileList) {
  if (fileList.length > 0) {
    const newContent = JSON.stringify(fileList, null, 2) + '\n';
    let existingContent = '';

    if (fs.existsSync(filePath)) {
      existingContent = fs.readFileSync(filePath, 'utf8');
    }

    // Only overwrite if contents have actually changed
    if (existingContent !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } else {
    // If no matching media exists, remove any legacy manifest file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed empty manifest: ${filePath}`);
    }
  }
}

// Start scanning from repository root
processDirectory(process.cwd());
