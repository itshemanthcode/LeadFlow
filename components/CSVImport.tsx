'use client';

import { useState } from 'react';
import { Lead, Channel } from '@/lib/types';
import { Upload, X, Check, AlertTriangle } from 'lucide-react';
import { useLeadAutomations } from '@/hooks/useLeadAutomations';
import { detectCityFromPhone, calculateLeadScore } from '@/lib/utils';

interface CSVImportProps {
  onImport: (leads: Lead[]) => void;
  onClose: () => void;
}

interface CSVRow {
  [key: string]: string;
}

export default function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<Record<string, string[]>>({});
  const [previewData, setPreviewData] = useState<Lead[]>([]);
  const { findDuplicates } = useLeadAutomations([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;

      // Parse CSV (simple parser - can be enhanced)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows: CSVRow[] = [];

      for (let i = 1; i < Math.min(lines.length, 11); i++) { // Preview first 10 rows
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }

      setCsvData(rows);
      
      // Auto-detect column mapping
      const mapping: Record<string, string> = {};
      headers.forEach(header => {
        const lower = header.toLowerCase();
        if (lower.includes('name')) mapping[header] = 'name';
        else if (lower.includes('phone') || lower.includes('mobile')) mapping[header] = 'phone';
        else if (lower.includes('email')) mapping[header] = 'email';
        else if (lower.includes('city')) mapping[header] = 'city';
        else if (lower.includes('model')) mapping[header] = 'preferredModel';
        else if (lower.includes('budget')) mapping[header] = 'budgetRange';
        else if (lower.includes('channel') || lower.includes('source')) mapping[header] = 'channel';
      });
      
      setColumnMapping(mapping);
      processPreview(rows, mapping);
    };

    reader.readAsText(uploadedFile);
  };

  const processPreview = (rows: CSVRow[], mapping: Record<string, string>) => {
    const preview: Lead[] = [];
    const dupMap: Record<string, string[]> = {};

    rows.forEach((row, index) => {
      const name = row[mapping['name']] || '';
      const phone = row[mapping['phone']] || '';
      const email = row[mapping['email']] || '';
      const city = row[mapping['city']] || detectCityFromPhone(phone);
      const preferredModel = row[mapping['preferredModel']] || '';
      const budgetRange = row[mapping['budgetRange']] || '';
      const channel = (row[mapping['channel']] || 'Offline').toUpperCase() as Channel;

      if (!name || !phone) return; // Skip invalid rows

      const lead: Lead = {
        id: `import-${index}`,
        name,
        phone,
        email: email || undefined,
        city,
        preferredModel: preferredModel || undefined,
        budgetRange: budgetRange || undefined,
        channel: ['FB', 'TWITTER', 'GOOGLE', 'WEBSITE', 'OFFLINE'].includes(channel) 
          ? channel as Channel 
          : 'Offline',
        owner: '',
        status: 'New',
        priority: 'Medium',
        score: 0,
        createdAt: new Date(),
        isRepeatLead: false,
      };

      lead.score = calculateLeadScore(lead);
      lead.city = city || detectCityFromPhone(phone);

      // Check for duplicates
      const existingLeads: Lead[] = []; // In real app, fetch from state/store
      const dups = findDuplicates(lead, existingLeads);
      if (dups.length > 0) {
        dupMap[lead.id] = dups.map(d => d.id);
      }

      preview.push(lead);
    });

    setPreviewData(preview);
    setDuplicates(dupMap);
  };

  const handleMappingChange = (csvColumn: string, leadField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: leadField,
    }));
    processPreview(csvData, { ...columnMapping, [csvColumn]: leadField });
  };

  const handleImport = () => {
    // Remove duplicates
    const leadsToImport = previewData.filter(lead => !duplicates[lead.id]);
    onImport(leadsToImport);
    onClose();
  };

  const csvColumns = csvData.length > 0 ? Object.keys(csvData[0]) : [];
  const leadFields = ['name', 'phone', 'email', 'city', 'preferredModel', 'budgetRange', 'channel'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Import Leads from CSV</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          {!file && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Choose File
                </label>
              </div>
            </div>
          )}

          {/* Column Mapping */}
          {file && csvColumns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Map CSV Columns to Lead Fields</h3>
              <div className="space-y-2">
                {csvColumns.map(col => (
                  <div key={col} className="flex items-center gap-4">
                    <div className="w-48 text-sm text-gray-700">{col}</div>
                    <div className="flex-1">
                      <select
                        value={columnMapping[col] || ''}
                        onChange={(e) => handleMappingChange(col, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">-- Select Field --</option>
                        {leadFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview ({previewData.length} leads)</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-left">City</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((lead, index) => (
                      <tr key={index} className={duplicates[lead.id] ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2">{lead.name}</td>
                        <td className="px-4 py-2">{lead.phone}</td>
                        <td className="px-4 py-2">{lead.city}</td>
                        <td className="px-4 py-2">
                          {duplicates[lead.id] ? (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              Duplicate
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600">
                              <Check className="w-4 h-4" />
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.keys(duplicates).length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <strong>{Object.keys(duplicates).length} duplicate(s) detected</strong> and will be excluded from import.
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={previewData.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {previewData.length - Object.keys(duplicates).length} Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

