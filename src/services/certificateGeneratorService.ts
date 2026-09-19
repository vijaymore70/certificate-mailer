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
    category: 'script' | 'serif' | 'sans' | 'mono' = 'sans',
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
   * Generate a single PDF document overlaying text configurations onto template bytes
   */
  static async generateSinglePDF(
    templateBytes: ArrayBuffer,
    templateType: 'image' | 'pdf',
    mimeType: string,
    fieldConfigs: TextFieldConfig[],
    rowData: Record<string, any>
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

    // Register fontkit for embedding custom TTF fonts
    pdfDoc.registerFontkit(fontkit);

    // Resolution scale normalization factor based on standard 1000pt baseline
    const resolutionScale = width / 1000;

    // Embed fonts cache
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
            const fontBytes = await this.fetchFontBytes(fontConfig.ttfUrl);
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

      // Calculate normalized font size relative to template resolution
      const baseFontSize = field.fontSize || 32;
      const effectiveFontSize = Math.max(12, Math.round(baseFontSize * resolutionScale));

      const textWidth = font.widthOfTextAtSize(textValue, effectiveFontSize);
      const color = this.hexToRgb(field.fontColor || '#000000');

      // PDF coordinates have (0,0) at bottom-left corner
      let x = (field.xPercent / 100) * width;
      let y = height - (field.yPercent / 100) * height;

      // Adjust alignment
      if (field.alignment === 'center') {
        x = x - textWidth / 2;
      } else if (field.alignment === 'right') {
        x = x - textWidth;
      }

      // Vertical alignment compensation so text draws nicely on baseline
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
   * Sanitize filename for individual participant PDFs
   */
  static sanitizeFilename(name: string): string {
    const clean = name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
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

    if (onProgress) {
      onProgress(0, rawRows.length);
      await new Promise((resolve) => setTimeout(resolve, 0));
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
        row
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
        // Yield macro-task to let UI repaint real-time percentage
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return { certificates, zipBlob };
  }
}
