import imageManifest from '../data/imageManifest.json';

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

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function hasPeakImages(slug: string): boolean {
  return slug in manifest;
}

export function getPeakImages(slug: string): PeakImageSet | null {
  return manifest[slug] ?? null;
}

export type PictureOptions = {
  alt: string;
  lazy?: boolean;
  className?: string;
  sizes?: string;
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

  const alt = escapeAttr(options.alt);
  const className = options.className ? ` class="${escapeAttr(options.className)}"` : '';
  const loading = options.lazy === false ? '' : ' loading="lazy"';
  const sizes =
    options.sizes ?? '(max-width: 768px) 100vw, min(100vw, 1440px)';

  const webpSrcset = `${images.heroMobile.webp} 768w, ${images.heroDesktop.webp} 1440w`;
  const jpgSrcset = `${images.heroMobile.jpg} 768w, ${images.heroDesktop.jpg} 1440w`;

  return `<picture${className}>
  <source type="image/webp" srcset="${webpSrcset}" sizes="${escapeAttr(sizes)}" />
  <img
    src="${images.heroDesktop.jpg}"
    srcset="${jpgSrcset}"
    sizes="${escapeAttr(sizes)}"
    alt="${alt}"
    width="1440"
    height="810"
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
 *     <a href={`/${peak.slug}`} class="card">
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

  const alt = escapeAttr(options.alt);
  const className = options.className ? ` class="${escapeAttr(options.className)}"` : '';
  const loading = options.lazy === false ? '' : ' loading="lazy"';
  const sizes = options.sizes ?? '(max-width: 768px) 300px, 400px';

  const webpSrcset = `${images.cardMobile.webp} 300w, ${images.cardDesktop.webp} 400w`;
  const jpgSrcset = `${images.cardMobile.jpg} 300w, ${images.cardDesktop.jpg} 400w`;

  return `<picture${className}>
  <source type="image/webp" srcset="${webpSrcset}" sizes="${escapeAttr(sizes)}" />
  <img
    src="${images.cardDesktop.jpg}"
    srcset="${jpgSrcset}"
    sizes="${escapeAttr(sizes)}"
    alt="${alt}"
    width="400"
    height="250"
    decoding="async"${loading}
  />
</picture>`;
}
