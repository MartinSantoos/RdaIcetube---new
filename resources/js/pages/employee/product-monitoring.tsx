import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Package, TrendingUp, Factory, Clock, Truck, ArrowLeft, Eye, CheckCircle, User} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface PendingOrder {
    order_id: number;
    customer_name: string;
    contact_number: string;
    size: string;
    quantity: number;
    total: number;
    created_at: string;
    address: string;
    delivery_rider_id: number | null;
    completed_by: number | null;
    status: string;
    deliveryRider?: {
        id: number;
        name: string;
    };
    completedBy?: {
        id: number;
        name: string;
    };
}

interface StatsData {
    total_pending: number;
    total_quantity: number;
    total_value: number;
    today_orders: number;
}

interface ProductMonitoringProps {
    user: {
        id: number;
        name: string;
        user_type: number;
    };
    pendingOrders: PendingOrder[];
    stats: StatsData;
}

export default function EmployeeProductMonitoring({ user, pendingOrders: initialOrders, stats: initialStats }: ProductMonitoringProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [pendingOrders, setPendingOrders] = useState(initialOrders);
    const [stats, setStats] = useState(initialStats);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [isCompletingOrder, setIsCompletingOrder] = useState(false);

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
                router.reload({
                    only: ['pendingOrders', 'stats'],
                    onSuccess: (page) => {
                        const newOrders = page.props.pendingOrders as PendingOrder[];
                        const newStats = page.props.stats as StatsData;
                        setPendingOrders(newOrders);
                        setStats(newStats);
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

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleOrderClick = (order: PendingOrder) => {
        setSelectedOrder(order);
        setShowOrderDialog(true);
    };

    const handleCompleteOrder = async () => {
        if (!selectedOrder) return;
        
        setIsCompletingOrder(true);
        
        try {
            await router.patch(`/employee/orders/${selectedOrder.order_id}/complete`, {
                status: 'completed'
            }, {
                onSuccess: () => {
                    setShowOrderDialog(false);
                    setSelectedOrder(null);
                    setIsCompletingOrder(false);
                    // Refresh data after completing order
                    router.reload({ only: ['pendingOrders', 'stats'] });
                },
                onError: (errors) => {
                    console.error('Failed to complete order:', errors);
                    setIsCompletingOrder(false);
                }
            });
        } catch (error) {
            console.error('Error completing order:', error);
            setIsCompletingOrder(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-8">
            <Head title="Product Monitoring - RDA Tube Ice" />
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                    <Link 
                        href="/employee/orders"
                        className="absolute left-8 top-8 flex items-center text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 mr-2" />
                        Back to Orders
                    </Link>
                    <h1 className="text-5xl font-bold text-white">RDA Tube Ice - Pickup Monitoring</h1>
                </div>
                <div className="text-white/80 text-xl">
                    <div className="text-lg">{formatDate(currentTime)}</div>
                    <div className="text-3xl font-mono mt-2">{formatTime(currentTime)}</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pickup Statistics */}
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 mb-6">
                                <h2 className="text-3xl font-bold mb-2">Pickup Orders</h2>
                                <Package className="w-16 h-16 mx-auto text-white/80" />
                            </div>
                            
                            <div className="text-7xl font-bold text-green-500 mb-2">
                                {stats.total_pending}
                            </div>
                            <p className="text-gray-600 text-xl">Orders ready for pickup</p>
                        </div>

                        {/* Statistics breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Today's Statistics</h3>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-5">
                                <div className="flex items-center space-x-4">
                                    <TrendingUp className="w-8 h-8 text-blue-600" />
                                    <span className="font-semibold text-gray-800 text-lg">New Orders Today</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {stats.today_orders}
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-5">
                                <div className="flex items-center space-x-4">
                                    <Package className="w-8 h-8 text-purple-600" />
                                    <span className="font-semibold text-gray-800 text-lg">Total Quantity</span>
                                </div>
                                <div className="text-3xl font-bold text-purple-600">
                                    {stats.total_quantity}
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-5">
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 flex items-center justify-center text-green-600 font-bold text-xl">₱</div>
                                    <span className="font-semibold text-gray-800 text-lg">Total Value</span>
                                </div>
                                <div className="text-3xl font-bold text-green-600">
                                    ₱{stats.total_value.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Orders List */}
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 mb-6">
                                <h2 className="text-3xl font-bold mb-2">Pickup Queue</h2>
                                <Factory className="w-16 h-16 mx-auto text-white/80" />
                            </div>
                            
                            <div className="text-7xl font-bold text-blue-500 mb-2">
                                {pendingOrders.filter(order => order.status === 'pending').length}
                            </div>
                            <p className="text-gray-600 text-xl">Orders in queue</p>
                        </div>

                        {/* Orders list */}
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Pickup Orders</h3>
                            {pendingOrders.length > 0 ? (
                                pendingOrders.map((order, index) => (
                                    <div key={order.order_id} 
                                         className={`rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer ${
                                             order.status === 'completed' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                         }`}
                                         onClick={() => handleOrderClick(order)}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                {order.status === 'completed' ? (
                                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                                ) : (
                                                    <User className="w-8 h-8 text-blue-600" />
                                                )}
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold text-lg text-gray-800">#{order.order_id}</span>
                                                        {order.status === 'completed' && (
                                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Completed</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                                                    {order.status === 'completed' && order.completedBy && (
                                                        <p className="text-xs text-green-600">By: {order.completedBy.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-lg font-bold ${order.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    ₱{order.total.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-gray-600">{order.quantity} {order.size}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Ordered: {formatDateTime(order.created_at)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg">No pending pickup orders</p>
                                    <p className="text-sm">Orders will appear here when customers place pickup orders</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Details Dialog */}
            <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.status === 'completed' ? 'View completed pickup order' : 'Complete this pickup order'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Order ID</label>
                                <p className="text-lg font-bold text-blue-600">#{selectedOrder.order_id}</p>
                            </div>
                            {selectedOrder.status === 'completed' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <p className="text-lg font-bold text-green-600 flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Completed
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Customer</label>
                                <p className="text-gray-900">{selectedOrder.customer_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Contact</label>
                                <p className="text-gray-900">{selectedOrder.contact_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Product</label>
                                <p className="text-gray-900">{selectedOrder.quantity} {selectedOrder.size}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Total Amount</label>
                                <p className="text-lg font-bold text-green-600">₱{selectedOrder.total.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Order Date</label>
                                <p className="text-gray-900">{formatDateTime(selectedOrder.created_at)}</p>
                            </div>
                            {selectedOrder.status === 'completed' && selectedOrder.completedBy && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Completed By</label>
                                    <p className="text-gray-900 font-medium">{selectedOrder.completedBy.name}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowOrderDialog(false)}
                            disabled={isCompletingOrder}
                        >
                            {selectedOrder?.status === 'completed' ? 'Close' : 'Cancel'}
                        </Button>
                        {selectedOrder?.status !== 'completed' && (
                            <Button 
                                onClick={handleCompleteOrder}
                                disabled={isCompletingOrder}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {isCompletingOrder ? 'Completing...' : 'Complete Order'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <div className="text-center mt-8 text-white/60">
                <p className="text-lg">Real-time pickup monitoring system • Last updated: {formatTime(lastUpdated)}</p>
                <p className="text-base mt-2">Current time: {formatTime(currentTime)}</p>
            </div>
        </div>
    );
}