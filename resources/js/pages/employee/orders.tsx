import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Package, ShoppingCart, User, LogOut, Eye, Check, Truck, Search, Filter, Calendar, MoreHorizontal, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
    id: number;
    name: string;
    username: string;
    user_type: number;
    position?: string;
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
    delivery_rider_id?: number;
    deliveryRider?: User;
}

interface EmployeeOrdersProps {
    user: User;
    orders: Order[];
}

export default function EmployeeOrders({ user, orders }: EmployeeOrdersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleLogout = () => {
        router.post('/logout');
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

    const getStatusBadge = (status: string) => {
        if (status === 'pending') {
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">● Pending</Badge>;
        } else if (status === 'out_for_delivery') {
            return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">● On Delivery</Badge>;
        } else if (status === 'completed') {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">● Completed</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const handleViewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderDetailsModalOpen(true);
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await router.post(`/employee/orders/${orderId}/update-status`, {
                status: newStatus
            });
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    // Filter orders based on search term and status
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.contact_number.includes(searchTerm) ||
            order.address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="My Orders - RDA Tube Ice" />
            
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
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                {/* Desktop Sidebar - Hidden on mobile by default, shown on desktop */}
                <aside className="w-64 bg-blue-600 min-h-screen text-white hidden md:block">
                    <div className="p-6">
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4">Menu</h2>
                            <nav className="space-y-2">
                                <Link 
                                    href="/employee/dashboard" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link 
                                    href="/employee/orders" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                                    <span>Settings</span>
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Log out</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar - Only shown when sidebarOpen is true */}
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
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Package className="w-5 h-5" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link 
                                        href="/employee/orders" 
                                        className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                        onClick={() => setSidebarOpen(false)}
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
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <User className="w-5 h-5" />
                                        <span>Settings</span>
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            setSidebarOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors w-full text-left"
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
                <main className={`flex-1 p-4 md:p-8 ${isMobile ? 'w-full' : ''}`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">My Orders</h1>
                                <p className="text-blue-100 text-sm md:text-base">Manage orders assigned to you</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-white rounded-lg p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
                                    <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {orders.filter(order => order.status === 'pending').length}
                                    </p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Package className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700">On Delivery</h3>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {orders.filter(order => order.status === 'out_for_delivery').length}
                                    </p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-lg">
                                    <Truck className="w-8 h-8 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Section */}
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                {/* Search */}
                                <div className="flex-1 max-w-md">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            type="text"
                                            placeholder="Search by customer, order ID, contact, or address"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex gap-4">
                                    {/* Status Filter */}
                                    <div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="out_for_delivery">On Delivery</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </div>
                        </div>

                        {/* Orders Table - Desktop */}
                        {!isMobile ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Delivery Mode</TableHead>
                                            <TableHead>Order Date</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                                    {searchTerm || statusFilter !== 'all' ? 'No orders found matching your filters' : 'No orders assigned to you'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <TableRow key={order.order_id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        {getStatusBadge(order.status)}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{order.order_id}</TableCell>
                                                    <TableCell>{order.customer_name}</TableCell>
                                                    <TableCell className="max-w-32 truncate">{order.address}</TableCell>
                                                    <TableCell>{order.size}</TableCell>
                                                    <TableCell>{order.quantity}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {order.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatDate(order.order_date)}</TableCell>
                                                    <TableCell className="font-semibold">₱{order.total.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Actions</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                {order.status === 'pending' && (
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleStatusUpdate(order.order_id, 'out_for_delivery')}
                                                                        className="text-blue-600"
                                                                    >
                                                                        <Truck className="mr-2 h-4 w-4" />
                                                                        Start Delivery
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'out_for_delivery' && (
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                                                        className="text-green-600"
                                                                    >
                                                                        <Check className="mr-2 h-4 w-4" />
                                                                        Complete Order
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            /* Orders Cards - Mobile */
                            <div className="space-y-4 p-4">
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {searchTerm || statusFilter !== 'all' ? 'No orders found matching your filters' : 'No orders assigned to you'}
                                    </div>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <div key={order.order_id} className="bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="font-semibold text-lg">#{order.order_id}</div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Customer:</span>
                                                    <span className="font-medium">{order.customer_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Address:</span>
                                                    <span className="text-right font-medium truncate max-w-48">{order.address}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Size & Quantity:</span>
                                                    <span className="font-medium">{order.size} × {order.quantity}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Delivery:</span>
                                                    <Badge variant="outline">
                                                        {order.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Date:</span>
                                                    <span className="font-medium">{formatDate(order.order_date)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="font-bold text-lg">₱{order.total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 mt-4">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleViewOrderDetails(order)}
                                                    className="flex-1"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                                {order.status === 'pending' && (
                                                    <Button 
                                                        variant="default" 
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(order.order_id, 'out_for_delivery')}
                                                        className="flex-1"
                                                    >
                                                        <Truck className="mr-2 h-4 w-4" />
                                                        Start Delivery
                                                    </Button>
                                                )}
                                                {order.status === 'out_for_delivery' && (
                                                    <Button 
                                                        variant="default" 
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Complete Order
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Order Details Modal */}
            <Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg font-semibold">Order Details</DialogTitle>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-2">
                            {/* Order Information */}
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <h3 className="text-base font-semibold mb-1">Order Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <span className="text-xs text-gray-500">Order ID</span>
                                        <p className="font-semibold">{selectedOrder.order_id}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Customer</span>
                                        <p className="font-semibold">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Contact</span>
                                        <p className="font-semibold text-sm">{selectedOrder.contact_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Address</span>
                                        <p className="font-semibold text-sm">{selectedOrder.address}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Size</span>
                                        <p className="font-semibold text-sm">{selectedOrder.size}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Quantity</span>
                                        <p className="font-semibold text-sm">{selectedOrder.quantity}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Delivery Mode</span>
                                        <p className="font-semibold text-sm">{selectedOrder.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Order Date</span>
                                        <p className="font-semibold text-sm">{formatDate(selectedOrder.order_date)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Total</span>
                                        <p className="font-semibold text-base">₱{selectedOrder.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Status */}
                            <div className="bg-white border rounded-lg p-2">
                                <h3 className="text-base font-semibold mb-2 text-center text-blue-600">Transaction Status</h3>
                                
                                <div className="flex justify-center items-center space-x-3">
                                    {/* Waiting Confirmation */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                            selectedOrder.status === 'pending' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <p className="text-xs font-medium">Waiting</p>
                                        <p className="text-xs text-gray-500">Confirmation</p>
                                    </div>

                                    {/* Dotted Line */}
                                    <div className="flex-1 border-t-2 border-dotted border-gray-300 mx-1"></div>

                                    {/* Package on Delivery */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                            selectedOrder.status === 'out_for_delivery' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-medium">Package</p>
                                        <p className="text-xs text-gray-500">On Delivery</p>
                                    </div>

                                    {/* Dotted Line */}
                                    <div className="flex-1 border-t-2 border-dotted border-gray-300 mx-1"></div>

                                    {/* Package Delivered */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                            selectedOrder.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-medium">Package</p>
                                        <p className="text-xs text-gray-500">Delivered</p>
                                    </div>
                                </div>

                                {/* Current Status Text */}
                                <div className="mt-2 text-center">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Current Status: {getStatusBadge(selectedOrder.status)}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center space-x-2 pt-1">
                                <Button
                                    onClick={() => setIsOrderDetailsModalOpen(false)}
                                    variant="outline"
                                    size="sm"
                                >
                                    Close
                                </Button>
                                {selectedOrder.status === 'pending' && (
                                    <Button
                                        onClick={() => {
                                            handleStatusUpdate(selectedOrder.order_id, 'out_for_delivery');
                                            setIsOrderDetailsModalOpen(false);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                    >
                                        <Truck className="h-4 w-4 mr-2" />
                                        Start Delivery
                                    </Button>
                                )}
                                {selectedOrder.status === 'out_for_delivery' && (
                                    <Button
                                        onClick={() => {
                                            handleStatusUpdate(selectedOrder.order_id, 'completed');
                                            setIsOrderDetailsModalOpen(false);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        size="sm"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as Delivered
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}