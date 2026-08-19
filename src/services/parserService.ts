import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Participant, ColumnMapping, ParticipantValidationError } from '../types/participant';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, any>[];
  suggestedMapping: ColumnMapping;
}

export class ParserService {
  /**
   * Parse a File (CSV or XLSX) into raw headers and rows
   */
  static async parseFile(file: File): Promise<ParseResult> {
    const filename = file.name.toLowerCase();

    if (filename.endsWith('.csv')) {
      return this.parseCSV(file);
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return this.parseXLSX(file);
    } else {
      throw new Error('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
    }
  }

  private static parseCSV(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0 && results.data.length === 0) {
            return reject(new Error(`CSV Parsing error: ${results.errors[0].message}`));
          }
          const headers = results.meta.fields || [];
          const rawRows = results.data as Record<string, any>[];
          const suggestedMapping = this.autoDetectMapping(headers);
          resolve({ headers, rawRows, suggestedMapping });
        },
        error: (err) => reject(err),
      });
    });
  }

  private static async parseXLSX(file: File): Promise<ParseResult> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      throw new Error('Excel workbook contains no sheets.');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      return { headers: [], rawRows: [], suggestedMapping: { name: '', email: '', certificateId: '' } };
    }

    const headers = Object.keys(rawRows[0]);
    const suggestedMapping = this.autoDetectMapping(headers);

    return { headers, rawRows, suggestedMapping };
  }

  /**
   * Automatically guess standard column mapping based on header titles
   */
  static autoDetectMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
      name: '',
      email: '',
      certificateId: '',
      registrationId: '',
      eventName: '',
    };

    headers.forEach((h) => {
      const lower = h.trim().toLowerCase();
      
      // Name
      if (!mapping.name) {
        if (
          lower === 'name' ||
          lower === 'full name' ||
          lower === 'participant name' ||
          lower === 'student name' ||
          lower === 'candidate name'
        ) {
          mapping.name = h;
        }
      }

      // Email
      if (!mapping.email) {
        if (
          lower === 'email' ||
          lower === 'email address' ||
          lower === 'email_address' ||
          lower === 'e-mail' ||
          lower === 'mail' ||
          lower === 'email id'
        ) {
          mapping.email = h;
        }
      }

      // Certificate ID
      if (!mapping.certificateId) {
        if (
          lower === 'certificate_id' ||
          lower === 'certificate id' ||
          lower === 'cert_id' ||
          lower === 'cert id' ||
          lower === 'certificate number' ||
          lower === 'cert no' ||
          lower === 'cert_no' ||
          lower === 'certificate_number'
        ) {
          mapping.certificateId = h;
        }
      }

      // Registration ID
      if (!mapping.registrationId) {
        if (
          lower === 'registration_id' ||
          lower === 'registration id' ||
          lower === 'reg_id' ||
          lower === 'reg id' ||
          lower === 'registration no'
        ) {
          mapping.registrationId = h;
        }
      }

      // Event Name
      if (!mapping.eventName) {
        if (
          lower === 'event_name' ||
          lower === 'event name' ||
          lower === 'event' ||
          lower === 'workshop' ||
          lower === 'course'
        ) {
          mapping.eventName = h;
        }
      }
    });

    // Fallbacks if exact keywords weren't matched
    if (!mapping.name) {
      const found = headers.find((h) => h.toLowerCase().includes('name'));
      if (found) mapping.name = found;
    }
    if (!mapping.email) {
      const found = headers.find((h) => h.toLowerCase().includes('mail'));
      if (found) mapping.email = found;
    }
    if (!mapping.certificateId) {
      const found = headers.find((h) => h.toLowerCase().includes('cert') || h.toLowerCase().includes('id'));
      if (found) mapping.certificateId = found;
    }

    return mapping;
  }

  /**
   * Convert raw sheet data into clean Participant objects and validate
   */
  static processAndValidateParticipants(
    rawRows: Record<string, any>[],
    mapping: ColumnMapping,
    eventId: string,
    defaultEventName?: string
  ): { participants: Participant[]; errors: ParticipantValidationError[] } {
    const participants: Participant[] = [];
    const errors: ParticipantValidationError[] = [];

    const emailTracker = new Set<string>();
    const certIdTracker = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rawName = String(row[mapping.name] || '').trim();
      const rawEmail = String(row[mapping.email] || '').trim();
      const rawCertId = String(row[mapping.certificateId] || '').trim();
      const rawRegId = mapping.registrationId ? String(row[mapping.registrationId] || '').trim() : '';
      const rawEventName = mapping.eventName
        ? String(row[mapping.eventName] || '').trim()
        : (defaultEventName || '');

      let hasError = false;

      // 1. Missing Name Check
      if (!rawName) {
        errors.push({
          rowNumber: rowNum,
          name: rawName,
          email: rawEmail,
          certificateId: rawCertId,
          type: 'MISSING_NAME',
          message: `Row ${rowNum}: Participant name is required.`,
        });
        hasError = true;
      }

      // 2. Email Validation
      if (!rawEmail) {
        errors.push({
          rowNumber: rowNum,
          name: rawName,
          email: rawEmail,
          certificateId: rawCertId,
          type: 'INVALID_EMAIL',
          message: `Row ${rowNum}: Email address is missing.`,
        });
        hasError = true;
      } else if (!EMAIL_REGEX.test(rawEmail)) {
        errors.push({
          rowNumber: rowNum,
          name: rawName,
          email: rawEmail,
          certificateId: rawCertId,
          type: 'INVALID_EMAIL',
          message: `Row ${rowNum}: Email address "${rawEmail}" is invalid.`,
        });
        hasError = true;
      } else {
        const lowerEmail = rawEmail.toLowerCase();
        if (emailTracker.has(lowerEmail)) {
          errors.push({
            rowNumber: rowNum,
            name: rawName,
            email: rawEmail,
            certificateId: rawCertId,
            type: 'DUPLICATE_EMAIL',
            message: `Row ${rowNum}: Duplicate email address "${rawEmail}".`,
          });
        }
        emailTracker.add(lowerEmail);
      }

      // 3. Certificate ID Validation
      if (!rawCertId && !rawName) {
        errors.push({
          rowNumber: rowNum,
          name: rawName,
          email: rawEmail,
          certificateId: rawCertId,
          type: 'MISSING_CERT_ID',
          message: `Row ${rowNum}: Certificate ID or Name is missing.`,
        });
      } else if (rawCertId) {
        if (certIdTracker.has(rawCertId)) {
          errors.push({
            rowNumber: rowNum,
            name: rawName,
            email: rawEmail,
            certificateId: rawCertId,
            type: 'DUPLICATE_CERT_ID',
            message: `Row ${rowNum}: Duplicate Certificate ID "${rawCertId}".`,
          });
        }
        certIdTracker.add(rawCertId);
      }

      const participant: Participant = {
        id: `P_${eventId}_${Date.now()}_${idx}`,
        eventId,
        name: rawName,
        email: rawEmail,
        certificateId: rawCertId || (rawName ? rawName.replace(/\s+/g, '_') : `CERT_${idx + 1}`),
        registrationId: rawRegId,
        eventName: rawEventName,
        status: hasError ? 'INVALID' : 'PENDING',
        matchStatus: 'NOT_FOUND',
        attempts: 0,
      };

      participants.push(participant);
    });

    return { participants, errors };
  }
}
