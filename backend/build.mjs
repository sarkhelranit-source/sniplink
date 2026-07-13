import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const lambdasDir = './lambdas';
const outDir = './dist';

// Find all .ts files in the lambdas directory
const files = fs.readdirSync(lambdasDir)
  .filter(file => file.endsWith('.ts'))
  .map(file => path.join(lambdasDir, file));

// Build each lambda independently
for (const file of files) {
  const lambdaName = path.parse(file).name;
  
  // Create a specific folder for each lambda's dist if preferred,
  // or just output index.mjs directly inside dist/LambdaName
  const outputDir = path.join(outDir, lambdaName);
  
  await esbuild.build({
    entryPoints: [file],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: path.join(outputDir, 'index.mjs'),
    external: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'], // Built into Lambda Node20/24 runtime
    minify: true,
  });
  
  console.log(`Built ${lambdaName} -> ${outputDir}/index.mjs`);
}
