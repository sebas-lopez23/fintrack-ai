import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export type TimeRangeType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface DateRange {
    start: Date;
    end: Date;
    label: string;
}

interface Props {
    onChange: (range: DateRange) => void;
    initialRange?: TimeRangeType;
}

export default function TimeRangeSelector({ onChange, initialRange = 'month' }: Props) {
    const [viewType, setViewType] = useState<TimeRangeType>(initialRange);
    const [anchorDate, setAnchorDate] = useState(new Date());

    // Custom range state
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    // We remove the useEffect dependency on anchorDate/viewType to avoid circular updates or lag
    // Instead, we trigger updates explicitly on user interaction

    useEffect(() => {
        // Initial load
        emitRangeChange(anchorDate, viewType);
    }, []);

    const emitRangeChange = (date: Date, type: TimeRangeType) => {
        if (type === 'custom') return;

        const start = new Date(date);
        const end = new Date(date);
        let label = '';

        switch (type) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                label = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
                break;

            case 'week':
                const day = start.getDay();
                // Monday as start (1)
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);

                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);

                const sStr = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                const eStr = end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                label = `${sStr} - ${eStr}`;
                break;

            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(start.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);

                label = start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
                label = label.charAt(0).toUpperCase() + label.slice(1);
                break;

            case 'year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                label = start.getFullYear().toString();
                break;
        }

        onChange({ start, end, label });
    };

    const handlePrev = () => {
        const newDate = new Date(anchorDate);
        switch (viewType) {
            case 'day': newDate.setDate(newDate.getDate() - 1); break;
            case 'week': newDate.setDate(newDate.getDate() - 7); break;
            case 'month': newDate.setMonth(newDate.getMonth() - 1); break;
            case 'year': newDate.setFullYear(newDate.getFullYear() - 1); break;
        }
        setAnchorDate(newDate);
        emitRangeChange(newDate, viewType);
    };

    const handleNext = () => {
        const newDate = new Date(anchorDate);
        switch (viewType) {
            case 'day': newDate.setDate(newDate.getDate() + 1); break;
            case 'week': newDate.setDate(newDate.getDate() + 7); break;
            case 'month': newDate.setMonth(newDate.getMonth() + 1); break;
            case 'year': newDate.setFullYear(newDate.getFullYear() + 1); break;
        }
        setAnchorDate(newDate);
        emitRangeChange(newDate, viewType);
    };

    const handleTypeChange = (type: TimeRangeType) => {
        if (type === 'custom') {
            setShowCustomPicker(!showCustomPicker);
        } else {
            // Reset anchor to today when switching types? Optional, but often better UX to stick to current anchor
            // Let's keep anchorDate but recalculate range
            setViewType(type);
            emitRangeChange(anchorDate, type);
        }
    };

    const getLabel = () => {
        if (viewType === 'custom') return 'Personalizado';

        const d = anchorDate;
        if (viewType === 'day') return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
        if (viewType === 'week') {
            // Calculate week range for label
            const start = new Date(d);
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.getDate()} ${start.toLocaleDateString('es-CO', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es-CO', { month: 'short' })}`;
        }
        if (viewType === 'month') {
            const l = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            return l.charAt(0).toUpperCase() + l.slice(1);
        }
        if (viewType === 'year') return d.getFullYear().toString();
        return '';
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            const start = new Date(customStart);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
            onChange({ start, end, label: 'Custom' });
            setShowCustomPicker(false);
        }
    };

    return (
        <div className="selector-wrapper">
            {/* Top Tabs */}
            <div className="tabs-container">
                {(['day', 'week', 'month', 'year', 'custom'] as const).map(type => (
                    <button
                        key={type}
                        className={`tab-btn ${viewType === type ? 'active' : ''}`}
                        onClick={() => handleTypeChange(type)}
                    >
                        {type === 'day' ? 'Día' :
                            type === 'week' ? 'Semana' :
                                type === 'month' ? 'Mes' :
                                    type === 'year' ? 'Año' : 'Rango'}
                    </button>
                ))}
            </div>

            {/* Navigation / Control Bar */}
            {viewType !== 'custom' ? (
                <div className="nav-bar">
                    <button className="nav-btn" onClick={handlePrev}>
                        <ChevronLeft size={24} />
                    </button>

                    <span className="current-label">
                        {getLabel()}
                    </span>

                    <button className="nav-btn" onClick={handleNext}>
                        <ChevronRight size={24} />
                    </button>
                </div>
            ) : (
                <div className="custom-bar">
                    <div className="date-inputs">
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                        <span>-</span>
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                    <button onClick={handleCustomApply} className="check-btn">Filtrar</button>
                </div>
            )}

            <style jsx>{`
                .selector-wrapper {
                    background: transparent;
                    margin-bottom: 20px;
                }

                /* Tabs */
                .tabs-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    padding: 0 10px;
                }
                .tab-btn {
                    background: none;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    color: #8E8E93;
                    padding: 6px 0;
                    cursor: pointer;
                    position: relative;
                }
                .tab-btn.active {
                    color: #000; // Or Primary Color if dark mode
                    font-weight: 600;
                }
                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #007AFF; // Primary
                    border-radius: 2px;
                }

                /* Navigation Bar */
                .nav-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 10px;
                }
                .current-label {
                    font-size: 16px;
                    font-weight: 600;
                    text-decoration: underline; 
                    text-decoration-color: #ddd;
                    min-width: 150px;
                    text-align: center;
                }

                .nav-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #8E8E93;
                    padding: 8px;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                }
                .nav-btn:hover {
                    color: #000;
                }

                /* Custom Inputs */
                .custom-bar {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                }
                .date-inputs input {
                    padding: 8px; border: 1px solid #eee; border-radius: 8px;
                }
                .check-btn {
                    padding: 8px 16px; background: #007AFF; color: white; border-radius: 8px; border: none; font-weight: 600;
                }
            `}</style>
        </div>
    );
}
