import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, Package, Settings, ShoppingCart, Users, LogOut, Search, Download, Menu, X, Calendar, TrendingUp, Eye, FileText, FileSpreadsheet, Monitor, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
    
    // Enhanced export options
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [includeSeasonalAnalytics, setIncludeSeasonalAnalytics] = useState(true);
    const [includeTrends, setIncludeTrends] = useState(true);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
    const [showPreview, setShowPreview] = useState(false);
    
    // Chart filter state
    const [chartSizeFilter, setChartSizeFilter] = useState<string>('all');
    
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

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            format: exportFormat,
            sizes: selectedSizes.join(','),
            seasonal_analytics: includeSeasonalAnalytics.toString(),
            trends: includeTrends.toString()
        });
        
        // Open export URL in new tab
        window.open(`/admin/sales-report/export?${params.toString()}`, '_blank');
        setIsExportModalOpen(false);
    };

    // Get available sizes from orders
    const availableSizes = useMemo(() => {
        const sizes = [...new Set(orders.map(order => order.size))].filter(Boolean);
        return sizes.sort();
    }, [orders]);

    // Handle size selection toggle
    const handleSizeToggle = (size: string) => {
        setSelectedSizes(prev => 
            prev.includes(size) 
                ? prev.filter(s => s !== size)
                : [...prev, size]
        );
    };

    // Get filtered orders for preview
    const getFilteredOrders = () => {
        if (!startDate || !endDate) return [];
        
        return orders.filter(order => {
            const orderDate = order.order_date.split('T')[0];
            const sizeMatch = selectedSizes.length === 0 || selectedSizes.includes(order.size);
            const dateMatch = orderDate >= startDate && orderDate <= endDate;
            return dateMatch && sizeMatch && order.status === 'completed';
        });
    };

    // Calculate preview analytics
    const getPreviewAnalytics = () => {
        const filteredOrders = getFilteredOrders();
        
        const analytics = {
            totalOrders: filteredOrders.length,
            totalRevenue: filteredOrders.reduce((sum, order) => {
                const orderTotal = parseFloat(order.total?.toString() || '0');
                return sum + (isNaN(orderTotal) ? 0 : orderTotal);
            }, 0),
            sizeBreakdown: {} as Record<string, { orders: number; revenue: number }>,
            monthlyData: {} as Record<string, { orders: number; revenue: number }>
        };

        // Size breakdown
        filteredOrders.forEach(order => {
            const size = order.size || 'Unknown';
            if (!analytics.sizeBreakdown[size]) {
                analytics.sizeBreakdown[size] = { orders: 0, revenue: 0 };
            }
            analytics.sizeBreakdown[size].orders++;
            const orderTotal = parseFloat(order.total?.toString() || '0');
            analytics.sizeBreakdown[size].revenue += isNaN(orderTotal) ? 0 : orderTotal;
        });

        // Monthly breakdown for seasonal analytics
        if (includeSeasonalAnalytics) {
            filteredOrders.forEach(order => {
                const month = new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                if (!analytics.monthlyData[month]) {
                    analytics.monthlyData[month] = { orders: 0, revenue: 0 };
                }
                analytics.monthlyData[month].orders++;
                const orderTotal = parseFloat(order.total?.toString() || '0');
                analytics.monthlyData[month].revenue += isNaN(orderTotal) ? 0 : orderTotal;
            });
        }

        return analytics;
    };

    // Calculate sales metrics
    const salesMetrics = useMemo(() => {
        const completedOrders = orders.filter(order => order.status === 'completed');
        
        // Filter orders by chart size filter
        const chartFilteredOrders = chartSizeFilter === 'all' 
            ? completedOrders 
            : completedOrders.filter(order => order.size === chartSizeFilter);
        
        // Total revenue from completed orders - ensure we handle null/undefined values
        const totalRevenue = completedOrders.reduce((sum, order) => {
            const orderTotal = order.total ? Number(order.total) : 0;
            return sum + (isNaN(orderTotal) ? 0 : orderTotal);
        }, 0);
        
        // Calculate average sale per day (based on unique dates)
        const uniqueDates = [...new Set(completedOrders.map(order => order.order_date.split('T')[0]))];
        const averageSalePerDay = uniqueDates.length > 0 ? totalRevenue / uniqueDates.length : 0;

        // Monthly sales data for chart (last 12 months) - using filtered orders for chart
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (11 - i));
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
            
            const monthOrders = chartFilteredOrders.filter(order => 
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
    }, [orders, chartSizeFilter]);

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
                                    <Settings className="w-5 h-5" />
                                    <span>Equipment</span>
                                </Link>
                                <a 
                                    href="/admin/product-monitoring" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Monitor className="w-5 h-5" />
                                    <span>Product Monitoring</span>
                                </a>
                                <Link 
                                    href="/admin/sales-report" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Sales Summary</span>
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
                                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Sales Summary</h1>
                                <p className="text-blue-100 text-sm md:text-base">See your sales summary</p>
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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1 text-gray-900">Sales Overview</h3>
                                        <p className="text-sm text-gray-600">Number of transaction per month</p>
                                    </div>
                                    
                                    {/* Size Filter */}
                                    <div className="relative">
                                        <select 
                                            value={chartSizeFilter} 
                                            onChange={(e) => setChartSizeFilter(e.target.value)}
                                            className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[120px]"
                                        >
                                            <option value="all">All Sizes</option>
                                            {availableSizes.map(size => (
                                                <option key={size} value={size}>
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
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

            {/* Enhanced Export Modal */}
            <Dialog open={isExportModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsExportModalOpen(false);
                    setStartDate('');
                    setEndDate('');
                    setSelectedSizes([]);
                    setIncludeSeasonalAnalytics(true);
                    setIncludeTrends(true);
                    setExportFormat('pdf');
                    setShowPreview(false);
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-blue-600" />
                            Export Sales Analytics
                        </DialogTitle>
                        <DialogDescription>
                            Configure your sales export with size filtering, seasonal analytics, and trend analysis.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">Start Date</Label>
                                <div className="relative">
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        onClick={(e) => {
                                            try {
                                                (e.target as HTMLInputElement).showPicker();
                                            } catch (error) {
                                                // Fallback for browsers that don't support showPicker
                                                console.log('showPicker not supported');
                                            }
                                        }}
                                        className="w-full pr-10"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">End Date</Label>
                                <div className="relative">
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        onClick={(e) => {
                                            try {
                                                (e.target as HTMLInputElement).showPicker();
                                            } catch (error) {
                                                // Fallback for browsers that don't support showPicker
                                                console.log('showPicker not supported');
                                            }
                                        }}
                                        className="w-full pr-10"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Size Selection */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Product Sizes</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {availableSizes.map(size => (
                                    <label key={size} className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={selectedSizes.includes(size)}
                                            onChange={() => handleSizeToggle(size)}
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm font-medium">{size}</span>
                                    </label>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedSizes(selectedSizes.length === availableSizes.length ? [] : availableSizes)}
                                    className="text-xs"
                                >
                                    {selectedSizes.length === availableSizes.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            {selectedSizes.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">No sizes selected - all sizes will be included</p>
                            )}
                        </div>

                        {/* Analytics Options */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Analytics Options</Label>
                            <div className="space-y-3">
                                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={includeSeasonalAnalytics}
                                        onChange={(e) => setIncludeSeasonalAnalytics(e.target.checked)}
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-600" />
                                            <span className="font-medium text-sm">Seasonal Analytics</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Monthly patterns and seasonal demand analysis</p>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={includeTrends}
                                        onChange={(e) => setIncludeTrends(e.target.checked)}
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                            <span className="font-medium text-sm">Trend Analysis</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Growth trends and performance indicators</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Export Format */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Export Format</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="format"
                                        value="pdf"
                                        checked={exportFormat === 'pdf'}
                                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
                                        className="text-blue-600"
                                    />
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-red-600" />
                                        <span className="text-sm">PDF Report</span>
                                    </div>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="format"
                                        value="excel"
                                        checked={exportFormat === 'excel'}
                                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
                                        className="text-blue-600"
                                    />
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">Excel Spreadsheet</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Preview Section */}
                        {startDate && endDate && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium">Export Preview</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="text-xs"
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                                    </Button>
                                </div>
                                
                                {showPreview && (() => {
                                    const analytics = getPreviewAnalytics();
                                    return (
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Total Orders:</span>
                                                    <span className="ml-2">{analytics.totalOrders}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Total Revenue:</span>
                                                    <span className="ml-2">₱{Number(analytics.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                            
                                            {Object.keys(analytics.sizeBreakdown).length > 0 && (
                                                <div>
                                                    <p className="font-medium text-sm mb-2">Size Breakdown:</p>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {Object.entries(analytics.sizeBreakdown).map(([size, data]) => (
                                                            <div key={size} className="flex justify-between">
                                                                <span>{size}:</span>
                                                                <span>{data.orders} orders, ₱{Number(data.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {includeSeasonalAnalytics && Object.keys(analytics.monthlyData).length > 0 && (
                                                <div>
                                                    <p className="font-medium text-sm mb-2">Monthly Data:</p>
                                                    <div className="grid grid-cols-1 gap-1 text-xs max-h-24 overflow-y-auto">
                                                        {Object.entries(analytics.monthlyData).map(([month, data]) => (
                                                            <div key={month} className="flex justify-between">
                                                                <span>{month}:</span>
                                                                <span>{data.orders} orders, ₱{Number(data.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsExportModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleExport}
                            disabled={!startDate || !endDate}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export {exportFormat.toUpperCase()}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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