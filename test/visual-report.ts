import generateGabc, { defaultModels } from "../packages/core/src/augustinus";
import { smallTestCases } from "./small-test-cases";
import bigTests from "./big-tests.json";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "test/visual/output";
const LATEX_DIR = "test/visual/latex";
const TEMPLATES_DIR = "test/visual/templates";

if (!fs.existsSync(LATEX_DIR)) {
    fs.mkdirSync(LATEX_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function runLuaLatex(filename: string, dir: string) {
    try {
        console.log(`Compilando ${filename}...`);
        // Run twice for gregorio
        execSync(`lualatex --interaction=nonstopmode ${filename}`, { cwd: dir, stdio: 'ignore' });
        execSync(`lualatex --interaction=nonstopmode ${filename}`, { cwd: dir, stdio: 'ignore' });
    } catch (e) {
        console.error(`Erro ao compilar ${filename}. Verifique se gregorio e lualatex estão instalados.`);
    }
}

function escapeLatex(text: string) {
    return text.replace(/([&%$#_{}])/g, '\\$1');
}

function cleanGabcForSnippet(gabc: string) {
    // Remove header and any %% 
    let cleaned = gabc.split("%%").pop()?.trim() || gabc;
    return cleaned;
}

// --- SMALL TESTS ---
async function generateSmallTestsReport() {
    console.log("Gerando relatório de testes pequenos...");
    const template = fs.readFileSync(path.join(TEMPLATES_DIR, "small-tests-template.tex"), "utf-8");
    
    let content = "";
    
    // Group tests by their parameter base (e.g., "add-optional-start")
    const groupedGroups: { [key: string]: typeof smallTestCases } = {};
    const singles: typeof smallTestCases = [];

    for (const test of smallTestCases) {
        if (test.id.endsWith("-true") || test.id.endsWith("-false")) {
            const groupName = test.id.replace(/-(true|false)$/, "");
            if (!groupedGroups[groupName]) groupedGroups[groupName] = [];
            groupedGroups[groupName].push(test);
        } else {
            singles.push(test);
        }
    }

    // Process Singles first
    content += "\\section{Funcionalidades Básicas}\n";
    for (const test of singles) {
        const model = defaultModels.find(m => m.name === test.model);
        if (!model) continue;
        const gabc = generateGabc(test.text, model as any, test.parameters);
        const snippet = cleanGabcForSnippet(gabc);
        
        content += `\\rendersmalltest{${escapeLatex(test.description)}}{${escapeLatex(test.id)}}{${escapeLatex(test.model)}}{${escapeLatex(test.text)}}{${snippet}}\n`;
    }

    // Process Parameter Toggles in side-by-side layout
    content += "\\newpage\\section{Parâmetros (True vs False)}\n";
    for (const [groupName, tests] of Object.entries(groupedGroups)) {
        const trueTest = tests.find(t => t.id.endsWith("-true"));
        const falseTest = tests.find(t => t.id.endsWith("-false"));
        
        if (!trueTest || !falseTest) {
            // If one is missing, just render them normally
            for (const test of tests) {
                const model = defaultModels.find(m => m.name === test.model);
                if (!model) continue;
                const gabc = generateGabc(test.text, model as any, test.parameters);
                const snippet = cleanGabcForSnippet(gabc);
                content += `\\rendersmalltest{${escapeLatex(test.description)}}{${escapeLatex(test.id)}}{${escapeLatex(test.model)}}{${escapeLatex(test.text)}}{${snippet}}\n`;
            }
            continue;
        }

        const modelTrue = defaultModels.find(m => m.name === trueTest.model);
        const modelFalse = defaultModels.find(m => m.name === falseTest.model);
        
        const gabcTrue = generateGabc(trueTest.text, modelTrue as any, trueTest.parameters);
        const gabcFalse = generateGabc(falseTest.text, modelFalse as any, falseTest.parameters);
        
        const snippetTrue = cleanGabcForSnippet(gabcTrue);
        const snippetFalse = cleanGabcForSnippet(gabcFalse);

        const paramName = groupName.replace(/-/g, " ");

        content += `\\rendersidebyside{${escapeLatex(paramName)}}{${escapeLatex(trueTest.id)}}{${snippetTrue}}{${escapeLatex(falseTest.id)}}{${snippetFalse}}\n`;
    }

    const latex = template.replace("{{CONTENT}}", content);
    
    const texPath = path.join(LATEX_DIR, "small-tests.tex");
    fs.writeFileSync(texPath, latex);
    runLuaLatex("small-tests.tex", LATEX_DIR);
    
    const pdfPath = path.join(LATEX_DIR, "small-tests.pdf");
    if (fs.existsSync(pdfPath)) {
        fs.renameSync(pdfPath, path.join(OUTPUT_DIR, "small-tests.pdf"));
    }
}

// --- BIG TESTS ---
async function generateBigTestsReports() {
    console.log("Gerando relatórios de testes grandes...");
    const template = fs.readFileSync(path.join(TEMPLATES_DIR, "big-tests-template.tex"), "utf-8");

    for (const test of bigTests) {
        console.log(`Processando: ${test.id}`);
        const model = defaultModels.find(m => m.name === test.model);
        if (!model) {
            console.error(`Modelo não encontrado: ${test.model}`);
            continue;
        }

        const inputText = fs.readFileSync(path.join("test", test.text), "utf-8");
        const referenceGabc = fs.readFileSync(path.join("test", test.reference), "utf-8");
        const augustinusGabc = generateGabc(inputText, model as any, test.parameters as any);

        const referenceSnippet = cleanGabcForSnippet(referenceGabc);
        const augustinusSnippet = cleanGabcForSnippet(augustinusGabc);

        let latex = template
            .replace("{{TITLE}}", escapeLatex(test.description))
            .replace("{{TEXT_FILE}}", escapeLatex(test.text))
            .replace("{{MODEL}}", escapeLatex(test.model))
            .replace("{{REFERENCE_GABC}}", referenceSnippet)
            .replace("{{AUGUSTINUS_GABC}}", augustinusSnippet);

        const texFilename = `big-test-${test.id}.tex`;
        fs.writeFileSync(path.join(LATEX_DIR, texFilename), latex);
        runLuaLatex(texFilename, LATEX_DIR);
        
        const pdfPath = path.join(LATEX_DIR, `big-test-${test.id}.pdf`);
        if (fs.existsSync(pdfPath)) {
            fs.renameSync(pdfPath, path.join(OUTPUT_DIR, `big-test-${test.id}.pdf`));
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const runSmall = args.length === 0 || args.includes("--small");
    const runBig = args.length === 0 || args.includes("--big");

    if (runSmall) {
        await generateSmallTestsReport();
    }
    if (runBig) {
        await generateBigTestsReports();
    }
    console.log("\nProcesso concluído! Os PDFs estão em " + OUTPUT_DIR);
}

main().catch(console.error);
