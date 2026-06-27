import imageManifest from '../data/imageManifest.json';
import peaksData from '../data/peaks.json';
import { getStateName } from './stateNames';

export type ImageFormatPair = {
  webp: string;
  jpg: string;
};

export type PeakImageSet = {
  heroDesktop: ImageFormatPair;
  heroMobile: ImageFormatPair;
  cardDesktop: ImageFormatPair;
  cardMobile: ImageFormatPair;
};

export type ImageManifest = Record<string, PeakImageSet>;

const manifest = imageManifest as ImageManifest;

type PeakImageAltSource = {
  slug: string;
  name: string;
  state: string;
  prominence: number;
  heroImageAlt?: unknown;
};

const peaksBySlug = new Map(
  (peaksData as PeakImageAltSource[]).map((peak) => [peak.slug, peak]),
);

/** Inline fill styles — injected HTML bypasses Astro scoped CSS in dev. */
const FILL_PICTURE_STYLE =
  'position:absolute;inset:0;display:block;width:100%;height:100%;margin:0';
const FILL_IMG_STYLE =
  'position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;object-position:center;display:block';

function buildImgStyle(options: PictureOptions): string {
  const fit = options.objectFit ?? 'cover';
  const position = options.objectPosition ?? 'center';
  return `position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:${fit};object-position:${position};display:block`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatAltPeakName(name: string): string {
  return name
    .replace(/\s+\(OR\)$/u, '')
    .replace(/\s+\(South Summit\)$/u, ' South Summit');
}

export function buildPeakImageAlt(slug: string, fallbackAlt?: string): string {
  const peak = peaksBySlug.get(slug);

  if (!peak) {
    return fallbackAlt ?? slug;
  }

  if (typeof peak.heroImageAlt === 'string' && peak.heroImageAlt.trim().length > 0) {
    return peak.heroImageAlt.trim();
  }

  return `${formatAltPeakName(peak.name)} in ${getStateName(peak.state)}, an ultra-prominent peak with ${formatNumber(peak.prominence)} ft of prominence`;
}

export function hasPeakImages(slug: string): boolean {
  return slug in manifest;
}

export function getPeakImages(slug: string): PeakImageSet | null {
  return manifest[slug] ?? null;
}

function heroWidths(images: PeakImageSet) {
  const mobile = images.heroMobile.webp.includes('hero-md') ? 800 : 768;
  const desktop = images.heroDesktop.webp.includes('hero-lg') ? 1200 : 1440;
  return { mobile, desktop };
}

function cardWidths(images: PeakImageSet) {
  const mobile = images.cardMobile.webp.includes('card-sm') ? 300 : 300;
  const desktop = images.cardDesktop.webp.includes('hero-sm') ? 400 : 400;
  return { mobile, desktop };
}

export type PictureOptions = {
  alt: string;
  lazy?: boolean;
  className?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain';
  objectPosition?: string;
};

/**
 * Returns a responsive <picture> for full-width hero sections (16:9).
 *
 * @example Hero section in src/pages/[slug].astro
 * ---
 * import { getHeroImage } from '../utils/imageHelpers';
 * const { peak } = Astro.props;
 * ---
 * <section class="peak-hero">
 *   <Fragment set:html={getHeroImage(peak.slug, { alt: `${peak.name} summit landscape` })} />
 *   <div class="peak-hero__content">
 *     <h1>{peak.name}</h1>
 *   </div>
 * </section>
 *
 * <style>
 *   .peak-hero { position: relative; min-height: 360px; overflow: hidden; }
 *   .peak-hero :global(img) {
 *     position: absolute; inset: 0;
 *     width: 100%; height: 100%; object-fit: cover;
 *   }
 *   .peak-hero__content { position: relative; z-index: 1; }
 * </style>
 */
export function getHeroImage(slug: string, options: PictureOptions): string {
  const images = manifest[slug];
  if (!images) return '';

  const alt = escapeAttr(buildPeakImageAlt(slug, options.alt));
  const className = options.className ? ` class="${escapeAttr(options.className)}"` : '';
  const loading = options.lazy === false ? '' : ' loading="lazy"';
  const sizes =
    options.sizes ?? '(max-width: 768px) 100vw, min(100vw, 1440px)';

  const { mobile: heroMobileW, desktop: heroDesktopW } = heroWidths(images);
  const webpSrcset = `${images.heroMobile.webp} ${heroMobileW}w, ${images.heroDesktop.webp} ${heroDesktopW}w`;
  const jpgSrcset = `${images.heroMobile.jpg} ${heroMobileW}w, ${images.heroDesktop.jpg} ${heroDesktopW}w`;

  return `<picture${className} style="${FILL_PICTURE_STYLE}">
   <source type="image/webp" srcset="${webpSrcset}" sizes="${escapeAttr(sizes)}" />
   <img
     src="${images.heroDesktop.jpg}"
     srcset="${jpgSrcset}"
     sizes="${escapeAttr(sizes)}"
     alt="${alt}"
     width="${heroDesktopW}"
     height="${Math.round(heroDesktopW * (9 / 16))}"
     style="${buildImgStyle(options)}"
     decoding="async"${loading}
   />
 </picture>`;
}

/**
 * Returns a responsive <picture> for featured peak cards in a grid.
 *
 * @example Featured cards in src/pages/index.astro
 * ---
 * import { getCardImage } from '../utils/imageHelpers';
 * const featuredPeaks = peaksData.slice(0, 3);
 * ---
 * <div class="grid">
 *   {featuredPeaks.map((peak) => (
 *     <a href={`/${peak.slug}/`} class="card">
 *       <div class="card-image">
 *         <Fragment set:html={getCardImage(peak.slug, { alt: peak.name })} />
 *       </div>
 *       <h3>{peak.name}</h3>
 *     </a>
 *   ))}
 * </div>
 *
 * <style>
 *   .card-image { aspect-ratio: 16 / 10; overflow: hidden; border-radius: 8px; }
 *   .card-image :global(img) { width: 100%; height: 100%; object-fit: cover; }
 * </style>
 */
export function getCardImage(slug: string, options: PictureOptions): string {
  const images = manifest[slug];
  if (!images) return '';

  const alt = escapeAttr(buildPeakImageAlt(slug, options.alt));
  const className = options.className ? ` class="${escapeAttr(options.className)}"` : '';
  const loading = options.lazy === false ? '' : ' loading="lazy"';
  const sizes = options.sizes ?? '(max-width: 768px) 300px, 400px';

  const { mobile: cardMobileW, desktop: cardDesktopW } = cardWidths(images);
  const webpSrcset = `${images.cardMobile.webp} ${cardMobileW}w, ${images.cardDesktop.webp} ${cardDesktopW}w`;
  const jpgSrcset = `${images.cardMobile.jpg} ${cardMobileW}w, ${images.cardDesktop.jpg} ${cardDesktopW}w`;

  return `<picture${className} style="${FILL_PICTURE_STYLE}">
   <source type="image/webp" srcset="${webpSrcset}" sizes="${escapeAttr(sizes)}" />
   <img
     src="${images.cardDesktop.jpg}"
     srcset="${jpgSrcset}"
     sizes="${escapeAttr(sizes)}"
     alt="${alt}"
     width="${cardDesktopW}"
     height="${Math.round(cardDesktopW * (10 / 16))}"
     style="${FILL_IMG_STYLE}"
     decoding="async"${loading}
   />
 </picture>`;
}
