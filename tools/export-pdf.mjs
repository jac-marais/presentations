#!/usr/bin/env node
import { resolve, basename, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

// Parse args
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('-')));
const positional = args.filter(a => !a.startsWith('-'));

if (!positional[0]) {
  console.error('Usage: node export-pdf.mjs <input.html> [--images] [-o output-path]');
  console.error('  Inside Docker, input is mounted at /input/file.html, output at /output/');
  process.exit(1);
}

const inputPath = resolve(positional[0]);
const imagesMode = flags.has('--images');
const outputIdx = args.indexOf('-o');
const stem = basename(inputPath, '.html');

let outputPath;
if (outputIdx !== -1 && args[outputIdx + 1]) {
  outputPath = resolve(args[outputIdx + 1]);
} else if (imagesMode) {
  outputPath = join('/output', `${stem}-slides`);
} else {
  outputPath = join('/output', `${stem}.pdf`);
}

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

async function run() {
  console.log(`Opening ${inputPath}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(`file://${inputPath}`, { waitUntil: 'networkidle0' });

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  // Get slide count
  const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`Found ${slideCount} slides`);

  const screenshots = [];

  for (let i = 0; i < slideCount; i++) {
    // Scroll slide into view and trigger animation
    await page.evaluate((idx) => {
      const slide = document.querySelectorAll('.slide')[idx];
      slide.scrollIntoView({ behavior: 'instant' });
      slide.classList.add('in-view');
    }, i);

    // Wait for animations to settle
    await new Promise(r => setTimeout(r, 600));

    // Screenshot the slide element (captures full bounding box)
    const slideHandle = await page.evaluateHandle((idx) => {
      return document.querySelectorAll('.slide')[idx];
    }, i);
    const png = await slideHandle.screenshot({ type: 'png' });
    await slideHandle.dispose();

    screenshots.push(png);
    const title = await page.evaluate((idx) => {
      return document.querySelectorAll('.slide')[idx].dataset.title || `Slide ${idx + 1}`;
    }, i);
    console.log(`  [${i + 1}/${slideCount}] ${title}`);
  }

  await browser.close();

  if (imagesMode) {
    await mkdir(outputPath, { recursive: true });
    for (let i = 0; i < screenshots.length; i++) {
      const name = `slide-${String(i + 1).padStart(2, '0')}.png`;
      await writeFile(join(outputPath, name), screenshots[i]);
    }
    console.log(`\nSaved ${screenshots.length} images to ${outputPath}`);
  } else {
    const pdf = await PDFDocument.create();
    for (const png of screenshots) {
      const image = await pdf.embedPng(png);
      const { width, height } = image.scale(0.5); // 2x DPR -> scale down for PDF dimensions
      const pdfPage = pdf.addPage([width, height]);
      pdfPage.drawImage(image, { x: 0, y: 0, width, height });
    }
    const pdfBytes = await pdf.save();
    await writeFile(outputPath, pdfBytes);
    console.log(`\nSaved PDF to ${outputPath}`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
