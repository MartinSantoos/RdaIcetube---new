import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, Package, Cog, Settings, ShoppingCart, Users, LogOut, Search, Download, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import DateFilterModal from '@/components/DateFilterModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface User {
    id: number;
    name: string;
    username: string;
    user_type: number;
}

interface Order {
    order_id: number;
    customer_name: string;
    address: string;
    contact_number: string;
    status: string;
    order_date: string;
    quantity: number;
    size: string;
    delivery_mode: string;
    delivery_date: string;
    price: number;
    total: number;
}

interface SalesReportProps {
    user: User;
    orders: Order[];
}

export default function SalesReport({ user, orders }: SalesReportProps) {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const isMobile = useIsMobile();
    
    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        router.post('/logout');
    };

    const cancelLogout = () => {
        setIsLogoutModalOpen(false);
    };

    const handleExport = (startDate: string, endDate: string, format: 'pdf' | 'csv') => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            format: format
        });
        
        // Open export URL in new tab
        window.open(`/admin/sales-report/export?${params.toString()}`, '_blank');
    };

    // Calculate sales metrics
    const salesMetrics = useMemo(() => {
        const completedOrders = orders.filter(order => order.status === 'completed');
        
        // Total revenue from completed orders - ensure we handle null/undefined values
        const totalRevenue = completedOrders.reduce((sum, order) => {
            const orderTotal = order.total ? Number(order.total) : 0;
            return sum + (isNaN(orderTotal) ? 0 : orderTotal);
        }, 0);
        
        // Calculate average sale per day (based on unique dates)
        const uniqueDates = [...new Set(completedOrders.map(order => order.order_date.split('T')[0]))];
        const averageSalePerDay = uniqueDates.length > 0 ? totalRevenue / uniqueDates.length : 0;

        // Monthly sales data for chart (last 12 months)
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (11 - i));
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
            
            const monthOrders = completedOrders.filter(order => 
                order.order_date.slice(0, 7) === monthKey
            );
            
            return {
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                sales: monthOrders.reduce((sum, order) => {
                    const orderTotal = order.total ? Number(order.total) : 0;
                    return sum + (isNaN(orderTotal) ? 0 : orderTotal);
                }, 0),
                transactions: monthOrders.length
            };
        });

        // Product sales ranking
        const productSales = completedOrders.reduce((acc, order) => {
            const productKey = `Ice Tube ${order.size.charAt(0).toUpperCase()}`;
            const orderTotal = order.total ? Number(order.total) : 0;
            const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
            acc[productKey] = (acc[productKey] || 0) + validTotal;
            return acc;
        }, {} as Record<string, number>);

        const sortedProducts = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .map(([product, sales]) => ({ product, sales }));

        return {
            totalRevenue,
            averageSalePerDay,
            monthlyData,
            productSales: sortedProducts
        };
    }, [orders]);

    // Chart data for monthly sales
    const chartData = {
        labels: salesMetrics.monthlyData.map(data => data.month),
        datasets: [
            {
                label: 'Sales',
                data: salesMetrics.monthlyData.map(data => data.sales),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    callback: function(value: any) {
                        return '₱' + value.toLocaleString();
                    },
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="min-h-screen bg-gray-50" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <Head title="Sales Report - RDA Tube Ice" />
            
             {/* Header */}
            <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
                <div className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div className="flex items-center space-x-4">
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        )}
                        <h1 className="text-lg md:text-xl font-bold">RDA Tube Ice</h1>
                        <div className="hidden md:block h-6 w-px bg-blue-400"></div>
                        <div className="hidden md:flex items-center space-x-2">
                             <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {user.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{user.name || 'Admin'}</div>
                                <div className="text-xs text-blue-200">{user.username || 'admin'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {isMobile && (
                            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {user.name?.charAt(0) || 'A'}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex relative" style={{ display: 'flex', position: 'relative' }}>
                {/* Mobile Sidebar Overlay */}
                {isMobile && sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40 }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                {/* Sidebar */}
                <aside className={`
                    ${isMobile 
                        ? `fixed top-0 left-0 z-50 w-64 h-full bg-blue-600 transform transition-transform duration-300 ease-in-out ${
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }` 
                        : 'fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-blue-600 overflow-y-auto'
                    } text-white
                `}>
                    <div className="p-6">
                        {isMobile && (
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">Menu</h2>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        
                        <div className="mb-8">
                            {!isMobile && <h2 className="text-lg font-semibold mb-4">Menu</h2>}
                            <nav className="space-y-2">
                                <Link 
                                    href="/admin/dashboard" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link 
                                    href="/admin/point-of-sales" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>Order</span>
                                </Link>
                                <Link 
                                    href="/admin/inventory" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Inventory</span>
                                </Link>
                                <Link 
                                    href="/admin/employees" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Users className="w-5 h-5" />
                                    <span>Employees</span>
                                </Link>
                                <Link 
                                    href="/admin/equipment" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Cog className="w-5 h-5" />
                                    <span>Equipment</span>
                                </Link>
                                <Link 
                                    href="/admin/sales-report" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Sales Report</span>
                                </Link>
                            </nav>
                        </div>

                        <div className="border-t border-blue-500 pt-6">
                            <h3 className="text-sm font-semibold mb-4">Settings</h3>
                            <nav className="space-y-2">
                                <Link 
                                    href="/admin/settings" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Settings</span>
                                </Link>
                                <button 
                                    onClick={() => {
                                        handleLogout();
                                        isMobile && setSidebarOpen(false);
                                    }}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Log out</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 p-4 md:p-8 w-full ${isMobile ? '' : 'ml-64'}`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Sales Report</h1>
                                <p className="text-blue-100 text-sm md:text-base">See your sales report</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => setIsExportModalOpen(true)}
                                    className="bg-white text-blue-600 hover:bg-gray-100 text-xs md:text-sm whitespace-nowrap"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Export</span>
                                    <span className="sm:hidden">Export</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-white text-gray-900 rounded-xl p-4 md:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-1 text-gray-900">Total Revenue</h3>
                            <p className="text-sm text-gray-600 mb-4">Total Revenue</p>
                            <p className="text-2xl md:text-4xl font-bold text-gray-900">₱{(salesMetrics.totalRevenue || 0).toFixed(2)}</p>
                        </div>
                        
                        <div className="bg-white text-gray-900 rounded-xl p-4 md:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-1 text-gray-900">Average Sale</h3>
                            <p className="text-sm text-gray-600 mb-4">Average Sales Per Day</p>
                            <p className="text-2xl md:text-4xl font-bold text-gray-900">₱{(salesMetrics.averageSalePerDay || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Charts and Data */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sales Overview Chart */}
                        <div className="lg:col-span-2 bg-white rounded-xl p-4 md:p-6 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-1 text-gray-900">Sales Overview</h3>
                                <p className="text-sm text-gray-600">Number of transaction per month</p>
                            </div>
                            
                            <div className="h-64 sm:h-80 overflow-hidden">
                                <Bar 
                                    data={chartData} 
                                    options={{
                                        ...chartOptions,
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        interaction: {
                                            intersect: false,
                                        },
                                        plugins: {
                                            ...chartOptions.plugins,
                                            tooltip: {
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                titleColor: 'white',
                                                bodyColor: 'white',
                                            },
                                        },
                                        scales: {
                                            ...chartOptions.scales,
                                            x: {
                                                ...chartOptions.scales.x,
                                                ticks: {
                                                    maxRotation: window.innerWidth < 640 ? 45 : 0,
                                                    minRotation: 0,
                                                },
                                            },
                                        },
                                    }} 
                                />
                            </div>
                        </div>

                        {/* Product Sales Ranking */}
                        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-1 text-gray-900">Sales Order</h3>
                                <p className="text-sm text-gray-600">Product sales Ranking</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-600 border-b pb-2">
                                    <span className="text-gray-600">Product</span>
                                    <span className="text-gray-600">Total of Sales</span>
                                </div>
                                
                                {salesMetrics.productSales.length > 0 ? (
                                    salesMetrics.productSales.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-2">
                                            <span className="text-gray-800 text-sm truncate mr-2 flex-1">{item.product}</span>
                                            <span className="font-medium text-gray-900 text-sm whitespace-nowrap">₱{(item.sales || 0).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No sales data available
                                    </div>
                                )}
                                
                                {salesMetrics.productSales.length > 0 && (
                                    <div className="border-t pt-3 mt-2">
                                        <div className="flex justify-between items-center font-semibold">
                                            <span className="text-gray-900 text-sm">Total</span>
                                            <span className="text-gray-900 text-sm">₱{(salesMetrics.totalRevenue || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Export Modal */}
            <DateFilterModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Sales Report"
                description="Select date range to export sales data and revenue analytics."
            />

            {/* Logout Confirmation Dialog */}
            <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to logout? You will need to sign in again to access your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={cancelLogout}>
                            No, Stay Logged In
                        </Button>
                        <Button variant="destructive" onClick={confirmLogout}>
                            Yes, Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}