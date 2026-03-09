'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptBar from '@/components/PromptBar';
import ChartRenderer from '@/components/ChartRenderer';
import SQLPreview from '@/components/SQLPreview';
import DataTable from '@/components/DataTable';
import QueryHistory from '@/components/QueryHistory';
import { QueryResult, HistoryEntry } from '@/lib/types';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const handleQuery = useCallback(async (question: string, isAppend: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Query failed');
      }

      const result: QueryResult = await res.json();

      let finalResult = result;
      setCurrentResult(prev => {
        if (isAppend && prev) {
          finalResult = {
            ...result,
            panels: [...prev.panels, ...result.panels],
            totalExecutionTime: prev.totalExecutionTime + result.totalExecutionTime
          };
          return finalResult;
        }
        return result;
      });

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        question,
        panelsCount: finalResult.panels.length,
        timestamp: Date.now(),
        result: finalResult,
      };

      setHistory(prev => [entry, ...prev]);
      setActiveHistoryId(entry.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    if (entry.result) {
      setCurrentResult(entry.result);
      setActiveHistoryId(entry.id);
      setError(null);
    }
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#logoGrad)" opacity="0.9" />
                <path d="M2 17l10 5 10-5" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
                <path d="M2 12l10 5 10-5" stroke="url(#logoGrad)" strokeWidth="2" fill="none" opacity="0.6" />
                <defs>
                  <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22">
                    <stop offset="0%" stopColor="#29b6f6" />
                    <stop offset="100%" stopColor="#ab47bc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="logo-text">
              <h1>SnowQuery</h1>
              <span>Retail Intelligence</span>
            </div>
          </div>
        </div>
        <div className="sidebar-section-title">Query History</div>
        <QueryHistory
          history={history}
          onSelect={handleHistorySelect}
          activeId={activeHistoryId}
        />
        <div className="sidebar-footer">
          <div className="sidebar-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Powered by Snowflake Cortex
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero area when no results */}
        <AnimatePresence mode="wait">
          {!currentResult && !isLoading && !error && (
            <motion.div
              className="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="hero-glow" />
              <h2 className="hero-title">
                Ask anything about
                <span className="hero-highlight"> Product Demand</span>
              </h2>
              <p className="hero-subtitle">
                Natural language → Snowflake SQL → Interactive visualizations
              </p>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-value">5M+</span>
                  <span className="hero-stat-label">Products</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">Top 100</span>
                  <span className="hero-stat-label">Retailers</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">2020–24</span>
                  <span className="hero-stat-label">Date Range</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results area */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              className="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-spinner" />
              <p className="loading-text">Analyzing your question...</p>
              <div className="loading-steps">
                <div className="loading-step active">
                  <span className="loading-step-dot" />
                  Converting to SQL
                </div>
                <div className="loading-step">
                  <span className="loading-step-dot" />
                  Querying Snowflake
                </div>
                <div className="loading-step">
                  <span className="loading-step-dot" />
                  Building Visualization
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="error-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <p>{error}</p>
              <button className="error-retry" onClick={() => setError(null)}>Dismiss</button>
            </motion.div>
          )}

          {currentResult && !isLoading && (
            <motion.div
              className="results-area"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="dashboard-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {currentResult.panels.map((panel, idx) => (
                  <div key={panel.id} className={`dashboard-panel ${idx === 0 ? 'primary-panel' : 'secondary-panel'}`}>
                    <div className="result-card">
                      <ChartRenderer result={panel} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                      <div className="result-card sql-card" style={{ overflow: 'hidden' }}>
                        <SQLPreview
                          sql={panel.sql}
                          explanation={panel.explanation}
                          executionTime={panel.executionTime}
                          rowCount={panel.rowCount}
                        />
                      </div>

                      <div className="result-card data-card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <DataTable result={panel} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggested Follow-ups */}
              {currentResult.suggestedFollowUps?.length > 0 && (
                <div className="suggested-followups" style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid rgba(41, 182, 246, 0.2)' }}>
                  <h3 style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Deep Dive Suggested Follow-ups
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {currentResult.suggestedFollowUps.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuery(suggestion, true)}
                        className="followup-btn"
                        style={{ background: 'rgba(41, 182, 246, 0.1)', color: '#29b6f6', padding: '0.875rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(41, 182, 246, 0.3)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem', fontWeight: 500 }}
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt Bar — always at bottom */}
        <div className="prompt-area">
          <PromptBar onSubmit={handleQuery} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
