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
            
            // Fix isolateModules
            content = content.replace(/vi\.isolateModules/g, 'vi.resetModules');
            
            // Fix vi.mock returning JSX without default (naive replacement for common patterns)
            // e.g. vi.mock("...", async () => () => <div />) -> vi.mock("...", async () => ({ default: () => <div /> }))
            // A more robust approach for NHeatmapStatic, NTestPage, etc.
            if (content.includes('vi.mock("@/components/heatmap/HeatmapRenderer"') && !content.includes('default:')) {
                content = content.replace(/vi\.mock\("@\/components\/heatmap\/HeatmapRenderer",\s*async\s*\(\)\s*=>\s*\(\)\s*=>/g, 'vi.mock("@/components/heatmap/HeatmapRenderer", async () => ({ default: () =>');
                content = content.replace(/<div data-testid="heatmap-renderer" \/>\n\)/g, '<div data-testid="heatmap-renderer" />\n}))');
            }
            if (content.includes('vi.mock("@/pages/user/steps/NTestStepWelcome"') && !content.includes('default:')) {
                content = content.replace(/vi\.mock\("@\/pages\/user\/steps\/NTestStepWelcome",\s*async\s*\(\)\s*=>\s*\(\)\s*=>/g, 'vi.mock("@/pages/user/steps/NTestStepWelcome", async () => ({ default: () =>');
                content = content.replace(/<div data-testid="step-welcome" \/>\n\)/g, '<div data-testid="step-welcome" />\n}))');
            }

            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'src', '__tests__'));
