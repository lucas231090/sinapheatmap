const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, replaceFn) {
    const fullPath = path.join(__dirname, 'src', '__tests__', filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = replaceFn(content);
        fs.writeFileSync(fullPath, content);
    }
}

// 1. api.test.js
replaceFileContent('services/api.test.js', (content) => {
    return content.replace(/vi\.mock\('axios', async \(\) => \{([\s\S]*?)return \{/m, "vi.mock('axios', () => {\n$1return { default: {")
                  .replace(/mockInterceptors \/\/ Expoe os interceptors mockados para acesso nos testes\n\s*\};\n\}\);/m, "mockInterceptors } \n    };\n});")
                  .replace(/vi\.mock\('@\/..\/config', async \(\) => \(\{/g, "vi.mock('@/../config', () => ({")
                  .replace(/vi\.resetModules\(\(\) => \{\n\s*require\('@\/services\/api'\);\n\s*\}\);/g, "vi.resetModules();\n        require('@/services/api');")
                  .replace(/const \{ default: config \} = require\('@\/..\/config'\);/g, "const config = require('@/../config').default;");
});

// 2. HeatmapRenderer.test.jsx
const hrPath = path.join(__dirname, 'src', '__tests__', 'components', 'HeatmapRenderer.test.jsx');
if (fs.existsSync(hrPath)) {
    let content = fs.readFileSync(hrPath, 'utf8');
    content = content.replace(/vi\.mock\('@mars3d\/heatmap\.js', async \(\) => \(\{\n\s*create/m, "vi.mock('@mars3d/heatmap.js', () => ({ default: { create");
    content = content.replace(/\n\}\)\);/, "} }));");
    fs.writeFileSync(hrPath, content);
}

// 3. Fix missing icons by removing or fixing the imports in tests. Wait, the icons issue is in the source files themselves when Vite runs!
// Error: Failed to resolve import "@mui/material/CircularProgress" from "src/pages/researcher/NHeatmapPage.jsx".
// Error: Failed to resolve import "@mui/icons-material/DeleteOutline" from "src/pages/researcher/NHomePage/components/NExperimentsTable.jsx".
// Let's fix these by updating the imports to standard destructuring, or just make sure the icons exist. 
