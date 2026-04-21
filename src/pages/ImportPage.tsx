import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadCsv, useConfirmMapping } from '../hooks/useLists';
import { Upload, FileText, Check, X, Loader2, ArrowLeft } from 'lucide-react';

type Step = 'upload' | 'mapping' | 'importing';

interface UploadResult {
  listId: string;
  headers: string[];
  delimiter: string;
  encoding: string;
  preview: string[][];
}

const BUILTIN_FIELDS = [
  { value: 'email', label: 'Email *', required: true },
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
        .filter(([, target]) => target !== 'skip' && target !== '')
        .map(([csvHeader, target]) => ({
          csv_header: csvHeader,
          target,
          type: BUILTIN_FIELDS.some((f) => f.value === target) ? 'builtin' : 'custom',
        })),
      skipped: Object.entries(mappings).filter(([, t]) => t === 'skip').map(([h]) => h),
      created_fields: [],
    };

    try {
      await confirmMapping.mutateAsync({
        listId: uploadResult.listId,
        mapping: mappingPayload,
      });
      setStep('importing');
      setTimeout(() => navigate(`/lists/${uploadResult.listId}`), 2000);
    } catch (err) {
      console.error('Mapping confirmation failed:', err);
    }
  }

  // ─── Upload Step ─────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="p-8 space-y-6 animate-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Import CSV</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload a CSV file with your contacts to enrich</p>
        </div>

        <div className="card p-2">
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-16 text-center transition-all ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-border bg-background/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Drop your CSV file here</h3>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>

            <label className="btn-primary btn-md mt-5 cursor-pointer">
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

            <p className="mt-4 text-xs text-muted-foreground">
              Max 100 MB · 500K rows · UTF-8 encoding recommended
            </p>
          </div>
        </div>

        {uploadCsv.isPending && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading and parsing...
          </div>
        )}
        {uploadCsv.error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            Upload failed: {(uploadCsv.error as Error).message}
          </div>
        )}
      </div>
    );
  }

  // ─── Mapping Step ────────────────────────────────────────────────────────
  if (step === 'mapping' && uploadResult) {
    const usedTargets = new Set(Object.values(mappings).filter((v) => v !== 'skip' && v !== ''));
    const hasEmailMapped = Object.values(mappings).includes('email');

    return (
      <div className="p-8 space-y-6 animate-in max-w-5xl">
        <button onClick={() => { setStep('upload'); setUploadResult(null); setMappings({}); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Map Columns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Match your CSV columns to contact fields. <span className="text-red-400">Email is required.</span>
          </p>
        </div>

        {/* Delimiter */}
        <div className="card p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="input max-w-40"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value={'\t'}>Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
          <span className="text-xs text-muted-foreground">Auto-detected. Change if rows don't parse correctly.</span>
        </div>

        {/* Mapping table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">CSV Column</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Map to</th>
                <th className="px-5 py-3 w-20 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {uploadResult.headers.map((header, idx) => {
                const current = mappings[header] ?? '';
                const isMapped = current && current !== 'skip';
                return (
                  <tr key={header} className="border-b border-border">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{header}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground max-w-64 truncate">
                      {uploadResult.preview.map((row) => row[idx] ?? '').filter(Boolean).slice(0, 2).join(' · ') || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={current}
                        onChange={(e) => setMappings((prev) => ({ ...prev, [header]: e.target.value }))}
                        className="input input-sm max-w-56"
                      >
                        <option value="">-- Select --</option>
                        <optgroup label="Contact Fields">
                          {BUILTIN_FIELDS.map((f) => (
                            <option key={f.value} value={f.value} disabled={usedTargets.has(f.value) && current !== f.value}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>
                        <option value="skip">Don't import</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      {isMapped ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <Check className="h-3 w-3" /> Mapped
                        </span>
                      ) : current === 'skip' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <X className="h-3 w-3" /> Skipped
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirmMapping}
            disabled={!hasEmailMapped || confirmMapping.isPending}
            className="btn-primary btn-md"
          >
            {confirmMapping.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting import...
              </>
            ) : (
              'Start Import'
            )}
          </button>
          <button
            onClick={() => { setStep('upload'); setUploadResult(null); setMappings({}); }}
            className="btn-outline btn-md"
          >
            Cancel
          </button>
          {!hasEmailMapped && (
            <span className="text-sm text-amber-400 ml-auto">⚠ Email mapping is required</span>
          )}
        </div>
      </div>
    );
  }

  // ─── Importing Step ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="text-center animate-in">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <FileText className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Importing contacts<span className="loading-dots"></span></h2>
        <p className="mt-2 text-sm text-muted-foreground">Your CSV is being processed. You'll be redirected shortly.</p>
      </div>
    </div>
  );
}
