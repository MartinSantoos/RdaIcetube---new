import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Package, TrendingUp, Factory } from 'lucide-react';

interface ProductionData {
    size: string;
    quantity: number;
}

interface MonitoringData {
    totalSoldToday: number;
    productionData: ProductionData[];
}

interface ProductMonitoringProps {
    user: {
        id: number;
        name: string;
        user_type: number;
    };
    monitoring: MonitoringData;
}

export default function ProductMonitoring({ user, monitoring: initialMonitoring }: ProductMonitoringProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [monitoring, setMonitoring] = useState(initialMonitoring);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Auto-refresh data every 5 seconds
    useEffect(() => {
        const refreshData = async () => {
            try {
                setIsRefreshing(true);
                // Use Inertia to fetch fresh data
                router.reload({
                    only: ['monitoring'],
                    onSuccess: (page) => {
                        const newMonitoring = page.props.monitoring as MonitoringData;
                        setMonitoring(newMonitoring);
                        setLastUpdated(new Date());
                        setIsRefreshing(false);
                    },
                    onError: () => {
                        setIsRefreshing(false);
                    }
                });
            } catch (error) {
                console.error('Failed to refresh monitoring data:', error);
                setIsRefreshing(false);
            }
        };

        const interval = setInterval(refreshData, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-8">
            <Head title="Product Monitoring - RDA Tube Ice" />
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                    <h1 className="text-4xl font-bold text-white">RDA Tube Ice Production Monitoring</h1>
                    {isRefreshing && (
                        <div className="ml-4 flex items-center text-white/80">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            <span className="ml-2 text-sm">Updating...</span>
                        </div>
                    )}
                </div>
                <div className="text-white/80 text-lg">
                    <div>{formatDate(currentTime)}</div>
                    <div className="text-2xl font-mono mt-1">{formatTime(currentTime)}</div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Total Product Sold */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 mb-6">
                            <h2 className="text-2xl font-bold mb-2">Total Product Sold</h2>
                            <TrendingUp className="w-12 h-12 mx-auto text-white/80" />
                        </div>
                        
                        <div className="text-6xl font-bold text-green-500 mb-2">
                            {monitoring.totalSoldToday}
                        </div>
                        <p className="text-gray-600 text-lg">Products sold today</p>
                    </div>

                    {/* Production breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">Production by Size</h3>
                        {monitoring.productionData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                    <Package className="w-6 h-6 text-blue-600" />
                                    <span className="font-medium text-gray-800">{item.size}</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-white/60">
                <p>Real-time production monitoring system • Last updated: {formatTime(lastUpdated)} • Auto-refresh: 5s</p>
                <p className="text-sm mt-2">Current time: {formatTime(currentTime)}</p>
            </div>
        </div>
    );
}