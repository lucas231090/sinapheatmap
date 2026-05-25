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

            // Replace: import IconName from "@mui/icons-material/IconName";
            // With: import { IconName } from "@mui/icons-material";
            content = content.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+["']@mui\/icons-material\/([A-Za-z0-9_]+)["'];/g, (match, p1, p2) => {
                changed = true;
                return `import { ${p2} as ${p1} } from "@mui/icons-material";`;
            });

            // Replace: import Component from "@mui/material/Component";
            // With: import { Component } from "@mui/material";
            content = content.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+["']@mui\/material\/([A-Za-z0-9_]+)["'];/g, (match, p1, p2) => {
                changed = true;
                return `import { ${p2} as ${p1} } from "@mui/material";`;
            });

            if (changed) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
