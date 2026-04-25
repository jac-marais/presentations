#!/usr/bin/env node
import { resolve, basename, join, dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

const BASELINE_SLIDE_HEIGHT = 900;
const MAX_PDF_PAGE_HEIGHT = BASELINE_SLIDE_HEIGHT * 3;

const IMAGE_CAPTURE = {
  viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  screenshot: { type: 'png' },
};

const PDF_CAPTURE = {
  viewport: { width: 1440, height: BASELINE_SLIDE_HEIGHT, deviceScaleFactor: 1.5 },
  screenshot: { type: 'jpeg', quality: 82 },
};

function parseArgs(argv) {
  const positional = [];
  let imagesMode = false;
  let inspectMode = false;
  let outputPath;
  let slideExpression = 'all';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--images') {
      imagesMode = true;
      continue;
    }
    if (arg === '--inspect') {
      inspectMode = true;
      continue;
    }
    if (arg === '-o' || arg === '--output') {
      outputPath = argv[i + 1];
      if (!outputPath) {
        throw new Error('Missing value for output path');
      }
      i += 1;
      continue;
    }
    if (arg === '--slides') {
      slideExpression = argv[i + 1];
      if (!slideExpression) {
        throw new Error('Missing value for --slides');
      }
      i += 1;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    positional.push(arg);
  }

  if (!positional[0]) {
    throw new Error('Usage: node capture.mjs <input.html> [--inspect] [--images] [--slides 2,4-6] [-o output-path]');
  }

  return {
    inputPath: resolve(positional[0]),
    imagesMode,
    inspectMode,
    outputPath: outputPath ? resolve(outputPath) : undefined,
    slideExpression,
  };
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

function parseSlideExpression(expression) {
  if (!expression || expression === 'all') {
    return null;
  }

  const selected = new Set();
  for (const part of expression.split(',').map((value) => value.trim()).filter(Boolean)) {
    const rangeMatch = /^(\d+)-(\d+)$/.exec(part);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (end < start) {
        throw new Error(`Invalid slide range: ${part}`);
      }
      for (let slide = start; slide <= end; slide++) {
        selected.add(slide);
      }
      continue;
    }

    if (/^\d+$/.test(part)) {
      selected.add(Number(part));
      continue;
    }

    throw new Error(`Invalid slide selector: ${part}`);
  }

  const slides = [...selected].sort((a, b) => a - b);
  if (slides.length === 0 || slides.some((slide) => slide < 1)) {
    throw new Error('Slide selections must use positive 1-based slide numbers');
  }

  return slides;
}

