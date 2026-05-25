const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Revert icons
            content = content.replace(/import\s+\{\s*([A-Za-z0-9_]+)\s+as\s+([A-Za-z0-9_]+)\s*\}\s+from\s+["']@mui\/icons-material["'];/g, (match, p1, p2) => {
                changed = true;
                return `import ${p2} from "@mui/icons-material/${p1}";`;
            });

            // Revert material
            content = content.replace(/import\s+\{\s*([A-Za-z0-9_]+)\s+as\s+([A-Za-z0-9_]+)\s*\}\s+from\s+["']@mui\/material["'];/g, (match, p1, p2) => {
                changed = true;
                return `import ${p2} from "@mui/material/${p1}";`;
            });

            if (changed) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
