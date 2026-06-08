#!/usr/bin/env bun
import generateGabc, { 
    type Model, 
    type Parameters, 
    defaultModels, 
    parameterDefinitions, 
    getDefaultParameters 
} from "@augustinus/core";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';

// Helper to convert parameter schema to yargs options
const yargsOptions: any = {
    text: { type: 'string', alias: 't', description: 'Texto de entrada para converter para GABC' },
    input: { type: 'string', alias: 'i', description: 'Caminho do arquivo de entrada' },
    output: { type: 'string', alias: 'o', description: 'Caminho do arquivo de saída' },
    model: { type: 'string', alias: 'm', description: 'Nome do modelo a ser usado' },
    'list-models': { type: 'boolean', description: 'Lista todos os modelos disponíveis' },
};

// Automatically add all parameters from core schema
parameterDefinitions.forEach(param => {
    const option: any = {
        type: param.type === 'boolean' ? 'boolean' : 'string',
        default: param.defaultValue,
        description: param.label
    };

    yargsOptions[param.key] = option;
});

const yargsInstance = yargs(hideBin(process.argv))
    .options(yargsOptions)
    .check((argv: any) => {
        if (argv['list-models']) return true;
        if (!argv.model) {
            throw new Error('É necessário fornecer --model.');
        }
        if (!argv.text && !argv.input) {
            throw new Error('É necessário fornecer --text ou --input.');
        }
        return true;
    })
    .group(['text', 'input', 'output', 'model', 'list-models'], 'Opções Principais');

// Add groups from parameter definitions
const groups = [...new Set(parameterDefinitions.map(p => p.group))];
groups.forEach(groupName => {
    const keys = parameterDefinitions
        .filter(p => p.group === groupName)
        .map(p => p.key);
    
    // Capitalize group name for display
    const displayName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
    yargsInstance.group(keys, displayName);
});

const argv: any = yargsInstance
    .help()
    .alias('help', 'h')
    .parseSync();

if (argv['list-models']) {
    console.log('Modelos disponíveis:');
    defaultModels.forEach((m: Model) => {
        console.log(` - ${m.name} (${m.type}${m.tom ? ', ' + m.tom : ''})`);
    });
    process.exit(0);
}

const modelName = argv.model.toLowerCase();
const modelObject = defaultModels.find((m: Model) => m.name.toLowerCase() === modelName);

if (!modelObject) {
    console.error(`Modelo '${argv.model}' não encontrado.`);
    console.log('Use --list-models para ver os modelos disponíveis.');
    process.exit(1);
}

let inputText = argv.text as string;
if (argv.input) {
    try {
        inputText = fs.readFileSync(argv.input, 'utf-8');
    } catch (error) {
        console.error(`Erro ao ler o arquivo de entrada: ${(error as Error).message}`);
        process.exit(1);
    }
}

// Build parameters object dynamically
const parameters = getDefaultParameters();
parameterDefinitions.forEach(param => {
    if (argv[param.key] !== undefined) {
        (parameters as any)[param.key] = argv[param.key];
    }
});

const gabc = generateGabc(inputText, modelObject, parameters);

if (argv.output) {
    try {
        fs.writeFileSync(argv.output, gabc);
        console.log(`Saída GABC escrita em ${argv.output}`);
    } catch (error) {
        console.error(`Erro ao escrever no arquivo de saída: ${(error as Error).message}`);
        process.exit(1);
    }
} else {
    console.log(gabc);
}
