'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

interface PillarData {
    name: string;
    target: number; // The budget amount
    actual: number; // The actual spend
    color: string;
    percentUsed: number;
}

interface PillarAnalysisProps {
    data: PillarData[];
}

export default function PillarAnalysis({ data }: PillarAnalysisProps) {
    if (!data || data.length === 0) return <div>No data available</div>;

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const diff = d.target - d.actual;
            const isOver = diff < 0;

            return (
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #F2F2F7' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#1C1C1E' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#8E8E93' }}>
                        Meta: <span style={{ fontWeight: 600, color: '#1C1C1E' }}>{formatMoney(d.target)}</span>
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#8E8E93' }}>
                        Real: <span style={{ fontWeight: 600, color: d.color }}>{formatMoney(d.actual)}</span>
                    </p>
                    <div style={{ height: '1px', background: '#E5E5EA', margin: '8px 0' }} />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: isOver ? '#FF3B30' : '#34C759' }}>
                        {isOver ? `Te pasaste por ${formatMoney(Math.abs(diff))}` : `Disponible: ${formatMoney(diff)}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1C1C1E' }}>
                Cumplimiento de Estrategia
            </h3>

            <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={20} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#8E8E93', fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            hide
                        />
                        <Tooltip cursor={{ fill: '#F2F2F7', radius: 10 }} content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#E5E5EA" />

                        {/* Budget Bar (Background Ghost) */}
                        <Bar dataKey="target" stackId="a" fill="#F2F2F7" radius={[6, 6, 6, 6]} />

                        {/* Actual Bar (Foreground) - We use a trick to render comparison. 
                            Actually simple side-by-side or stacked is tricky. 
                            Let's use a simpler visual: Progress bars per item below the chart, 
                            and the chart shows Spend vs Limit visually 
                        */}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed Row View */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.map((item) => {
                    const isOver = item.actual > item.target;
                    const pct = item.target > 0 ? (item.actual / item.target) * 100 : 0;

                    return (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: item.color }}>
                                {item.name[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1E' }}>{item.name}</span>
                                    <span style={{ fontSize: '13px', color: '#8E8E93' }}>
                                        {formatMoney(item.actual)} / {formatMoney(item.target)}
                                    </span>
                                </div>
                                <div style={{ height: '8px', background: '#F2F2F7', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min(100, pct)}%`,
                                        height: '100%',
                                        background: isOver ? '#FF3B30' : item.color,
                                        borderRadius: '4px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                            <div style={{ minWidth: '45px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: isOver ? '#FF3B30' : item.color }}>
                                {pct.toFixed(0)}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
