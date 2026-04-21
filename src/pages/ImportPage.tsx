import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadCsv, useConfirmMapping } from '../hooks/useLists';
import { Upload, FileText, Check, X, ChevronDown } from 'lucide-react';

type Step = 'upload' | 'mapping' | 'importing';

interface UploadResult {
  listId: string;
  headers: string[];
  delimiter: string;
  encoding: string;
  preview: string[][];
}

const BUILTIN_FIELDS = [
  { value: 'email', label: 'Email' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'name', label: 'Name' },
  { value: 'company_name', label: 'Company Name' },
  { value: 'company_website', label: 'Website' },
];

export function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [delimiter, setDelimiter] = useState(',');
  const [dragActive, setDragActive] = useState(false);

  const navigate = useNavigate();
  const uploadCsv = useUploadCsv();
  const confirmMapping = useConfirmMapping();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(csv|txt)$/i)) {
      alert('Please upload a CSV file');
      return;
    }

    try {
      const result = await uploadCsv.mutateAsync(file);
      setUploadResult(result);

      // Auto-detect mappings (simple client-side version)
      const autoMappings: Record<string, string> = {};
      for (const header of result.headers) {
        const lower = header.toLowerCase().replace(/[-_\s]+/g, '_');
        const match = BUILTIN_FIELDS.find((f) =>
          lower.includes(f.value.replace('_', '')) || lower === f.value
        );
        if (match && !Object.values(autoMappings).includes(match.value)) {
          autoMappings[header] = match.value;
        }
      }
      setMappings(autoMappings);
      setDelimiter(result.delimiter);
      setStep('mapping');
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [uploadCsv]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  async function handleConfirmMapping() {
    if (!uploadResult) return;

    const hasEmail = Object.values(mappings).includes('email');
    if (!hasEmail) {
      alert('Email column mapping is required');
      return;
    }

    const mappingPayload = {
      delimiter,
      encoding: uploadResult.encoding,
      mappings: Object.entries(mappings)
        .filter(([, target]) => target !== 'skip')
        .map(([csvHeader, target]) => ({
          csv_header: csvHeader,
          target,
          type: BUILTIN_FIELDS.some((f) => f.value === target) ? 'builtin' : 'custom',
        })),
      skipped: Object.entries(mappings)
        .filter(([, target]) => target === 'skip')
        .map(([header]) => header),
      created_fields: [],
    };

    try {
      await confirmMapping.mutateAsync({
        listId: uploadResult.listId,
        mapping: mappingPayload,
      });
      setStep('importing');
      // Redirect to list after short delay
      setTimeout(() => navigate(`/lists/${uploadResult.listId}`), 2000);
    } catch (err) {
      console.error('Mapping confirmation failed:', err);
    }
  }

  // ─── Upload Step ───────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Import CSV</h1>

        <div
          className={`rounded-lg border-2 border-dashed p-16 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Drag and drop a CSV file here, or
          </p>
          <label className="mt-2 inline-block cursor-pointer rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
            Browse files
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Max 100 MB / 500K rows</p>
        </div>

        {uploadCsv.isPending && (
          <div className="text-sm text-muted-foreground">Uploading and parsing...</div>
        )}
        {uploadCsv.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Upload failed: {(uploadCsv.error as Error).message}
          </div>
        )}
      </div>
    );
  }

  // ─── Mapping Step ──────────────────────────────────────────────────────────
  if (step === 'mapping' && uploadResult) {
    const usedTargets = new Set(Object.values(mappings).filter((v) => v !== 'skip'));

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Map Columns</h1>
        <p className="text-sm text-muted-foreground">
          Map your CSV columns to contact fields. Email is required.
        </p>

        {/* Delimiter override per §8.1 */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Delimiter:</label>
          <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground">
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value={'\t'}>Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CSV Column</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Preview</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Map to</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {uploadResult.headers.map((header, idx) => {
                const current = mappings[header] ?? '';
                const isMapped = current && current !== 'skip';
                return (
                  <tr key={header} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{header}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-48 truncate">
                      {uploadResult.preview.map((row) => row[idx] ?? '').filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={current}
                        onChange={(e) => setMappings((prev) => ({ ...prev, [header]: e.target.value }))}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                      >
                        <option value="">-- Select --</option>
                        <optgroup label="Built-in Fields">
                          {BUILTIN_FIELDS.map((f) => (
                            <option key={f.value} value={f.value} disabled={usedTargets.has(f.value) && current !== f.value}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>
                        <option value="skip">Don't Import</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isMapped ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <Check className="h-3 w-3" /> Mapped
                        </span>
                      ) : current === 'skip' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <X className="h-3 w-3" /> Skipped
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConfirmMapping}
            disabled={!Object.values(mappings).includes('email') || confirmMapping.isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {confirmMapping.isPending ? 'Starting import...' : 'Start Import'}
          </button>
          <button
            onClick={() => { setStep('upload'); setUploadResult(null); setMappings({}); }}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Importing Step ────────────────────────────────────────────────────────
  return (
    <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[50vh]">
      <FileText className="h-12 w-12 text-primary animate-pulse" />
      <h2 className="text-xl font-bold text-foreground">Importing contacts...</h2>
      <p className="text-sm text-muted-foreground">
        Your CSV is being processed. You'll be redirected shortly.
      </p>
    </div>
  );
}
