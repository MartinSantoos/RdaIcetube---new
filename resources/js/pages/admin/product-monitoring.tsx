import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Package, TrendingUp, Factory, Clock, Truck } from 'lucide-react';

interface ProductionData {
    size: string;
    quantity: number;
}

interface OrderInfo {
    order_id: number;
    delivery_mode: string;
    delivery_rider: string | null;
}

interface OrderQueueData {
    totalQueue: number;
    pending: number;
    onDelivery: number;
    pendingOrderInfo: OrderInfo[];
    onDeliveryOrderInfo: OrderInfo[];
}

interface MonitoringData {
    totalSoldToday: number;
    productionData: ProductionData[];
    orderQueue: OrderQueueData;
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
                    <h1 className="text-5xl font-bold text-white">RDA Tube Ice Production Monitoring</h1>
                    {isRefreshing && (
                        <div className="ml-4 flex items-center text-white/80">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}
                </div>
                <div className="text-white/80 text-xl">
                    <div className="text-lg">{formatDate(currentTime)}</div>
                    <div className="text-3xl font-mono mt-2">{formatTime(currentTime)}</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Total Product Sold */}
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 mb-6">
                                <h2 className="text-3xl font-bold mb-2">Total Product Sold</h2>
                                <TrendingUp className="w-16 h-16 mx-auto text-white/80" />
                            </div>
                            
                            <div className="text-7xl font-bold text-green-500 mb-2">
                                {monitoring.totalSoldToday}
                            </div>
                            <p className="text-gray-600 text-xl">Products sold today</p>
                        </div>

                        {/* Production breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Products sold by Size</h3>
                            {monitoring.productionData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-5">
                                    <div className="flex items-center space-x-4">
                                        <Package className="w-8 h-8 text-blue-600" />
                                        <span className="font-semibold text-gray-800 text-lg">{item.size}</span>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Queue */}
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 mb-6">
                                <h2 className="text-3xl font-bold mb-2">Order Queue</h2>
                                <Factory className="w-16 h-16 mx-auto text-white/80" />
                            </div>
                            
                            <div className="text-7xl font-bold text-blue-500 mb-2">
                                {monitoring.orderQueue.totalQueue}
                            </div>
                            <p className="text-gray-600 text-xl">Orders in queue</p>
                        </div>

                        {/* Queue breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Queue Status</h3>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-8 h-8 text-yellow-600" />
                                        <span className="font-semibold text-gray-800 text-lg">Pending Orders</span>
                                    </div>
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {monitoring.orderQueue.pending}
                                    </div>
                                </div>
                                {monitoring.orderQueue.pendingOrderInfo && monitoring.orderQueue.pendingOrderInfo.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-base text-gray-700 mb-2 font-medium">Order Details:</p>
                                        <div className="space-y-2">
                                            {monitoring.orderQueue.pendingOrderInfo.map((order, index) => (
                                                <div key={order.order_id} className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                                                    <span className="font-bold text-base">#{order.order_id}</span>
                                                    <span className="ml-3 text-sm">
                                                        {order.delivery_mode === 'deliver' 
                                                            ? `Delivery - ${order.delivery_rider || 'No rider assigned'}`
                                                            : 'Pick up'
                                                        }
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <Truck className="w-8 h-8 text-orange-600" />
                                        <span className="font-semibold text-gray-800 text-lg">On Delivery</span>
                                    </div>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {monitoring.orderQueue.onDelivery}
                                    </div>
                                </div>
                                {monitoring.orderQueue.onDeliveryOrderInfo && monitoring.orderQueue.onDeliveryOrderInfo.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-base text-gray-700 mb-2 font-medium">Order Details:</p>
                                        <div className="space-y-2">
                                            {monitoring.orderQueue.onDeliveryOrderInfo.map((order, index) => (
                                                <div key={order.order_id} className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-sm">
                                                    <span className="font-bold text-base">#{order.order_id}</span>
                                                    <span className="ml-3 text-sm">
                                                        {order.delivery_mode === 'deliver' 
                                                            ? `Delivery - ${order.delivery_rider || 'No rider assigned'}`
                                                            : 'Pick up'
                                                        }
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-white/60">
                <p className="text-lg">Real-time production monitoring system • Last updated: {formatTime(lastUpdated)}</p>
                <p className="text-base mt-2">Current time: {formatTime(currentTime)}</p>
            </div>
        </div>
    );
}