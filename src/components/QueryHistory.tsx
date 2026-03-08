'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HistoryEntry } from '@/lib/types';

interface QueryHistoryProps {
    history: HistoryEntry[];
    onSelect: (entry: HistoryEntry) => void;
    activeId: string | null;
}

// Icon logic replaced by dashboard icon

export default function QueryHistory({ history, onSelect, activeId }: QueryHistoryProps) {
    if (history.length === 0) {
        return (
            <div className="history-empty">
                <div className="history-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                </div>
                <p>No queries yet</p>
                <p className="history-empty-sub">Ask a question to get started</p>
            </div>
        );
    }

    return (
        <div className="history-list">
            {history.map((entry, i) => (
                <motion.button
                    key={entry.id}
                    className={`history-item ${activeId === entry.id ? 'active' : ''}`}
                    onClick={() => onSelect(entry)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                >
                    <span className="history-icon">{entry.panelsCount > 1 ? '🗂️' : '📊'}</span>
                    <div className="history-content">
                        <span className="history-question">{entry.question}</span>
                        <span className="history-time">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
