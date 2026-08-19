import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SendingLogEntry } from '../types/api';

/**
 * Export sending logs to CSV file
 */
export function exportLogsToCSV(logs: SendingLogEntry[], filename = 'certificate_sending_history.csv') {
  const data = logs.map((log) => ({
    Timestamp: log.timestamp,
    'Event ID': log.eventId,
    'Participant Name': log.participantName,
    Email: log.email,
    'Certificate ID': log.certificateId,
    Status: log.status,
    Attempts: log.attemptNumber,
    'Error Message': log.errorMessage || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download pre-formatted Excel template (.xlsx) with sample data
 */
export function downloadExcelTemplate(filename = 'Participant_Import_Template.xlsx') {
  const sampleData = [
    {
      Name: 'Rahul Patil',
      Email: 'rahul.patil@example.com',
      Certificate_ID: 'CERT001',
      Registration_ID: 'REG-1001',
      Event_Name: 'Annual Seminar 2026',
    },
    {
      Name: 'Sneha More',
      Email: 'sneha.more@example.com',
      Certificate_ID: 'CERT002',
      Registration_ID: 'REG-1002',
      Event_Name: 'Annual Seminar 2026',
    },
    {
      Name: 'Amit Shah',
      Email: 'amit.shah@example.com',
      Certificate_ID: 'CERT003',
      Registration_ID: 'REG-1003',
      Event_Name: 'Annual Seminar 2026',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 22 }, // Name
    { wch: 28 }, // Email
    { wch: 18 }, // Certificate_ID
    { wch: 18 }, // Registration_ID
    { wch: 25 }, // Event_Name
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

  XLSX.writeFile(workbook, filename);
}

/**
 * Download pre-formatted CSV template (.csv) with sample data
 */
export function downloadCsvTemplate(filename = 'Participant_Import_Template.csv') {
  const sampleData = [
    {
      Name: 'Rahul Patil',
      Email: 'rahul.patil@example.com',
      Certificate_ID: 'CERT001',
      Registration_ID: 'REG-1001',
      Event_Name: 'Annual Seminar 2026',
    },
    {
      Name: 'Sneha More',
      Email: 'sneha.more@example.com',
      Certificate_ID: 'CERT002',
      Registration_ID: 'REG-1002',
      Event_Name: 'Annual Seminar 2026',
    },
    {
      Name: 'Amit Shah',
      Email: 'amit.shah@example.com',
      Certificate_ID: 'CERT003',
      Registration_ID: 'REG-1003',
      Event_Name: 'Annual Seminar 2026',
    },
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
