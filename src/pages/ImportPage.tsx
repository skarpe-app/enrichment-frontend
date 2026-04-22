import { useCallback, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirmMapping, useUploadCsv } from '../hooks/useLists';
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  TableProperties,
  Upload,
  X,
} from 'lucide-react';

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
        const match = BUILTIN_FIELDS.find((field) =>
          lower.includes(field.value.replace('_', '')) || lower === field.value
        );
        if (match && !Object.values(autoMappings).includes(match.value)) {
          autoMappings[header] = match.value;
        }
      }

      setMappings(autoMappings);
      setDelimiter(result.delimiter);
      setStep('mapping');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [uploadCsv]);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
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
          type: BUILTIN_FIELDS.some((field) => field.value === target) ? 'builtin' : 'custom',
        })),
      skipped: Object.entries(mappings).filter(([, target]) => target === 'skip').map(([header]) => header),
      created_fields: [],
    };

    try {
      await confirmMapping.mutateAsync({
        listId: uploadResult.listId,
        mapping: mappingPayload,
      });
      setStep('importing');
      setTimeout(() => navigate(`/lists/${uploadResult.listId}`), 2000);
    } catch (error) {
      console.error('Mapping confirmation failed:', error);
    }
  }

  if (step === 'upload') {
    return (
      <div className="min-h-full animate-in">
        <div className="border-b border-border bg-background px-6 py-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Ingestion</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Import CSV</h1>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div
            className={`flex min-h-[27rem] flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/35'
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-black text-foreground">Drop CSV file</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Upload a CSV or TXT contact file. The next step maps columns before import starts.
            </p>
            <label className="btn-primary btn-md mt-6 cursor-pointer">
              Browse Files
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="chip">Max 100 MB</span>
              <span className="chip">500K rows</span>
              <span className="chip">UTF-8 recommended</span>
            </div>
          </div>

          <aside className="panel p-4">
            <div className="flex items-center gap-3">
              <TableProperties className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-black text-foreground">Import Flow</h2>
                <p className="mt-1 text-xs text-muted-foreground">Upload, map, then process contacts.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {['Upload file', 'Map required fields', 'Process import'].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-black ${index === 0 ? 'border-primary/35 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="px-6 pb-6">
          {uploadCsv.isPending && (
            <div className="panel flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading and parsing...
            </div>
          )}
          {uploadCsv.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Upload failed: {(uploadCsv.error as Error).message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'mapping' && uploadResult) {
    const usedTargets = new Set(Object.values(mappings).filter((value) => value !== 'skip' && value !== ''));
    const hasEmailMapped = Object.values(mappings).includes('email');

    return (
      <div className="min-h-full animate-in">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-5">
          <div>
            <button
              onClick={() => {
                setStep('upload');
                setUploadResult(null);
                setMappings({});
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload
            </button>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Column Mapping</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Map CSV Columns</h1>
          </div>

          <div className="flex items-center gap-2">
            <select value={delimiter} onChange={(event) => setDelimiter(event.target.value)} className="input max-w-48">
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value={'\t'}>Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
            <button
              onClick={handleConfirmMapping}
              disabled={!hasEmailMapped || confirmMapping.isPending}
              className="btn-primary btn-md"
            >
              {confirmMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Start Import
            </button>
          </div>
        </div>

        <div className="toolbar">
          <span className="chip">{uploadResult.headers.length} columns</span>
          <span className="chip">Delimiter {delimiter === '\t' ? 'Tab' : delimiter}</span>
          {!hasEmailMapped && <span className="badge-warning">Email Required</span>}
        </div>

        <div className="p-6">
          <div className="table-shell">
            <div className="table-scroll max-h-[calc(100vh-17rem)]">
              <table className="data-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>CSV Column</th>
                    <th>Sample Values</th>
                    <th>Map To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.headers.map((header, index) => {
                    const current = mappings[header] ?? '';
                    const isMapped = current && current !== 'skip';
                    return (
                      <tr key={header}>
                        <td className="font-semibold">{header}</td>
                        <td className="max-w-xl truncate text-muted-foreground">
                          {uploadResult.preview.map((row) => row[index] ?? '').filter(Boolean).slice(0, 3).join(' | ') || '-'}
                        </td>
                        <td>
                          <select
                            value={current}
                            onChange={(event) => setMappings((previous) => ({ ...previous, [header]: event.target.value }))}
                            className="input input-sm max-w-64"
                          >
                            <option value="">Select field</option>
                            <optgroup label="Contact Fields">
                              {BUILTIN_FIELDS.map((field) => (
                                <option key={field.value} value={field.value} disabled={usedTargets.has(field.value) && current !== field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </optgroup>
                            <option value="skip">Do not import</option>
                          </select>
                        </td>
                        <td>
                          {isMapped ? (
                            <span className="badge-success">
                              <Check className="h-3 w-3" />
                              Mapped
                            </span>
                          ) : current === 'skip' ? (
                            <span className="badge-neutral">
                              <X className="h-3 w-3" />
                              Skipped
                            </span>
                          ) : (
                            <span className="badge-warning">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="panel w-full max-w-md p-8 text-center animate-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <FileText className="h-7 w-7 animate-pulse" />
        </div>
        <h2 className="mt-5 text-xl font-black tracking-tight text-foreground">
          Importing contacts<span className="loading-dots" />
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">The list will open after processing starts.</p>
      </div>
    </div>
  );
}
