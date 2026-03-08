'use client';

import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';

interface SQLPreviewProps {
    sql: string;
    explanation: string;
    executionTime: number;
    rowCount: number;
}

export default function SQLPreview({ sql, explanation, executionTime, rowCount }: SQLPreviewProps) {
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [sql]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sql);
    };

    return (
        <div className="sql-preview">
            <div className="sql-header">
                <div className="sql-header-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" strokeWidth="2">
                        <path d="M16 18l2-2-2-2M8 18l-2-2 2-2M12 2v20" />
                    </svg>
                    <span className="sql-label">Generated SQL</span>
                </div>
                <div className="sql-header-right">
                    <span className="sql-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                        {executionTime}ms
                    </span>
                    <span className="sql-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
                        </svg>
                        {rowCount.toLocaleString()} rows
                    </span>
                    <button className="sql-copy-btn" onClick={copyToClipboard} title="Copy SQL">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                    </button>
                </div>
            </div>
            <p className="sql-explanation">{explanation}</p>
            <pre className="sql-code">
                <code ref={codeRef} className="language-sql">{sql}</code>
            </pre>
        </div>
    );
}
