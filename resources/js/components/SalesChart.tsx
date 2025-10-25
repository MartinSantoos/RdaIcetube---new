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
    period?: 'today' | 'week' | 'month' | 'year';
}

const SalesChart: React.FC<SalesChartProps> = ({ hourlySales, totalSales, period = 'today' }) => {
    const chartRef = useRef<ChartJS<'bar', number[], string>>(null);

    // Create appropriate labels based on period
    const getLabels = () => {
        switch (period) {
            case 'today':
                // Hourly labels (12 AM, 1 AM, 2 AM, etc.)
                return Array.from({ length: 24 }, (_, i) => {
                    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                    const period = i < 12 ? 'AM' : 'PM';
                    return `${hour} ${period}`;
                });
            case 'week':
                // Daily labels (Mon, Tue, Wed, etc.)
                return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            case 'month':
                // Daily labels (1, 2, 3, etc.)
                const daysInMonth = new Date().getDate(); // Current day of month for now
                const actualDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                return Array.from({ length: actualDaysInMonth }, (_, i) => `${i + 1}`);
            case 'year':
                // Monthly labels (Jan, Feb, Mar, etc.)
                return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            default:
                return [];
        }
    };

    const labels = getLabels();

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
        <>
            <div className="mb-4">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    ₱{totalSales.toLocaleString()}
                </div>
                <p className="text-xs md:text-sm text-gray-500">total revenue</p>
            </div>

            {totalSales > 0 ? (
                <div className="h-64 md:h-80">
                    <Bar ref={chartRef} data={data} options={options} />
                </div>
            ) : (
                <div className="h-64 md:h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <p className="text-sm">No sales data available</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default SalesChart;