function summarizeSlides(indices) {
  if (!indices || indices.length === 0) {
    return 'all slides';
  }

  const ranges = [];
  let start = indices[0];
  let end = indices[0];

  for (let i = 1; i < indices.length; i++) {
    const current = indices[i];
    if (current === end + 1) {
      end = current;
      continue;
    }

    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = current;
    end = current;
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return `slides ${ranges.join(', ')}`;
}

function addScreenshotToPdf(pdf, image, width, height) {
  if (height <= MAX_PDF_PAGE_HEIGHT) {
    const pdfPage = pdf.addPage([width, height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width, height });
    return 1;
  }

  let pageCount = 0;
  for (let offsetTop = 0; offsetTop < height; offsetTop += MAX_PDF_PAGE_HEIGHT) {
    const pageHeight = Math.min(MAX_PDF_PAGE_HEIGHT, height - offsetTop);
    const pdfPage = pdf.addPage([width, pageHeight]);
    pdfPage.drawImage(image, {
      x: 0,
      y: pageHeight + offsetTop - height,
      width,
      height,
    });
    pageCount += 1;
  }

  return pageCount;
}

async function getSlideMetadata(page) {
  return page.evaluate(() => {
    const pickTitle = (slide, index) => {
      const explicitTitle = slide.dataset.title?.trim();
      if (explicitTitle) {
        return explicitTitle;
      }

      for (const selector of ['h1', 'h2', 'h3', '.subtitle', '.kicker']) {
        const headingText = slide.querySelector(selector)?.textContent?.trim();
        if (headingText) {
          return headingText.replace(/\s+/g, ' ');
        }
      }

      return `Slide ${index + 1}`;
    };

    return [...document.querySelectorAll('.slide')].map((slide, index) => ({
      index: index + 1,
      title: pickTitle(slide, index),
    }));
  });
}

async function run() {
  const { inputPath, imagesMode, inspectMode, outputPath: explicitOutputPath, slideExpression } = parseArgs(process.argv.slice(2));
  const stem = basename(inputPath, '.html');
  const requestedSlides = parseSlideExpression(slideExpression);
  const selectionSuffix = buildSelectionSuffix(slideExpression);
  let outputPath = explicitOutputPath;

  if (!outputPath) {
    // Inside Docker, /output is the mounted host directory (next to the input HTML).
    // Standalone: fall back to the input file's directory.
    const outDir = process.env.DOCKER_CONTAINER ? '/output' : dirname(inputPath);
    if (imagesMode) {
      outputPath = join(outDir, `${stem}${selectionSuffix || '-slides'}`);
    } else {
      outputPath = join(outDir, `${stem}${selectionSuffix}.pdf`);
    }
  }

  console.log(`Opening ${inputPath}`);
  const captureConfig = imagesMode ? IMAGE_CAPTURE : PDF_CAPTURE;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport(captureConfig.viewport);
  await page.goto(`file://${inputPath}`, { waitUntil: 'networkidle0' });

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  // Wait for Lit web components and Mermaid diagrams to render.
  // Lit components (deck-nav, deck-card, etc.) load from esm.sh CDN and define
  // custom elements async. Mermaid renders <pre class="mermaid"> blocks into SVGs
  // after DOMContentLoaded. Both need time to complete after networkidle0.
  await page.evaluate(() => new Promise((resolve) => {
    // Wait for all custom elements used in the page to be defined
    const ceNames = [...new Set(
      [...document.querySelectorAll('*')]
        .map(el => el.tagName.toLowerCase())
        .filter(tag => tag.includes('-') && !customElements.get(tag))
    )];
    const ceReady = ceNames.length > 0
      ? Promise.all(ceNames.map(name => customElements.whenDefined(name)))
      : Promise.resolve();

    // Wait for Mermaid (check if any .mermaid elements contain rendered SVGs)
    const mermaidReady = new Promise((res) => {
      const check = () => {
        const preTags = document.querySelectorAll('.mermaid');
        if (preTags.length === 0) return res();
        const allRendered = [...preTags].every(el => el.querySelector('svg'));
        if (allRendered) return res();
        setTimeout(check, 200);
      };
      check();
    });

    const timeout = new Promise(res => setTimeout(res, 8000));
    Promise.race([Promise.all([ceReady, mermaidReady]), timeout]).then(resolve);
  }));

  // Extra settle time for component shadow DOM rendering
  await new Promise(r => setTimeout(r, 300));

  // Hide fixed navigation overlays (deck-nav, progress bars) during capture.
  // These are position:fixed elements that would appear on every slide screenshot.
  await page.evaluate(() => {
    const nav = document.querySelector('deck-nav');
    if (nav) nav.style.display = 'none';
    // Also hide any legacy (non-component) nav elements
    for (const sel of ['#nav-dots', '#progress', '#person-badge', '#dot-tooltip']) {
      const el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    }
  });

  const allSlides = await getSlideMetadata(page);
  if (inspectMode) {
    console.log(JSON.stringify({ slideCount: allSlides.length, slides: allSlides }, null, 2));
    await browser.close();
    return;
  }

  const slideCount = allSlides.length;
  console.log(`Found ${slideCount} slides`);

  const selectedSlides = requestedSlides
    ? requestedSlides.map((index) => {
        const slide = allSlides[index - 1];
        if (!slide) {
          throw new Error(`Requested slide ${index} but the deck only has ${slideCount} slides`);
        }
        return slide;
      })
    : allSlides;
  console.log(`Selected ${selectedSlides.length} of ${slideCount} slides (${summarizeSlides(requestedSlides)})`);

  const slideHandles = await page.$$('.slide');
  const screenshots = [];

  for (const [selectedIndex, slide] of selectedSlides.entries()) {
    const zeroBasedIndex = slide.index - 1;

    // Scroll slide into view and trigger animation
    await page.evaluate((idx) => {
      const slide = document.querySelectorAll('.slide')[idx];
      slide.scrollIntoView({ behavior: 'instant' });
      slide.classList.add('in-view');
    }, zeroBasedIndex);

    // Wait for animations to settle
    await new Promise(r => setTimeout(r, 600));

    // Screenshot the slide element (captures full bounding box)
    const slideHandle = slideHandles[zeroBasedIndex];
    const box = await slideHandle.boundingBox();
    if (!box) {
      throw new Error(`Slide ${slide.index} could not be measured for export`);
    }
    const screenshot = await slideHandle.screenshot(captureConfig.screenshot);

    screenshots.push({
      buffer: screenshot,
      index: slide.index,
      title: slide.title,
      width: box.width,
      height: box.height,
    });
    console.log(`  [${selectedIndex + 1}/${selectedSlides.length}] slide ${slide.index}: ${slide.title}`);
  }

  await Promise.all(slideHandles.map((handle) => handle.dispose()));
  await browser.close();

  if (imagesMode) {
    await mkdir(outputPath, { recursive: true });
    for (const screenshot of screenshots) {
      const name = `slide-${String(screenshot.index).padStart(2, '0')}.png`;
      await writeFile(join(outputPath, name), screenshot.buffer);
    }
    console.log(`\nSaved ${screenshots.length} images from ${summarizeSlides(requestedSlides)} to ${outputPath}`);
  } else {
    const pdf = await PDFDocument.create();
    for (const screenshot of screenshots) {
      const image = await pdf.embedJpg(screenshot.buffer);
      const pageCount = addScreenshotToPdf(pdf, image, screenshot.width, screenshot.height);
      if (pageCount > 1) {
        console.log(`    split "${screenshot.title}" across ${pageCount} PDF pages`);
      }
    }
    const pdfBytes = await pdf.save();
    await writeFile(outputPath, pdfBytes);
    console.log(`\nSaved PDF for ${summarizeSlides(requestedSlides)} to ${outputPath}`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
