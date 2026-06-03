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
    model: { type: 'string', demandOption: true, alias: 'm', description: 'Nome do modelo a ser usado' },
};

// Automatically add all parameters from core schema
parameterDefinitions.forEach(param => {
    if (param.group === 'hidden') return;
    
    yargsOptions[param.key] = {
        type: param.type === 'boolean' ? 'boolean' : 'string',
        default: param.defaultValue,
        description: param.label
    };
});

const argv: any = yargs(hideBin(process.argv))
    .options(yargsOptions)
    .check((argv: any) => {
        if (!argv.text && !argv.input) {
            throw new Error('É necessário fornecer --text ou --input.');
        }
        return true;
    })
    .help()
    .alias('help', 'h')
    .parseSync();

const modelObject = defaultModels.find((m: Model) => m.name === argv.model);

if (!modelObject) {
    console.error(`Modelo '${argv.model}' não encontrado.`);
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
