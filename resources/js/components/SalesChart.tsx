import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface SalesChartProps {
    hourlySales: number[];
    totalSales: number;
}

const SalesChart: React.FC<SalesChartProps> = ({ hourlySales, totalSales }) => {
    const chartRef = useRef<ChartJS<'bar', number[], string>>(null);

    // Create hour labels (12 AM, 1 AM, 2 AM, etc.)
    const labels = Array.from({ length: 24 }, (_, i) => {
        const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour} ${period}`;
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Sales (₱)',
                data: hourlySales,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        return `Sales: ₱${context.parsed.y.toLocaleString()}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                    },
                    maxRotation: 45,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(107, 114, 128, 0.1)',
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                    },
                    callback: function(value) {
                        return '₱' + Number(value).toLocaleString();
                    },
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart',
        },
    };

    return (
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Today's Sales</h3>
                    <p className="text-xs md:text-sm text-gray-500">Daily Revenue Overview</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="bg-green-100 p-2 md:p-3 rounded-lg">
                        <svg className="w-6 md:w-8 h-6 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div className="mb-4">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    ₱{totalSales.toLocaleString()}
                </div>
                <p className="text-xs md:text-sm text-gray-500">total revenue today</p>
            </div>

            {totalSales > 0 ? (
                <div className="h-64 md:h-80">
                    <Bar ref={chartRef} data={data} options={options} />
                </div>
            ) : (
                <div className="h-64 md:h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm">No sales data available</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesChart;