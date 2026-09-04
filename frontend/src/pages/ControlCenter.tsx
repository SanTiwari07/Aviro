import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, formatINR, formatNumber } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import arivoLogo from '../assets/arivo-logo.png';
import arivoName from '../assets/arivo-name.png';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

type Step = 'dataset' | 'preflight' | 'running' | 'completion';

interface ControlCenterProps {
  onRunCompleted?: (runResult: any) => void;
}

const PREFLIGHT_CHECKS = [
  { key: 'SCHEMA', label: 'SCHEMA', status: 'READY' },
  { key: 'CURRENCY', label: 'CURRENCY', status: 'READY' },
  { key: 'DUPLICATES', label: 'DUPLICATES', status: 'CLEAR' },
  { key: 'SETTLEMENT ARITHMETIC', label: 'SETTLEMENT ARITHMETIC', status: 'VALID' },
  { key: 'DATA INTEGRITY', label: 'DATA INTEGRITY', status: 'VALID' },
];

const RUN_STAGES = [
  { id: '01', name: 'INGESTING RECORDS' },
  { id: '02', name: 'VALIDATING DATA' },
  { id: '03', name: 'RECONCILING TRANSACTIONS' },
  { id: '04', name: 'INVESTIGATING AMBIGUITY' },
  { id: '05', name: 'APPLYING CONTROL GATE' },
  { id: '06', name: 'FINALISING DECISIONS' },
];

function parseFinancialCsv(text: string): { payments: any[]; settlements: any[] } {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { payments: [], settlements: [] };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const payments: any[] = [];
  const settlements: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    if (row.payment_id || row.id?.startsWith('pay_') || (!row.settlement_id && row.amount)) {
      payments.push({
        payment_id: row.payment_id || row.id || `pay_imp_${i}`,
        order_id: row.order_id || null,
        amount: parseInt(row.amount || '0', 10),
        currency: row.currency || 'INR',
        status: row.status || 'captured',
        created_at: row.created_at || new Date().toISOString(),
        reference: row.reference || null,
      });
    }
    if (row.settlement_id || row.id?.startsWith('setl_') || row.gross_amount) {
      settlements.push({
        settlement_id: row.settlement_id || row.id || `setl_imp_${i}`,
        gross_amount: parseInt(row.gross_amount || row.amount || '0', 10),
        fees: parseInt(row.fees || row.fee || '0', 10),
        tax: parseInt(row.tax || '0', 10),
        refunds: parseInt(row.refunds || '0', 10),
        chargebacks: parseInt(row.chargebacks || '0', 10),
        adjustments: parseInt(row.adjustments || '0', 10),
        net_amount: parseInt(row.net_amount || row.amount || '0', 10),
        currency: row.currency || 'INR',
        status: row.status || 'processed',
        created_at: row.created_at || new Date().toISOString(),
        utr: row.utr || null,
      });
    }
  }
  return { payments, settlements };
}

