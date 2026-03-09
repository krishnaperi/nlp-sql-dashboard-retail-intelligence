'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptBarProps {
    onSubmit: (question: string) => void;
    isLoading: boolean;
}

const EXAMPLE_QUESTIONS = [
    '🛍️ Show top 10 keywords by search volume',
    '📈 Which sites have the most traffic for "laptop"?',
    '📱 Show total search volume by site over time',
    '📊 Compare unique users and total visits by country',
    '💰 What are the trending keywords on amazon.com?',
    '📉 Show the daily search volume for "ps5"',
];

export default function PromptBar({ onSubmit, isLoading }: PromptBarProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleExampleClick = (question: string) => {
        // Remove emoji prefix
        const cleanQuestion = question.replace(/^[^\w]*\s/, '');
        onSubmit(cleanQuestion);
    };

    return (
        <div className="prompt-container">
            <form onSubmit={handleSubmit} className="prompt-form">
                <div className="prompt-input-wrapper">
                    <div className="prompt-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about product demand and retail data..."
                        className="prompt-textarea"
                        rows={1}
                        disabled={isLoading}
                    />
                    <motion.button
                        type="submit"
                        className="prompt-send-btn"
                        disabled={!input.trim() || isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLoading ? (
                            <div className="loading-dots">
                                <span /><span /><span />
                            </div>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        )}
                    </motion.button>
                </div>
            </form>

            <AnimatePresence>
                {!isLoading && (
                    <motion.div
                        className="example-chips"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {EXAMPLE_QUESTIONS.map((q, i) => (
                            <motion.button
                                key={i}
                                className="example-chip"
                                onClick={() => handleExampleClick(q)}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                {q}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
