const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const UPLOAD_DIR = path.join(ROOT, "uploads");
const PUBLIC_UPLOAD_DIR = path.join(ROOT, "public", "uploads");
const DIST_UPLOAD_DIR = path.join(ROOT, "dist", "uploads");
const SRC_DATA_DIR = path.join(ROOT, "src", "data");
const DATA_DIR = path.join(ROOT, "data");

const SRC_DB_FILE = path.join(SRC_DATA_DIR, "db.json");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(SRC_DATA_DIR, "seedData.ts");

console.log("=== SINKRONISASI DATA & GAMBAR KE CODEBASE ===");

// 1. Ensure directories exist
[PUBLIC_UPLOAD_DIR, DIST_UPLOAD_DIR, SRC_DATA_DIR, DATA_DIR, UPLOAD_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 2. Load latest DB
let currentDb = null;
const candidateFiles = [SRC_DB_FILE, DB_FILE, path.join(DATA_DIR, "db.backup.json"), path.join(SRC_DATA_DIR, "db.backup.json")];
for (const file of candidateFiles) {
  if (fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        currentDb = parsed;
        console.log(`Loaded database from: ${file} (${parsed.projects.length} projects)`);
        break;
      }
    } catch {}
  }
}

if (!currentDb) {
  console.error("Database file not found!");
  process.exit(1);
}

// 3. Copy all images in uploads to public/uploads and dist/uploads
let copiedCount = 0;
if (fs.existsSync(UPLOAD_DIR)) {
  const uploadFiles = fs.readdirSync(UPLOAD_DIR);
  for (const file of uploadFiles) {
    const src = path.join(UPLOAD_DIR, file);
    const destPub = path.join(PUBLIC_UPLOAD_DIR, file);
    const destDist = path.join(DIST_UPLOAD_DIR, file);

    try {
      fs.copyFileSync(src, destPub);
      fs.copyFileSync(src, destDist);
      copiedCount++;
    } catch (e) {
      console.warn(`Could not copy ${file}:`, e.message);
    }
  }
}
console.log(`Synchronized ${copiedCount} files to public/uploads & dist/uploads.`);

// 4. Save DB JSON to all locations
const jsonStr = JSON.stringify(currentDb, null, 2);
fs.writeFileSync(SRC_DB_FILE, jsonStr);
fs.writeFileSync(DB_FILE, jsonStr);
fs.writeFileSync(path.join(DATA_DIR, "db.backup.json"), jsonStr);
fs.writeFileSync(path.join(SRC_DATA_DIR, "db.backup.json"), jsonStr);

// 5. Update seedData.ts to ensure permanent TypeScript inclusion
const seedContent = `// Auto-generated preserved dataset to ensure all images, settings, and project data are permanently kept in code
export const PRESERVED_STUDIO_DATA = ${jsonStr};
`;
fs.writeFileSync(SEED_FILE, seedContent);

console.log(`Updated seedData.ts with ${currentDb.projects.length} projects.`);
console.log("=== SINKRONISASI SUKSES 100% ===");
