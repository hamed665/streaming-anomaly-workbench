import {readFile} from 'node:fs/promises';
import {analyze} from '../src/core.mjs';
const file=process.argv[2];
const input=JSON.parse(await readFile(file||new URL('../examples/input.json',import.meta.url),'utf8'));
console.log(JSON.stringify(analyze(input),null,2));
