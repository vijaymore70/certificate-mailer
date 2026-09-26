import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';
import { getFontById, CertificateFont } from '../utils/certificateFonts';

export interface TextFieldConfig {
  id: string;
  label: string;
  columnKey: string; // Header name from Excel or '' for custom text
  isCustomText?: boolean;
  customValue?: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  fontSize: number;
  fontColor: string; // Hex string e.g. '#000000'
  fontFamily?: string; // Font ID from CERTIFICATE_FONTS
  fontStyle: 'normal' | 'bold' | 'italic';
  alignment: 'left' | 'center' | 'right';
}

export interface GeneratedCertificate {
  participantName: string;
  certificateId: string;
  email: string;
  filename: string;
  pdfBlob: Blob;
  arrayBuffer: ArrayBuffer;
}

export class CertificateGeneratorService {
  private static fontBytesCache: Map<string, ArrayBuffer> = new Map();

  /**
   * Helper to fetch and cache TTF font files
   */
  private static async fetchFontBytes(url: string): Promise<ArrayBuffer> {
    if (this.fontBytesCache.has(url)) {
      return this.fontBytesCache.get(url)!;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font from ${url}`);
    }
    const buffer = await response.arrayBuffer();
    this.fontBytesCache.set(url, buffer);
    return buffer;
  }

  /**
   * Helper to convert HEX color to pdf-lib RGB color
   */
  private static hexToRgb(hex: string) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return rgb(r / 255, g / 255, b / 255);
  }

  /**
   * Helper to select standard fallback PDF font
   */
  private static getFontName(
    category: 'script' | 'serif' | 'sans' | 'mono' | 'marathi' = 'sans',
    style: 'normal' | 'bold' | 'italic' = 'normal'
  ): StandardFonts {
    if (category === 'serif' || category === 'script') {
      switch (style) {
        case 'bold':
          return StandardFonts.TimesRomanBold;
        case 'italic':
          return StandardFonts.TimesRomanItalic;
        default:
          return StandardFonts.TimesRoman;
      }
    } else if (category === 'mono') {
      switch (style) {
        case 'bold':
          return StandardFonts.CourierBold;
        case 'italic':
          return StandardFonts.CourierOblique;
        default:
          return StandardFonts.Courier;
      }
    } else {
      switch (style) {
        case 'bold':
          return StandardFonts.HelveticaBold;
        case 'italic':
          return StandardFonts.HelveticaOblique;
        default:
          return StandardFonts.Helvetica;
      }
    }
  }

  /**
   * Helper to check if string contains Devanagari / Indic script characters (Marathi/Hindi)
   */
  static containsDevanagari(text: string): boolean {
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Generate a single PDF document overlaying text configurations onto template bytes
   */
  static async generateSinglePDF(
    templateBytes: ArrayBuffer,
    templateType: 'image' | 'pdf',
    mimeType: string,
    fieldConfigs: TextFieldConfig[],
    rowData: Record<string, any>,
    fontBytesMap?: Map<string, ArrayBuffer>
  ): Promise<Uint8Array> {
    let pdfDoc: PDFDocument;
    let page: any;
    let width: number;
    let height: number;

    if (templateType === 'pdf') {
      const sourcePdf = await PDFDocument.load(templateBytes);
      pdfDoc = await PDFDocument.create();
      const [copiedPage] = await pdfDoc.copyPages(sourcePdf, [0]);
      page = pdfDoc.addPage(copiedPage);
      width = page.getWidth();
      height = page.getHeight();
    } else {
      pdfDoc = await PDFDocument.create();
      let image: any;
      if (mimeType.includes('png')) {
        image = await pdfDoc.embedPng(templateBytes);
      } else {
        image = await pdfDoc.embedJpg(templateBytes);
      }
      width = image.width;
      height = image.height;
      page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const resolutionScale = width / 1000;

    // Check if any text field contains Devanagari/Marathi characters or uses a Marathi font
    const hasDevanagari = fieldConfigs.some((field) => {
      let textValue = field.isCustomText
        ? field.customValue || ''
        : String(rowData[field.columnKey] || '').trim();
      const fontConfig = getFontById(field.fontFamily || 'great_vibes');
      return this.containsDevanagari(textValue) || fontConfig.category === 'marathi';
    });

    // If Devanagari text is present, render via high-DPI HTML Canvas overlay for 100% PERFECT Devanagari ligatures
    if (hasDevanagari && typeof document !== 'undefined') {
      const scale = 2; // 2x scale for 300+ DPI razor-sharp output
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.scale(scale, scale);

        for (const field of fieldConfigs) {
          let textValue = field.isCustomText
            ? field.customValue || ''
            : String(rowData[field.columnKey] || '').trim();

          if (!textValue) continue;

          const fontConfig = getFontById(field.fontFamily || 'great_vibes');
          const baseFontSize = field.fontSize || 32;
          const effectiveFontSize = Math.max(12, Math.round(baseFontSize * resolutionScale));

          const fontStyleStr =
            field.fontStyle === 'bold' ? 'bold ' : field.fontStyle === 'italic' ? 'italic ' : '';

          ctx.font = `${fontStyleStr}${effectiveFontSize}px ${fontConfig.cssFamily}, 'Baloo 2', 'Rozha One', 'Yatra One', 'Tiro Devanagari Marathi', sans-serif`;
          ctx.fillStyle = field.fontColor || '#000000';
          ctx.textAlign = field.alignment || 'center';
          ctx.textBaseline = 'middle';

          let x = (field.xPercent / 100) * width;
          let y = (field.yPercent / 100) * height;

          ctx.fillText(textValue, x, y);
        }

        const overlayDataUrl = canvas.toDataURL('image/png');
        const overlayBytes = await fetch(overlayDataUrl).then((r) => r.arrayBuffer());
        const overlayImage = await pdfDoc.embedPng(overlayBytes);
        page.drawImage(overlayImage, {
          x: 0,
          y: 0,
          width,
          height,
        });

        return await pdfDoc.save();
      }
    }

    // Standard pdf-lib embedding for non-Devanagari / English text
    pdfDoc.registerFontkit(fontkit);
    const fontCache: Record<string, any> = {};

    for (const field of fieldConfigs) {
      let textValue = field.isCustomText
        ? field.customValue || ''
        : String(rowData[field.columnKey] || '').trim();

      if (!textValue) continue;

      const fontConfig = getFontById(field.fontFamily || 'great_vibes');
      const cacheKey = fontConfig.id + '_' + field.fontStyle;

      if (!fontCache[cacheKey]) {
        if (fontConfig.ttfUrl) {
          try {
            const fontBytes =
              fontBytesMap?.get(fontConfig.id) || (await this.fetchFontBytes(fontConfig.ttfUrl));
            fontCache[cacheKey] = await pdfDoc.embedFont(fontBytes);
          } catch (err) {
            console.warn(`Fallback to standard PDF font for ${fontConfig.id}`, err);
            const fontName = this.getFontName(fontConfig.category, field.fontStyle);
            fontCache[cacheKey] = await pdfDoc.embedFont(fontName);
          }
        } else {
          const fontName = this.getFontName(fontConfig.category, field.fontStyle);
          fontCache[cacheKey] = await pdfDoc.embedFont(fontName);
        }
      }

      const font = fontCache[cacheKey];
      const baseFontSize = field.fontSize || 32;
      const effectiveFontSize = Math.max(12, Math.round(baseFontSize * resolutionScale));

      const textWidth = font.widthOfTextAtSize(textValue, effectiveFontSize);
      const color = this.hexToRgb(field.fontColor || '#000000');

      let x = (field.xPercent / 100) * width;
      let y = height - (field.yPercent / 100) * height;

      if (field.alignment === 'center') {
        x = x - textWidth / 2;
      } else if (field.alignment === 'right') {
        x = x - textWidth;
      }

      y = y - effectiveFontSize / 3;

      page.drawText(textValue, {
        x,
        y,
        size: effectiveFontSize,
        font,
        color,
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Sanitize filename for individual participant PDFs (supports Marathi, English & international Unicode characters)
   */
  static sanitizeFilename(name: string): string {
    const clean = name
      .replace(/[\/\\:\*\?"<>\|\x00-\x1F]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    return clean || 'Certificate';
  }

  /**
   * Batch generate PDFs for all rows in Excel/CSV dataset
   */
  static async batchGenerate(
    templateBytes: ArrayBuffer,
    templateType: 'image' | 'pdf',
    mimeType: string,
    fieldConfigs: TextFieldConfig[],
    rawRows: Record<string, any>[],
    nameColumn: string,
    certIdColumn: string,
    emailColumn: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    certificates: GeneratedCertificate[];
    zipBlob: Blob;
  }> {
    const zip = new JSZip();
    const certificates: GeneratedCertificate[] = [];
    const usedFilenames = new Map<string, number>();

    // Initial progress report & yield 50ms so React mounts and renders the progress bar
    if (onProgress) {
      onProgress(0, rawRows.length);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Pre-load web fonts into browser document.fonts for canvas rendering
    if (typeof document !== 'undefined' && document.fonts) {
      for (const field of fieldConfigs) {
        const fontConfig = getFontById(field.fontFamily || 'great_vibes');
        try {
          await document.fonts.load(`16px ${fontConfig.cssFamily}`);
        } catch (e) {
          // ignore font load error
        }
      }
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore
      }
    }

    // Pre-fetch all needed TTF fonts in parallel before rendering loop
    const fontBytesMap = new Map<string, ArrayBuffer>();
    for (const field of fieldConfigs) {
      const fontConfig = getFontById(field.fontFamily || 'great_vibes');
      if (fontConfig.ttfUrl && !fontBytesMap.has(fontConfig.id)) {
        try {
          const bytes = await this.fetchFontBytes(fontConfig.ttfUrl);
          fontBytesMap.set(fontConfig.id, bytes);
        } catch (err) {
          console.warn(`Could not pre-fetch font ${fontConfig.id}`, err);
        }
      }
    }

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const participantName = String(row[nameColumn] || `Participant_${i + 1}`).trim();
      const certificateId = certIdColumn ? String(row[certIdColumn] || '').trim() : '';
      const email = emailColumn ? String(row[emailColumn] || '').trim() : '';

      const pdfBytes = await this.generateSinglePDF(
        templateBytes,
        templateType,
        mimeType,
        fieldConfigs,
        row,
        fontBytesMap
      );

      let baseFilename = this.sanitizeFilename(participantName);
      if (usedFilenames.has(baseFilename)) {
        const count = usedFilenames.get(baseFilename)! + 1;
        usedFilenames.set(baseFilename, count);
        baseFilename = `${baseFilename}_${count}`;
      } else {
        usedFilenames.set(baseFilename, 1);
      }

      const filename = `${baseFilename}.pdf`;
      const buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const pdfBlob = new Blob([buffer], { type: 'application/pdf' });

      certificates.push({
        participantName,
        certificateId,
        email,
        filename,
        pdfBlob,
        arrayBuffer: buffer,
      });

      zip.file(filename, buffer);

      if (onProgress) {
        onProgress(i + 1, rawRows.length);
        // Yield 20ms macro-task to give browser time for UI repaint & keep page 100% responsive
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return { certificates, zipBlob };
  }
}
