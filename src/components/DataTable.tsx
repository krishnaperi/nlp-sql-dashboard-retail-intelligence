'use client';

import React, { useState } from 'react';
import { DashboardPanel } from '@/lib/types';

interface DataTableProps {
    result: DashboardPanel;
}

export default function DataTable({ result }: DataTableProps) {
    const { columns, rows } = result;
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 25;

    const handleSort = (colName: string) => {
        if (sortColumn === colName) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(colName);
            setSortDirection('asc');
        }
    };

    const sortedRows = [...rows].sort((a, b) => {
        if (!sortColumn) return 0;
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        return String(aVal).localeCompare(String(bVal)) * dir;
    });

    const pagedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const totalPages = Math.ceil(rows.length / pageSize);

    return (
        <div className="data-table-container">
            <div className="data-table-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" strokeWidth="2">
                    <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
                </svg>
                <span>Raw Data</span>
                <span className="data-table-count">{rows.length.toLocaleString()} rows × {columns.length} columns</span>
            </div>
            <div className="data-table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.name} onClick={() => handleSort(col.name)} className={sortColumn === col.name ? 'sorted' : ''}>
                                    <span>{col.name}</span>
                                    <span className="col-type">{col.type}</span>
                                    {sortColumn === col.name && (
                                        <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.map((row, ri) => (
                            <tr key={ri}>
                                {columns.map(col => (
                                    <td key={col.name} className={col.isNumeric ? 'numeric' : ''}>
                                        {formatCellValue(row[col.name])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="data-table-pagination">
                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
                    <span>{currentPage + 1} / {totalPages}</span>
                    <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
}

function formatCellValue(value: unknown): string {
    if (value == null) return '—';
    if (typeof value === 'number') {
        if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
        if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1) + 'K';
        return value.toLocaleString();
    }
    return String(value);
}