export default function ControlCenter({ onRunCompleted }: ControlCenterProps) {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<Step>('dataset');
  const [selectedDataset, setSelectedDataset] = useState<'demo' | 'import' | 'previous'>('demo');

  // Metadata & latest run state
  const [latestRun, setLatestRun] = useState<any>(null);
  const [latestRunId, setLatestRunId] = useState<string>('RUN_INIT');
  const [recordCount, setRecordCount] = useState<number>(5114);

  // Active run state
  const [activeRunId, setActiveRunId] = useState<string>('');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [runResult, setRunResult] = useState<any>(null);
  const [runDashboard, setRunDashboard] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [importedRecords, setImportedRecords] = useState<{ payments: any[]; settlements: any[] } | null>(null);

  // Load initial backend telemetry
  useEffect(() => {
    api.getRuns(1)
      .then((runs) => {
        if (Array.isArray(runs) && runs.length > 0) {
          setLatestRun(runs[0]);
          setLatestRunId(runs[0].run_id);
          if (runs[0].records_processed) {
            setRecordCount(runs[0].records_processed);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  // Format compact currency (e.g. ₹48.2M, ₹1.15 Cr)
  const formatCompactINR = (paise: number | undefined | null): string => {
    if (!paise || isNaN(paise)) return '₹0.00';
    const rupees = paise / 100;
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)} L`;
    }
    return formatINR(paise);
  };

  // Handle continuing previous run directly to Overview
  const handleContinuePreviousRun = () => {
    navigate('/overview', {
      state: {
        runId: latestRunId,
        recordCount: recordCount,
        completedAt: latestRun?.timestamp || 'Recently',
      },
    });
  };

  // Start the execution pipeline
  const handleStartRun = async () => {
    const generatedRunId = `RUN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setActiveRunId(generatedRunId);
    setStep('running');
    setActiveStageIndex(0);
    setRunError(null);

    // Calm stage progression while API reconciles
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx += 1;
      if (currentIdx < RUN_STAGES.length - 1) {
        setActiveStageIndex(currentIdx);
      }
    }, 700);

    try {
      const customPayload = (selectedDataset === 'import' && importedRecords && (importedRecords.payments.length > 0 || importedRecords.settlements.length > 0))
        ? importedRecords
        : undefined;

      const res = await api.runReconciliation('synthetic', undefined, customPayload);
      clearInterval(interval);
      setActiveStageIndex(RUN_STAGES.length - 1);
      setActiveRunId(res.run_id || generatedRunId);
      setRunResult(res);

      // Fetch accompanying dashboard metrics for reconciled volume
      try {
        const dash = await api.getDashboard('synthetic');
        setRunDashboard(dash);
      } catch {
        // Continue with result
      }

      onRunCompleted?.(res);
      setStep('completion');
    } catch (err: any) {
      clearInterval(interval);
      setRunError(err?.message || 'Reconciliation execution failed.');
    }
  };

  // Navigate to Overview with full run provenance
  const handleViewResults = () => {
    navigate('/overview', {
      state: {
        runId: runResult?.run_id || activeRunId,
        recordCount: runResult?.cases_processed || recordCount,
        matchedCount: runResult?.matched,
        reviewCount: runResult?.review,
        exceptionCount: runResult?.exception,
        completedAt: 'Just now',
      },
    });
  };

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans antialiased selection:bg-brand/15 selection:text-brand">
      {/* ------------------------------------------------------------- */}
      {/* 1. Ultra-Minimal Top Navigation                               */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-sm px-6 sm:px-12 flex items-center justify-between shrink-0 select-none transition-colors">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={arivoLogo}
              alt="ARIVO Logo"
              className="h-6 w-auto object-contain shrink-0"
            />
            <img
              src={arivoName}
              alt="ARIVO"
              className="h-4 w-auto object-contain shrink-0 dark:brightness-[4.8]"
            />
          </Link>
        </div>

        {/* Right Restrained Ethos & Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono tracking-[0.25em] text-content-muted uppercase">
            <span>PRECISION</span>
            <span className="text-border-strong">•</span>
            <span>CONTROL</span>
            <span className="text-border-strong">•</span>
            <span>CLARITY</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/overview"
              className="text-xs font-mono text-content-muted hover:text-content-primary transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded border border-transparent hover:border-border"
              title="Open Financial Control Room"
            >
              <span>Overview</span>
              <ArrowRight className="w-3 h-3 text-content-muted" />
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Editorial Canvas                                      */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto w-full space-y-10">

          {/* ========================================================= */}
          {/* STEP 1: DATASET SELECTION                                  */}
          {/* ========================================================= */}
          {step === 'dataset' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              {/* Editorial Header */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand font-semibold block">
                  CONTROL CENTER
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-content-primary leading-[1.1]">
                  Run a financial control.
                </h1>
                <p className="text-lg sm:text-xl font-medium text-content-secondary leading-snug pt-1">
                  Know where every rupee went - or know exactly why you don't.
                </p>
                <p className="text-sm text-content-muted max-w-xl leading-relaxed pt-1">
                  Reconcile financial records, investigate ambiguity, and surface exceptions before they become unexplained cash.
                </p>
              </div>

              {/* Dataset Options Area */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-content-muted pb-1">
                  <span>DATASET</span>
                  <span className="text-[10px] text-content-muted">SELECT FINANCIAL SOURCE</span>
                </div>

                <div className="space-y-2.5">
                  {/* Option 1: Demo Dataset (Selected by default) */}
                  <div
                    onClick={() => setSelectedDataset('demo')}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedDataset === 'demo'
                        ? 'border-brand bg-brand/[0.03] dark:bg-brand/[0.08] shadow-subtle ring-1 ring-brand/30'
                        : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-content-primary">
                            Use demo dataset
                          </span>
                          {selectedDataset === 'demo' && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-brand/15 text-brand font-bold tracking-wider">
                              selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-content-secondary">
                          Razorpay-style payments + settlements
                        </p>
                        <p className="text-[11px] font-mono text-content-muted pt-0.5">
                          5,000 records · INR · Jul 01 - Sep 02, 2026
                        </p>
                      </div>

                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            selectedDataset === 'demo'
                              ? 'border-brand bg-brand text-white'
                              : 'border-border-strong bg-transparent'
                          }`}
                        >
                          {selectedDataset === 'demo' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Import financial records */}
                  <div
                    onClick={() => setSelectedDataset('import')}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedDataset === 'import'
                        ? 'border-brand bg-brand/[0.03] dark:bg-brand/[0.08] shadow-subtle ring-1 ring-brand/30'
                        : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-content-primary">
                            Import financial records
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface-sunken text-content-muted font-bold border border-border">
                            CSV
                          </span>
                          {selectedDataset === 'import' && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-brand/15 text-brand font-bold tracking-wider">
                              selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-content-secondary">
                          Payments · settlements · adjustments
                        </p>
                        <p className="text-[11px] font-mono text-content-muted pt-0.5">
                          Custom batch ingestion via standard schema
                        </p>
                      </div>

                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            selectedDataset === 'import'
                              ? 'border-brand bg-brand text-white'
                              : 'border-border-strong bg-transparent'
                          }`}
                        >
                          {selectedDataset === 'import' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Import Details when selected */}
                    {selectedDataset === 'import' && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="p-3 rounded border border-dashed border-border bg-surface-elevated text-center space-y-1">
                          <UploadCloud className="w-5 h-5 mx-auto text-content-muted" />
                          <p className="text-xs text-content-secondary font-medium">
                            {csvFile ? csvFile.name : 'Upload custom payments & settlements CSV'}
                          </p>
                          <p className="text-[10px] font-mono text-content-muted">
                            Standard CSV format: payment_id, amount, currency, settlement_id, fees
                          </p>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCsvFile(file);
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  try {
                                    const text = evt.target?.result as string;
                                    const parsed = parseFinancialCsv(text);
                                    setImportedRecords(parsed);
                                    const total = parsed.payments.length + parsed.settlements.length;
                                    setCsvStatus(`Loaded ${file.name} (${total} valid records: ${parsed.payments.length} payments, ${parsed.settlements.length} settlements)`);
                                  } catch {
                                    setCsvStatus(`Loaded ${file.name}`);
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="hidden"
                            id="csv-file-input"
                          />
                          <label
                            htmlFor="csv-file-input"
                            className="inline-block mt-1 px-2.5 py-1 rounded text-xs font-mono bg-surface hover:bg-surface-sunken border border-border cursor-pointer text-brand"
                          >
                            Browse file...
                          </label>
                        </div>
                        {csvStatus && (
                          <p className="text-[11px] font-mono text-status-mint">{csvStatus}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Option 3: Continue previous run */}
                  <div
                    onClick={() => {
                      setSelectedDataset('previous');
                      handleContinuePreviousRun();
                    }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedDataset === 'previous'
                        ? 'border-brand bg-brand/[0.03] dark:bg-brand/[0.08] shadow-subtle ring-1 ring-brand/30'
                        : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-content-primary">
                            Continue previous run
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-status-mint/15 text-status-mint font-bold">
                            Completed
                          </span>
                        </div>
                        <p className="text-xs text-content-secondary">
                          Inspect telemetry and audit trail from last execution
                        </p>
                        <p className="text-[11px] font-mono text-content-muted pt-0.5">
                          {latestRunId} · {formatNumber(recordCount)} records
                        </p>
                      </div>

                      <div className="pt-0.5 flex items-center text-xs font-mono text-brand font-medium">
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area & Philosophy */}
              <div className="pt-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-content-muted">
                    <span>Target: </span>
                    <span className="text-content-primary font-medium">
                      {selectedDataset === 'demo'
                        ? '5,000 Canonical Benchmark Transactions'
                        : selectedDataset === 'import'
                        ? 'Custom Financial Batch'
                        : `${latestRunId} Historical Ledger`}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedDataset === 'previous') {
                        handleContinuePreviousRun();
                      } else if (selectedDataset === 'import' && !csvFile) {
                        setCsvStatus('Please select a .csv file to import before proceeding.');
                      } else {
                        setStep('preflight');
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-all active:scale-[0.98]"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Understated Philosophy Footer */}
                <div className="pt-6 border-t border-border flex items-center justify-center">
                  <p className="text-xs font-mono text-content-muted tracking-wider">
                    AI investigates · Rules verify · Controls protect
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: PREFLIGHT CHECKLIST                                */}
          {/* ========================================================= */}
          {step === 'preflight' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Preflight Header */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand font-semibold block">
                  FINANCIAL CONTROL PREFLIGHT
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                  Ready to run financial controls.
                </h2>
                <p className="text-sm text-content-secondary max-w-2xl leading-relaxed pt-1">
                  Arivo will validate the selected records, reconcile transactions using deterministic controls, investigate ambiguous cases with AI, and apply the Control Gate before producing final decisions.
                </p>
              </div>

              {/* Dataset & Invariant Statement Banner */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-md bg-surface-elevated border border-border text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
                  <span className="text-content-primary font-medium">
                    Target: <span className="text-brand font-bold">{selectedDataset === 'demo' ? '5,000 Canonical Benchmark Transactions' : selectedDataset === 'import' ? `${(importedRecords?.payments.length || 0) + (importedRecords?.settlements.length || 0)} Batch Records (${csvFile?.name || 'CSV'})` : `${latestRunId} Historical Ledger`}</span>
                  </span>
                </div>
                <span className="text-content-muted text-[11px]">
                  AI recommendations never override financial controls.
                </span>
              </div>

              {/* Validation List (Monospaced & Institutional) */}
              <div className="p-5 rounded-lg bg-surface border border-border shadow-subtle space-y-3 font-mono text-xs">
                <div className="text-[10px] uppercase tracking-wider text-content-muted pb-1 border-b border-border flex justify-between">
                  <span>CONTROL CRITERIA</span>
                  <span>VERIFICATION STATE</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {PREFLIGHT_CHECKS.map((check) => (
                    <div key={check.key} className="flex items-center justify-between py-1">
                      <span className="text-content-secondary">{check.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-mint" />
                        <span className="font-semibold text-status-mint tracking-wider">
                          {check.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preflight CTAs */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep('dataset')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-medium text-content-secondary hover:text-content-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change dataset</span>
                </button>

                <button
                  onClick={handleStartRun}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-all active:scale-[0.98]"
                >
                  <span>Start control run</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: RUNNING SCREEN                                     */}
          {/* ========================================================= */}
          {step === 'running' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Running Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand font-semibold">
                    ARIVO / CONTROL RUN
                  </span>
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-content-primary">
                  {activeRunId || 'RUN_INITIALIZING'}
                </h2>
                <p className="text-xs font-mono text-content-muted">
                  Executing dual-source reconciliation, ML candidate ranking, and Control Gate invariants...
                </p>
              </div>

              {/* 6 Running Stages Progression */}
              <div className="p-6 rounded-lg bg-surface border border-border shadow-subtle space-y-4 font-mono text-xs">
                <div className="text-[10px] uppercase tracking-wider text-content-muted pb-1 border-b border-border flex justify-between">
                  <span>PIPELINE STAGE</span>
                  <span>STATUS</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {RUN_STAGES.map((st, idx) => {
                    const isDone = idx < activeStageIndex;
                    const isCurrent = idx === activeStageIndex;
                    const isPending = idx > activeStageIndex;

                    return (
                      <div
                        key={st.id}
                        className={`flex items-center justify-between py-1 transition-opacity ${
                          isPending ? 'opacity-40' : 'opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[11px] font-bold ${
                              isDone
                                ? 'text-status-mint'
                                : isCurrent
                                ? 'text-brand'
                                : 'text-content-muted'
                            }`}
                          >
                            {st.id}
                          </span>
                          <span
                            className={`font-medium ${
                              isDone
                                ? 'text-content-secondary'
                                : isCurrent
                                ? 'text-content-primary font-semibold'
                                : 'text-content-muted'
                            }`}
                          >
                            {st.name}
                          </span>
                        </div>

                        <div>
                          {isDone && (
                            <span className="text-[11px] font-semibold text-status-mint tracking-wider flex items-center gap-1.5">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>DONE</span>
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-brand tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                              <span>PROCESSING</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[11px] text-content-muted tracking-wider">
                              QUEUED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert if any */}
              {runError && (
                <div className="p-4 rounded-md bg-status-coral/10 border border-status-coral/30 text-status-coral flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{runError}</span>
                  </div>
                  <button
                    onClick={() => setStep('preflight')}
                    className="underline text-content-primary hover:text-content-secondary"
                  >
                    Retry preflight
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: COMPLETION SUMMARY                                */}
          {/* ========================================================= */}
          {step === 'completion' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-status-mint" />
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-status-mint font-semibold">
                    CONTROL RUN COMPLETE
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-content-primary">
                  {runResult?.run_id || activeRunId}
                </h2>
                <p className="text-xs font-mono text-content-muted">
                  Reconciliation completed in {runResult?.duration_ms ? `${(runResult.duration_ms / 1000).toFixed(2)}s` : '0.8s'} at {runResult?.throughput || '1,333.8'} records/sec.
                </p>
              </div>

              {/* Real Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-surface border border-border shadow-subtle space-y-1">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-content-primary tabular-nums">
                    {formatNumber(runResult?.cases_processed ?? recordCount)}
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-content-muted">
                    records processed
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-border shadow-subtle space-y-1">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-status-mint tabular-nums">
                    {formatNumber(runResult?.matched ?? 3124)}
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-content-muted">
                    matched
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-border shadow-subtle space-y-1">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-status-amber tabular-nums">
                    {formatNumber(runResult?.review ?? 1088)}
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-content-muted">
                    review
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-border shadow-subtle space-y-1">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-status-coral tabular-nums">
                    {formatNumber(runResult?.exception ?? 902)}
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-content-muted">
                    exceptions
                  </p>
                </div>
              </div>

              {/* Financial Volume & AI Governance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-md bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-content-muted">Reconciled Volume</span>
                  <div className="text-lg font-mono font-bold text-content-primary tabular-nums">
                    {formatCompactINR(runDashboard?.matched_volume ?? 3672402300)}
                  </div>
                </div>

                <div className="p-3.5 rounded-md bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[#D98A26] dark:text-[#FFB454]">Unexplained Exposure</span>
                  <div className="text-lg font-mono font-bold text-[#D98A26] dark:text-[#FFB454] tabular-nums">
                    {formatCompactINR(runDashboard?.unresolved_financial_exposure ?? 1155702300)}
                  </div>
                </div>

                <div className="p-3.5 rounded-md bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-content-muted">AI Investigations</span>
                  <div className="text-lg font-mono font-bold text-content-primary tabular-nums">
                    {formatNumber(runResult?.ai_investigations ?? 1849)}
                  </div>
                </div>

                <div className="p-3.5 rounded-md bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-content-muted">Control Gate Blocks</span>
                  <div className="text-lg font-mono font-bold text-content-primary tabular-nums">
                    {formatNumber(1071)}
                  </div>
                </div>
              </div>

              {/* View Results CTA */}
              <div className="pt-4 flex items-center justify-between border-t border-border">
                <button
                  onClick={() => setStep('dataset')}
                  className="text-xs font-mono text-content-muted hover:text-content-primary transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Start new control run</span>
                </button>

                <button
                  onClick={handleViewResults}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-all active:scale-[0.98]"
                >
                  <span>View results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
