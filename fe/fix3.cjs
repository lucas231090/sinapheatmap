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

            // Match patterns like: vi.mock("...", async () => () => (<div />));
            // Or: vi.mock("...", async () => () => <div />);
            const regex = /vi\.mock\("([^"]+)",\s*async\s*\(\)\s*=>\s*\(\)\s*=>\s*(<div[^>]*>.*?<\/div>|\([^)]+\))\s*\);/gs;
            content = content.replace(regex, (match, path, jsx) => {
                changed = true;
                return `vi.mock("${path}", async () => ({ default: () => ${jsx} }));`;
            });
            
            // Fix NExperimentsTable MemoryRouter missing
            if (file === 'NExperimentsTable.test.jsx') {
                if (!content.includes('MemoryRouter')) {
                    content = "import { MemoryRouter } from 'react-router-dom';\n" + content;
                    content = content.replace(/<NExperimentsTable/g, "<MemoryRouter><NExperimentsTable");
                    content = content.replace(/onView=\{onView\} \/>/g, "onView={onView} /></MemoryRouter>");
                    changed = true;
                }
            }

            // Fix ParticipantTable mock if NCreateStepIdentification is failing due to it
            // Actually it was NHomePage failing due to it? 
            if (file === 'NHomePage.test.jsx') {
                if (!content.includes('MemoryRouter')) {
                    content = "import { MemoryRouter } from 'react-router-dom';\n" + content;
                    content = content.replace(/<NHomePage \/>/g, "<MemoryRouter><NHomePage /></MemoryRouter>");
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', '__tests__'));
