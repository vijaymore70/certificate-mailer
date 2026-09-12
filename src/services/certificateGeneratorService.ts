import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';

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
   * Helper to select standard PDF font based on style
   */
  private static getFontName(style: 'normal' | 'bold' | 'italic'): StandardFonts {
    switch (style) {
      case 'bold':
        return StandardFonts.HelveticaBold;
      case 'italic':
        return StandardFonts.HelveticaOblique;
      case 'normal':
      default:
        return StandardFonts.Helvetica;
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

    // Embed fonts cache
    const fontCache: Record<string, any> = {};

    for (const field of fieldConfigs) {
      let textValue = field.isCustomText
        ? field.customValue || ''
        : String(rowData[field.columnKey] || '').trim();

      if (!textValue) continue;

      const fontName = this.getFontName(field.fontStyle);
      if (!fontCache[fontName]) {
        fontCache[fontName] = await pdfDoc.embedFont(fontName);
      }
      const font = fontCache[fontName];
      const fontSize = field.fontSize || 24;
      const textWidth = font.widthOfTextAtSize(textValue, fontSize);
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
      y = y - fontSize / 3;

      page.drawText(textValue, {
        x,
        y,
        size: fontSize,
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
      // Create copy of ArrayBuffer for Blob & zip
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
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return { certificates, zipBlob };
  }
}
