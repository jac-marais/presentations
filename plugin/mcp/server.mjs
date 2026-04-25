#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execFile } from 'child_process';
import { createHash } from 'crypto';
import { resolve, basename, dirname } from 'path';
import { stat, mkdir, readFile } from 'fs/promises';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGE_REPOSITORY = 'slide-capture';
const IMAGE_INPUTS = ['Dockerfile', 'capture.mjs', 'package-capture.json'];
let imageNamePromise;

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = execFile(cmd, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${err.message}\n${stderr}`));
      else resolve(stdout + stderr);
    });
  });
}

async function getImageName() {
  if (!imageNamePromise) {
    imageNamePromise = (async () => {
      const hash = createHash('sha256');
      for (const fileName of IMAGE_INPUTS) {
        hash.update(await readFile(resolve(__dirname, fileName)));
      }
      return `${IMAGE_REPOSITORY}:${hash.digest('hex').slice(0, 12)}`;
    })();
  }

  return imageNamePromise;
}

async function ensureImage(imageName) {
  try {
    await runCommand('docker', ['image', 'inspect', imageName]);
  } catch {
    await runCommand('docker', ['build', '-t', imageName, __dirname]);
    return 'Built Docker image.';
  }
  return null;
}

function normalizeSlideSelection(slides) {
  if (slides === undefined || slides === null || slides === 'all') {
    return { expression: 'all', label: 'all slides' };
  }

  if (Number.isInteger(slides)) {
    if (slides < 1) {
      throw new Error('slides must use 1-based slide numbers');
    }
    return { expression: String(slides), label: `slide ${slides}` };
  }

  if (Array.isArray(slides)) {
    if (slides.length === 0) {
      throw new Error('slides array cannot be empty');
    }

    const normalized = [...new Set(slides)].sort((a, b) => a - b);
    if (!normalized.every((slide) => Number.isInteger(slide) && slide >= 1)) {
      throw new Error('slides arrays must contain positive 1-based slide numbers');
    }

    return {
      expression: normalized.join(','),
      label: `slides ${normalized.join(', ')}`,
    };
  }

  if (typeof slides === 'object') {
    const { start, end } = slides;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
      throw new Error('slide ranges must look like { start: 2, end: 5 }');
    }

    return {
      expression: `${start}-${end}`,
      label: `slides ${start}-${end}`,
    };
  }

  throw new Error('slides must be "all", a slide number, an array of slide numbers, or { start, end }');
}

function buildSelectionSuffix(expression) {
  if (expression === 'all') {
    return '';
  }

  if (/^\d+$/.test(expression)) {
    return `-slide-${expression.padStart(2, '0')}`;
  }

  return `-slides-${expression.replace(/,/g, '_')}`;
}

function parseInspectOutput(output) {
  const trimmed = output.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error(`Inspect output was not valid JSON:\n${trimmed}`);
  }

  return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
}

async function inspectSlides(htmlPath) {
  const absInput = resolve(htmlPath);
  const inputName = basename(absInput);
  const imageName = await getImageName();

  await stat(absInput);
  const buildLog = await ensureImage(imageName);

  const output = await runCommand('docker', [
    'run',
    '--rm',
    '-v',
    `${absInput}:/input/${inputName}:ro`,
    imageName,
    `/input/${inputName}`,
    '--inspect',
  ]);

  const details = parseInspectOutput(output);
  const lines = [];
  if (buildLog) {
    lines.push(buildLog);
  }
  lines.push(
    `Presentation: ${absInput}`,
    `Slides: ${details.slideCount}`,
    '',
  );

  for (const slide of details.slides) {
    lines.push(`${slide.index}. ${slide.title}`);
  }

  lines.push('');
  lines.push('Selection examples for export_presentation:');
  lines.push('- "slides": 3');
  lines.push('- "slides": [2, 4, 7]');
  lines.push('- "slides": { "start": 5, "end": 8 }');
  lines.push('- omit "slides" or use "all" to export the full deck');

  return lines.join('\n');
}

async function exportSlides(htmlPath, format, outputPath, slideSelection) {
  const absInput = resolve(htmlPath);
  const inputName = basename(absInput);
  const stem = basename(absInput, '.html');
  const imageName = await getImageName();
  const { expression, label } = normalizeSlideSelection(slideSelection);
  const selectionSuffix = buildSelectionSuffix(expression);

  // Verify input exists
  await stat(absInput);

  // Determine output — default to next to the input HTML
  const inputDir = dirname(absInput);
  let absOutput;
  if (outputPath) {
    absOutput = resolve(outputPath);
  } else if (format === 'images') {
    absOutput = `${inputDir}/${stem}${selectionSuffix || '-slides'}`;
  } else {
    absOutput = `${inputDir}/${stem}${selectionSuffix}.pdf`;
  }

  const isImages = format === 'images';
  const mountDir = isImages ? absOutput : dirname(absOutput);
  const containerOutputPath = isImages ? '/output' : `/output/${basename(absOutput)}`;
  await mkdir(mountDir, { recursive: true });

  // Build image if needed
  const buildLog = await ensureImage(imageName);

  // For image exports, mount the destination directory directly so the capture
  // worker writes PNGs into that folder instead of creating a nested copy.
  const dockerArgs = [
    'run', '--rm',
    '-v', `${absInput}:/input/${inputName}:ro`,
    '-v', `${mountDir}:/output`,
    imageName,
    `/input/${inputName}`,
  ];

  if (isImages) {
    dockerArgs.push('--images');
  }
  if (expression !== 'all') {
    dockerArgs.push('--slides', expression);
  }
  dockerArgs.push('-o', containerOutputPath);

  const output = await runCommand('docker', dockerArgs);

  const lines = [];
  if (buildLog) lines.push(buildLog);
  lines.push(`Selected: ${label}`);
  lines.push(output.trim());
  lines.push(`\nOutput: ${absOutput}`);
  return lines.join('\n');
}

const server = new Server(
  { name: 'slide-capture', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'inspect_presentation',
      description: 'Inspect an HTML presentation and return numbered slide titles so the agent can choose a single slide, a subset, or the whole deck before exporting.',
      inputSchema: {
        type: 'object',
        properties: {
          html_path: {
            type: 'string',
            description: 'Absolute path to the HTML presentation file',
          },
        },
        required: ['html_path'],
      },
    },
    {
      name: 'export_presentation',
      description: 'Export an HTML slide deck to PDF or PNG images. Supports the full deck, one slide, a specific list of slides, or an inclusive range.',
      inputSchema: {
        type: 'object',
        properties: {
          html_path: {
            type: 'string',
            description: 'Absolute path to the HTML presentation file',
          },
          format: {
            type: 'string',
            enum: ['pdf', 'images'],
            description: 'Output format: "pdf" for a single PDF (default), "images" for one PNG per slide',
            default: 'pdf',
          },
          output_path: {
            type: 'string',
            description: 'Output path. For PDF: full file path. For images: directory path. Defaults to next to the input HTML file.',
          },
          slides: {
            description: 'Which slides to export. Omit or use "all" for the whole deck. Use 3 for one slide, [2,4,7] for a subset, or { "start": 5, "end": 8 } for an inclusive range.',
            default: 'all',
            oneOf: [
              {
                type: 'string',
                enum: ['all'],
              },
              {
                type: 'integer',
                minimum: 1,
              },
              {
                type: 'array',
                items: {
                  type: 'integer',
                  minimum: 1,
                },
                minItems: 1,
              },
              {
                type: 'object',
                properties: {
                  start: {
                    type: 'integer',
                    minimum: 1,
                  },
                  end: {
                    type: 'integer',
                    minimum: 1,
                  },
                },
                required: ['start', 'end'],
                additionalProperties: false,
              },
            ],
          },
        },
        required: ['html_path'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'inspect_presentation') {
      const { html_path } = request.params.arguments;
      const result = await inspectSlides(html_path);
      return { content: [{ type: 'text', text: result }] };
    }

    if (request.params.name === 'export_presentation') {
      const { html_path, format = 'pdf', output_path, slides = 'all' } = request.params.arguments;
      const result = await exportSlides(html_path, format, output_path, slides);
      return { content: [{ type: 'text', text: result }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true };
  } catch (err) {
    return { content: [{ type: 'text', text: `Export failed: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
