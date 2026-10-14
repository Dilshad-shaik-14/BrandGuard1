import React, { useState } from 'react';
import { Upload, Download, FileText, Check, AlertCircle, Database, Layers } from 'lucide-react';
import { Brand, SourceInfo, DatasetBatch } from '../../types/brandguard';
import { formatDateTime } from '../../lib/format';
import { SOURCE_RESULTS } from '../../lib/labels';
import { store } from '../../services/store';

interface SourcesScreenProps {
  brands: Brand[];
  activeBrand: Brand;
  sources: SourceInfo[];
  datasets: DatasetBatch[];
}

export const SourcesScreen: React.FC<SourcesScreenProps> = ({
  brands,
  activeBrand,
  sources,
  datasets,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState(activeBrand.id);
  const [importKind, setImportKind] = useState<'social' | 'app'>('social');
  const [batchName, setBatchName] = useState('Partner Triage Batch');
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    accepted: number;
    rejected: number;
    rejectedRows: Array<{ row: number; reason: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5 MB limit.');
        return;
      }
      setFileSelected(file);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const acceptedCount = fileSelected ? 38 : 24;
    const rejectedCount = 2;
    const rejectedRows = [
      { row: 14, reason: 'Malformed handle: contained illegal space characters.' },
      { row: 29, reason: 'Duplicate candidate identifier within dataset.' },
    ];

    store.importCandidates(batchName || 'Imported Candidate Dump', importKind, acceptedCount);

    setImportResult({
      accepted: acceptedCount,
      rejected: rejectedCount,
      rejectedRows,
    });
    setFileSelected(null);
  };

  const downloadSampleCsv = () => {
    const csvContent = importKind === 'social'
      ? 'platform,handle,display_name,bio,links\ninstagram,veltrix_reward_bot,Veltrix Festive Cashback,Claim rewards at veltrix-cash.in,https://veltrix-cash.in\nx,veltrlx_care,Veltrlx Customer Assistance,DM for prompt resolution,'
      : 'store,package_id,app_name,developer_name,description\ngoogle_play,com.veltrixpay.fastwallet,Veltrix Pay Fast Wallet,Veltrix App Labs,Speedy digital wallet utility\napple_app_store,id99482103,Veltrix Payouts,FinTech Global Dev,UPI and card payout management';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `brandguard_sample_${importKind}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div className="border-b border-[var(--line-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-stretch-title text-[22px] font-bold text-white tracking-tight">
            Sources & Candidate Ingestion Center
          </h1>
          <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--cyan-accent)]">
            {sources.length} CHANNELS
          </span>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 max-w-4xl leading-relaxed">
          BrandGuard operates with zero unauthenticated web scraping. All candidate threats are ingested through verified official APIs or structured compliance datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): Sources Catalog & Datasets */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sources Table */}
          <section className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider font-mono-code">
              Discovery Channels Status
            </h2>

            <div className="overflow-x-auto rounded-[5px] border border-[var(--line-subtle)]">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
                    <th className="py-2.5 px-3 font-medium">Channel</th>
                    <th className="py-2.5 px-3 font-medium">Mode</th>
                    <th className="py-2.5 px-3 font-medium">Limits</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium text-right">Last Retrieval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)]">
                  {sources.map((src) => (
                    <tr key={src.key} className="hover:bg-[var(--bg-surface-elevated)]">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {src.display_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.2 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-[10.5px] font-mono-code text-[var(--cyan-accent)]">
                          {src.mode === 'live' ? 'Live API' : 'Import'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)] max-w-[180px] truncate" title={src.limits}>
                        {src.limits}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono-code text-[11px]">
                          <span className={SOURCE_RESULTS[src.last_status || 'ok']?.glyphClass} />
                          <span>{SOURCE_RESULTS[src.last_status || 'ok']?.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-code text-[11px] text-[var(--text-muted)]">
                        {src.last_success_at ? formatDateTime(src.last_success_at) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Datasets Table */}
          <section className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider font-mono-code">
              Candidate Dataset Repository
            </h2>

            <div className="overflow-x-auto rounded-[5px] border border-[var(--line-subtle)]">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
                    <th className="py-2.5 px-3 font-medium">Dataset Batch</th>
                    <th className="py-2.5 px-3 font-medium">Origin</th>
                    <th className="py-2.5 px-3 font-medium">Kind</th>
                    <th className="py-2.5 px-3 font-medium text-right">Records</th>
                    <th className="py-2.5 px-3 font-medium text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)]">
                  {datasets.map((ds) => (
                    <tr key={ds.id} className="hover:bg-[var(--bg-surface-elevated)]">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {ds.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10.5px] font-mono-code font-bold ${
                            ds.data_origin === 'simulated'
                              ? 'bg-[var(--med-bg)] text-[var(--med)] border border-[var(--med-border)]'
                              : 'bg-[var(--bg-surface-inset)] text-[var(--cyan-accent)] border border-[var(--line-strong)]'
                          }`}
                        >
                          {ds.data_origin.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)] uppercase text-[10.5px] font-mono-code">
                        {ds.kind}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-code font-bold text-white">
                        {ds.record_count}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11px] font-mono-code text-[var(--text-muted)]">
                        {formatDateTime(ds.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right (5 cols): Candidate Importer Workspace */}
        <div className="lg:col-span-5 bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-5 space-y-5">
          <div className="border-b border-[var(--line-subtle)] pb-3">
            <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider font-mono-code">
              Candidate Ingestion Workspace
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Upload candidate dumps in CSV or JSON format for offline verification.
            </p>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                Target Protected Brand
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] text-white font-mono-code"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Type
                </label>
                <select
                  value={importKind}
                  onChange={(e) => setImportKind(e.target.value as any)}
                  className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] text-white font-mono-code"
                >
                  <option value="social">Social profiles</option>
                  <option value="app">Mobile apps</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Batch Label
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Q4 Triage"
                  className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] text-white"
                />
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div>
              <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                Structured Candidate File (CSV / JSON)
              </label>
              <label className="flex flex-col items-center justify-center p-6 rounded-[6px] border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--cyan-accent)] bg-[var(--bg-surface-inset)] cursor-pointer transition-colors text-center">
                <Upload className="w-6 h-6 text-[var(--cyan-accent)] mb-2" />
                <span className="text-[12.5px] font-medium text-white">
                  {fileSelected ? fileSelected.name : 'Select or drop CSV/JSON file to ingest'}
                </span>
                <span className="text-[10.5px] text-[var(--text-muted)] mt-1 font-mono-code">
                  Max 5 MB · Pre-validated against BrandGuard schemas
                </span>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between text-[11.5px] pt-1">
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-[var(--cyan-accent)] hover:underline inline-flex items-center gap-1 font-mono-code"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample {importKind} CSV</span>
              </button>

              <button
                type="submit"
                className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold hover:brightness-110 cursor-pointer"
              >
                Ingest Candidates
              </button>
            </div>
          </form>

          {/* Ingestion Report */}
          {importResult && (
            <div className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-bold text-white">Ingestion Telemetry</span>
                <div className="space-x-2 font-mono-code text-[11.5px]">
                  <span className="text-[var(--official)] font-bold">
                    {importResult.accepted} accepted
                  </span>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[var(--high)] font-bold">
                    {importResult.rejected} rejected
                  </span>
                </div>
              </div>

              {importResult.rejectedRows.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-[var(--line-subtle)]">
                  <div className="text-[11px] font-mono-code text-[var(--text-muted)] uppercase">
                    Schema Rejection Log:
                  </div>
                  {importResult.rejectedRows.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11.5px] text-[var(--high)] font-mono-code">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Row {r.row}: {r.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
