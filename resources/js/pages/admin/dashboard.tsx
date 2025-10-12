import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, Package, Settings, ShoppingCart, TrendingUp, Users, Filter, LogOut, AlertTriangle, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import SalesChart from '@/components/SalesChart';

interface AdminDashboardProps {
    user: {
        name: string;
        username: string;
        user_type: number;
    };
    orderStats: {
        today: number;
        thisMonth: number;
        thisYear: number;
    };
    inventoryStats?: {
        totalStock: number;
        totalItems: number;
        criticalStockCount: number;
        criticalStockItems: Array<{
            product_name: string;
            size: string;
            quantity: number;
        }>;
    };
    salesStats?: {
        todayTotal: number;
        hourlySales: number[];
    };
}

interface EquipmentStats {
    total: number;
    operational: number;
    under_maintenance: number;
    broken: number;
}

interface Equipment {
    id: number;
    equipment_name: string;
    equipment_type: string;
    status: 'operational' | 'under_maintenance' | 'broken';
    created_at: string;
    updated_at: string;
    maintenances?: Array<{
        id: number;
        maintenance_type: string;
        status: string;
        maintenance_date: string;
        description?: string;
    }>;
}

export default function AdminDashboard({ user, orderStats, inventoryStats, salesStats }: AdminDashboardProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'thisMonth' | 'thisYear'>('today');
    const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(null);
    const [selectedEquipmentView, setSelectedEquipmentView] = useState<'total' | 'operational' | 'under_maintenance' | 'broken'>('total');
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    

    
    useEffect(() => {
        fetchEquipmentData();
    }, []);
    
    const fetchEquipmentData = async () => {
        try {
            const response = await fetch('/api/admin/equipment/dashboard-stats');
            const data = await response.json();
            setEquipmentStats(data.stats);
        } catch (error) {
            console.error('Error fetching equipment data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const getCurrentEquipmentCount = () => {
        if (!equipmentStats) return 0;
        switch (selectedEquipmentView) {
            case 'total': return equipmentStats.total;
            case 'operational': return equipmentStats.operational;
            case 'under_maintenance': return equipmentStats.under_maintenance;
            case 'broken': return equipmentStats.broken;
            default: return equipmentStats.total;
        }
    };
    
    const getEquipmentViewLabel = () => {
        switch (selectedEquipmentView) {
            case 'total': return 'Total';
            case 'operational': return 'Active';
            case 'under_maintenance': return 'Maintenance';
            case 'broken': return 'Broken';
            default: return 'Total';
        }
    };
    
    const handleLogout = () => {
        router.post('/logout');
    };
    
    const getCurrentOrderCount = () => {
        switch (selectedPeriod) {
            case 'today': return orderStats.today;
            case 'thisMonth': return orderStats.thisMonth;
            case 'thisYear': return orderStats.thisYear;
            default: return orderStats.today;
        }
    };
    
    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'today': return 'Today';
            case 'thisMonth': return 'This Month';
            case 'thisYear': return 'This Year';
            default: return 'Today';
        }
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Admin Dashboard - RDA Tube Ice" />
            
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-lg relative z-50">
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
                        <div className="hidden md:block relative">
                            <input 
                                type="text" 
                                placeholder="Search" 
                                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                        {isMobile && (
                            <div className="flex items-center space-x-2">
                                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                    {user.name?.charAt(0) || 'A'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex relative">
                {/* Mobile Overlay */}
                {isMobile && sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    ${isMobile 
                        ? `fixed top-0 left-0 z-50 w-64 h-full bg-blue-600 transform transition-transform duration-300 ease-in-out ${
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }` 
                        : 'w-64 bg-blue-600 min-h-screen'
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
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                                <Link 
                                    href="/admin/sales-report" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
                <main className="flex-1 p-4 md:p-8 w-full min-w-0">
                    {/* Dashboard Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">DASHBOARD</h1>
                        <p className="text-blue-100 text-sm md:text-base">Welcome Back, {user.name || 'Admin'}!</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <div className="flex-1">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Total Orders</h3>
                                    <p className="text-xs md:text-sm text-gray-500">{getPeriodLabel()}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'thisMonth' | 'thisYear')}
                                            className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="today">Today</option>
                                            <option value="thisMonth">This Month</option>
                                            <option value="thisYear">This Year</option>
                                        </select>
                                        <Filter className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                                    </div>
                                    <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                                        <ShoppingCart className="w-6 md:w-8 h-6 md:h-8 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 md:mt-4">
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{getCurrentOrderCount()}</div>
                                <p className="text-xs md:text-sm text-gray-500">orders made {getPeriodLabel().toLowerCase()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <div className="flex-1">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Inventory</h3>
                                    <p className="text-xs md:text-sm text-gray-500">Stock Management</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {inventoryStats && inventoryStats.criticalStockCount > 0 && (
                                        <div className="bg-red-100 p-2 rounded-lg">
                                            <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-red-600" />
                                        </div>
                                    )}
                                    <div className="bg-gray-100 p-2 md:p-3 rounded-lg">
                                        <Package className="w-6 md:w-8 h-6 md:h-8 text-gray-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 md:mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                                            {inventoryStats?.totalStock ?? 0}
                                        </div>
                                        <p className="text-xs md:text-sm text-gray-500">total units in stock</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-base md:text-lg font-semibold text-gray-700">
                                            {inventoryStats?.totalItems ?? 0}
                                        </div>
                                        <p className="text-xs text-gray-500">different items</p>
                                    </div>
                                </div>
                                {inventoryStats && inventoryStats.criticalStockCount > 0 && (
                                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-center space-x-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            <span className="text-sm font-medium text-red-800">
                                                {inventoryStats.criticalStockCount} item{inventoryStats.criticalStockCount !== 1 ? 's' : ''} need attention
                                            </span>
                                        </div>
                                        {inventoryStats.criticalStockItems.slice(0, 3).map((item, index) => (
                                            <div key={index} className="text-xs mt-1">
                                                <span className={item.quantity === 0 ? "text-red-800 font-semibold" : "text-red-700"}>
                                                    {item.product_name} ({item.size}): {item.quantity === 0 ? "OUT OF STOCK" : `${item.quantity} units left`}
                                                </span>
                                            </div>
                                        ))}
                                        {inventoryStats.criticalStockCount > 3 && (
                                            <div className="text-xs text-red-600 mt-1 font-medium">
                                                +{inventoryStats.criticalStockCount - 3} more items need attention
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <div className="flex-1">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Equipment</h3>
                                    <p className="text-xs md:text-sm text-gray-500">{getEquipmentViewLabel()}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <select
                                            value={selectedEquipmentView}
                                            onChange={(e) => setSelectedEquipmentView(e.target.value as 'total' | 'operational' | 'under_maintenance' | 'broken')}
                                            className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="total">Total</option>
                                            <option value="operational">Active</option>
                                            <option value="under_maintenance">Maintenance</option>
                                            <option value="broken">Broken</option>
                                        </select>
                                        <Filter className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                                    </div>
                                    <div className="bg-orange-100 p-2 md:p-3 rounded-lg">
                                        <Settings className="w-6 md:w-8 h-6 md:h-8 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 md:mt-4">
                                {loading ? (
                                    <div className="text-gray-500 text-sm md:text-base">Loading...</div>
                                ) : equipmentStats ? (
                                    <>
                                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{getCurrentEquipmentCount()}</div>
                                        <p className="text-xs md:text-sm text-gray-500">machines {getEquipmentViewLabel().toLowerCase()}</p>
                                    </>
                                ) : (
                                    <div className="text-gray-500 text-sm md:text-base">No data available</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sales Chart */}
                    <div className="mb-6 md:mb-8">
                        {salesStats ? (
                            <SalesChart 
                                hourlySales={salesStats.hourlySales} 
                                totalSales={salesStats.todayTotal} 
                            />
                        ) : (
                            <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                    <div className="text-center">
                                        <div className="text-lg font-medium mb-2">Sales data not available</div>
                                        <div className="text-sm">Unable to load today's sales information</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
