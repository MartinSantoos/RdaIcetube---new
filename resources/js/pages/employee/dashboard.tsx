import { Head, Link, router } from '@inertiajs/react';
import { Package, ShoppingCart, User, LogOut, Truck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface User {
    id: number;
    name: string;
    username: string;
    user_type: number;
}

interface Order {
    order_id: string;
    customer_name: string;
    contact_number: string;
    address: string;
    size: string;
    quantity: number;
    delivery_mode: 'pick_up' | 'deliver';
    order_date: string;
    delivery_date?: string;
    status: 'pending' | 'out_for_delivery' | 'completed';
    total: number;
    created_at: string;
}

interface Stats {
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    on_delivery_orders: number;
}

interface EmployeeDashboardProps {
    user: User;
    stats: Stats;
    due_today_orders: Order[];
    recent_orders: Order[];
}

export default function EmployeeDashboard({ user, stats, due_today_orders, recent_orders }: EmployeeDashboardProps) {
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Employee Dashboard - RDA Tube Ice" />
            
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-lg relative z-50">
                <div className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold">RDA Tube Ice</h1>
                        <div className="hidden md:block h-6 w-px bg-blue-400"></div>
                        <div className="hidden md:flex items-center space-x-2">
                            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-medium">Employee</div>
                                <div className="text-xs text-blue-200">{user.name}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold md:hidden">
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
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

                {/* Desktop Sidebar */}
                <aside className="w-64 bg-blue-600 min-h-screen text-white hidden md:block">
                    <div className="p-6">
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4">Menu</h2>
                            <nav className="space-y-2">
                                <Link 
                                    href="/employee/dashboard" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link 
                                    href="/employee/orders" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>My Orders</span>
                                </Link>
                            </nav>
                        </div>

                        <div className="border-t border-blue-500 pt-6">
                            <h3 className="text-sm font-semibold mb-4">Settings</h3>
                            <nav className="space-y-2">
                                <Link 
                                    href="/employee/settings" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                    <span>Profile</span>
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Log out</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar */}
                {sidebarOpen && (
                    <aside className="
                        fixed inset-y-0 left-0 z-50 w-64 
                        bg-blue-600 text-white
                        transform translate-x-0 
                        transition-transform duration-300 ease-in-out
                        md:hidden
                    ">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">Menu</h2>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="mb-8">
                                <nav className="space-y-2">
                                    <Link 
                                        href="/employee/dashboard" 
                                        className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Package className="w-5 h-5" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link 
                                        href="/employee/orders" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>Orders</span>
                                    </Link>
                                </nav>
                            </div>

                            <div className="border-t border-blue-500 pt-6">
                                <h3 className="text-sm font-semibold mb-4">Settings</h3>
                                <nav className="space-y-2">
                                    <Link 
                                        href="/employee/settings" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <User className="w-5 h-5" />
                                        <span>Profile</span>
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            setSidebarOpen(false);
                                            handleLogout();
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
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 w-full min-w-0">
                    {/* Dashboard Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">DASHBOARD</h1>
                        <p className="text-blue-100 text-sm md:text-base">Welcome Back, {user.name}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm md:text-lg font-semibold text-gray-700">Total Orders</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total_orders}</p>
                                </div>
                                <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                                    <ShoppingCart className="w-6 md:w-8 h-6 md:h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm md:text-lg font-semibold text-gray-700">Completed</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed_orders}</p>
                                </div>
                                <div className="bg-green-100 p-2 md:p-3 rounded-lg">
                                    <Package className="w-6 md:w-8 h-6 md:h-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm md:text-lg font-semibold text-gray-700">On Delivery</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.on_delivery_orders}</p>
                                </div>
                                <div className="bg-orange-100 p-2 md:p-3 rounded-lg">
                                    <Truck className="w-6 md:w-8 h-6 md:h-8 text-orange-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md border-l-4 border-red-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm md:text-lg font-semibold text-gray-700">Due Today</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-red-600">{due_today_orders.length}</p>
                                </div>
                                <div className="bg-red-100 p-2 md:p-3 rounded-lg">
                                    <Truck className="w-6 md:w-8 h-6 md:h-8 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tables */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                        {/* Due Today */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base md:text-lg font-semibold text-gray-700">Due Today</h3>
                                {due_today_orders.length > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                        {due_today_orders.length} {due_today_orders.length === 1 ? 'order' : 'orders'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Orders scheduled for delivery today</p>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Customer</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Order</th>
                                            <th className="hidden lg:table-cell text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Address</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {due_today_orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-6 md:py-8 text-center text-gray-500 text-sm">
                                                    <div className="flex flex-col items-center">
                                                        <Truck className="w-8 h-8 text-gray-300 mb-2" />
                                                        <p>No orders due today</p>
                                                        <p className="text-xs text-gray-400 mt-1">All caught up!</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            due_today_orders.map((order) => (
                                                <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">
                                                        <div>
                                                            <p className="font-medium">{order.customer_name}</p>
                                                            <p className="text-xs text-gray-500">{order.contact_number}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">
                                                        <div>
                                                            <p className="font-medium">#{order.order_id}</p>
                                                            <p className="text-xs text-gray-500">{order.quantity}x {order.size}</p>
                                                            <p className="text-xs text-blue-600 font-medium">Due Today</p>
                                                        </div>
                                                    </td>
                                                    <td className="hidden lg:table-cell py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 max-w-xs truncate">
                                                        {order.address}
                                                    </td>
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                                            order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {order.status === 'pending' ? '⏳ Pending' :
                                                             order.status === 'out_for_delivery' ? '🚚 On Delivery' : 
                                                             order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                                                        <Link 
                                                            href="/employee/orders" 
                                                            className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
                            <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">Recent Orders</h3>
                            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Latest Assigned Orders</p>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Customer</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Order</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent_orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="py-6 md:py-8 text-center text-gray-500 text-sm">
                                                    No orders assigned yet
                                                </td>
                                            </tr>
                                        ) : (
                                            recent_orders.map((order) => (
                                                <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 font-medium">{order.customer_name}</td>
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{order.order_id}</td>
                                                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-800' :
                                                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {order.status === 'out_for_delivery' ? 'On Delivery' : 
                                                             order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

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
