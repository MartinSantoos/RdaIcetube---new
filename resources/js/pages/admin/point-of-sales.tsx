import { Head, Link, useForm, router } from '@inertiajs/react';
import { Search, Download, BarChart3, Package, Settings, ShoppingCart, MoreHorizontal, Check, X, Archive, Plus, Users, Printer, LogOut, Truck, Eye, RotateCcw, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect, useMemo } from 'react';

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

interface DeliveryRider {
    id: number;
    name: string;
    position: string;
}

interface InventoryItem {
    size: string;
    price: number;
    status: string;
    quantity: number;
}

interface OrderProps {
    user: User;
    orders: Order[];
    archivedOrders?: Order[];
    deliveryRiders: DeliveryRider[];
    inventory: InventoryItem[];
}

export default function Order({ user, orders, archivedOrders = [], deliveryRiders, inventory = [] }: OrderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deliveryModeFilter, setDeliveryModeFilter] = useState('all');
    const [sizeFilter, setSizeFilter] = useState('all');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    
    // Debug logging - can be removed after fixing
    console.log('Orders data:', orders);
    console.log('Orders length:', orders?.length || 0);
    
    const handleLogout = () => {
        router.post('/logout');
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };
    
    const { data, setData, post, processing, errors, reset } = useForm({
        customer_name: '',
        address: '',
        contact_number: '',
        quantity: '',
        size: '',
        order_date: getTodayDate(),
        delivery_date: '',
        delivery_mode: 'pick_up',
        delivery_rider_id: '',
    });

    // Clear selected size
    useEffect(() => {
        if (data.quantity && data.size) {
            const requestedQuantity = parseInt(data.quantity);
            const selectedItem = inventory.find(item => item.size === data.size);
            
            if (selectedItem && selectedItem.quantity < requestedQuantity) {
                setData('size', '');
            }
        }
    }, [data.quantity, data.size, inventory]);

    // Check if quantity exceeds all available stock
    const isQuantityTooHigh = useMemo(() => {
        if (!data.quantity || !inventory || !Array.isArray(inventory)) return false;
        
        const availableInventory = inventory.filter(item => item && item.status === 'available' && item.quantity > 0);
        if (availableInventory.length === 0) return false;
        
        const requestedQuantity = parseInt(data.quantity);
        if (isNaN(requestedQuantity)) return false;
        
        const maxStock = Math.max(...availableInventory.map(item => item.quantity));
        return requestedQuantity > maxStock;
    }, [data.quantity, inventory]);

    // get maximum available stock
    const maxStock = useMemo(() => {
        if (!inventory || !Array.isArray(inventory)) return 0;
        
        const availableInventory = inventory.filter(item => item && item.status === 'available' && item.quantity > 0);
        if (availableInventory.length === 0) return 0;
        return Math.max(...availableInventory.map(item => item.quantity));
    }, [inventory]);

    // get available items for the current quantity
    const availableItems = useMemo(() => {
        try {
            if (!inventory || !Array.isArray(inventory)) {
                console.warn('Inventory is not available or not an array:', inventory);
                return [];
            }
            
            if (!data.quantity || data.quantity === '') {
                return inventory.filter(item => item && item.status === 'available' && item.quantity > 0) || [];
            }
            
            const requestedQuantity = parseInt(data.quantity);
            if (isNaN(requestedQuantity) || requestedQuantity <= 0) return [];
            
            const filtered = inventory.filter(item => {
                return item && 
                       item.status === 'available' && 
                       item.quantity > 0 && 
                       item.quantity >= requestedQuantity;
            }) || [];
            
            return filtered;
        } catch (error) {
            console.error('Error in availableItems calculation:', error);
            return [];
        }
    }, [inventory, data.quantity]);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!data.customer_name.trim()) {
            errors.customer_name = 'Customer name is required';
        }
        
        if (!data.address.trim()) {
            errors.address = 'Address is required';
        }
        
        if (!data.contact_number.trim()) {
            errors.contact_number = 'Contact number is required';
        } else if (!/^[0-9]{11}$/.test(data.contact_number.trim())) {
            errors.contact_number = 'Contact number must be exactly 11 digits';
        }
        
        if (!data.quantity.trim()) {
            errors.quantity = 'Quantity is required';
        } else if (isNaN(Number(data.quantity)) || Number(data.quantity) < 1) {
            errors.quantity = 'Quantity must be a positive number';
        }
        
        if (!data.size.trim()) {
            errors.size = 'Size is required';
        }
        
        if (!data.order_date.trim()) {
            errors.order_date = 'Order date is required';
        }
        
        if (!data.delivery_date.trim()) {
            errors.delivery_date = 'Delivery date is required';
        } else {
            const today = new Date(getTodayDate());
            const deliveryDate = new Date(data.delivery_date);
            
            if (deliveryDate < today) {
                errors.delivery_date = 'Delivery date cannot be in the past';
            } else if (deliveryDate.getTime() === today.getTime()) {
                errors.delivery_date = 'Delivery date must be after today';
            }
        }
        
        if (data.delivery_mode === 'deliver' && !data.delivery_rider_id.trim()) {
            errors.delivery_rider_id = 'Please select a delivery rider for delivery orders';
        }
        
        return errors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('Form submission started with data:', data);
        setValidationErrors({});
        
        const errors = validateForm();
        
        if (Object.keys(errors).length > 0) {
            console.log('Client-side validation errors:', errors);
            setValidationErrors(errors);
            return;
        }
        
        console.log('Submitting to /admin/orders...');
        post('/admin/orders', {
            onSuccess: () => {
                console.log('Order created successfully!');
                reset();
                setValidationErrors({});
                setShowSuccess(true);
                setIsModalOpen(false);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors) => {
                console.error('Order submission errors:', errors);
                setValidationErrors(errors);
            }
        });
    };

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        if (isModalOpen) {
            setData('order_date', getTodayDate());
        }
    }, [isModalOpen]);

    useEffect(() => {
        if (data.delivery_mode === 'pick_up') {
            setData('delivery_rider_id', '');
        }
    }, [data.delivery_mode]);

    const getStatusBadge = (status: string) => {
        if (status === 'pending') {
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">● Pending</Badge>;
        } else if (status === 'out_for_delivery') {
            return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">● On Delivery</Badge>;
        } else if (status === 'completed') {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">● Completed</Badge>;
        } else if (status === 'cancelled') {
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">● Cancelled</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const handleStatusUpdate = (orderId: number, newStatus: string) => {
        router.patch(`/admin/orders/${orderId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
        });
    };

    // Archive order function
    const handleArchiveOrder = (order: Order) => {
        router.patch(`/admin/orders/${order.order_id}/archive`, {}, {
            preserveScroll: true,
        });
    };

    // Restore order from archive function
    const handleRestoreOrder = (order: Order) => {
        router.patch(`/admin/orders/${order.order_id}/restore`, {}, {
            preserveScroll: true,
        });
    };

    const handleViewReceipt = (order: Order) => {
        window.open(`/admin/orders/${order.order_id}/receipt`, '_blank', 'width=600,height=800,scrollbars=yes');
    };

    const handleViewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderDetailsModalOpen(true);
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
        });
    };

    const filteredOrders = orders.filter(order => {
        // Search filter
        const matchesSearch = searchTerm === '' || 
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_id.toString().includes(searchTerm) ||
            order.contact_number.includes(searchTerm) ||
            order.address.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        // Delivery mode filter
        const matchesDeliveryMode = deliveryModeFilter === 'all' || order.delivery_mode === deliveryModeFilter;

        // Size filter
        const matchesSize = sizeFilter === 'all' || order.size === sizeFilter;

        // Date range filter
        let matchesDateRange = true;
        if (dateFromFilter || dateToFilter) {
            const orderDate = new Date(order.order_date);
            if (dateFromFilter) {
                const fromDate = new Date(dateFromFilter);
                if (orderDate < fromDate) matchesDateRange = false;
            }
            if (dateToFilter) {
                const toDate = new Date(dateToFilter);
                if (orderDate > toDate) matchesDateRange = false;
            }
        }

        return matchesSearch && matchesStatus && matchesDeliveryMode && matchesSize && matchesDateRange;
    });

    // Filter archived orders using the same filters
    const filteredArchivedOrders = (archivedOrders || []).filter(order => {
        // Search filter
        const matchesSearch = searchTerm === '' || 
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_id.toString().includes(searchTerm) ||
            order.contact_number.includes(searchTerm) ||
            order.address.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter (only completed and cancelled orders should be in archives)
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        // Delivery mode filter
        const matchesDeliveryMode = deliveryModeFilter === 'all' || order.delivery_mode === deliveryModeFilter;

        // Size filter
        const matchesSize = sizeFilter === 'all' || order.size === sizeFilter;

        // Date range filter
        let matchesDateRange = true;
        if (dateFromFilter || dateToFilter) {
            const orderDate = new Date(order.order_date);
            if (dateFromFilter) {
                const fromDate = new Date(dateFromFilter);
                if (orderDate < fromDate) matchesDateRange = false;
            }
            if (dateToFilter) {
                const toDate = new Date(dateToFilter);
                if (orderDate > toDate) matchesDateRange = false;
            }
        }

        return matchesSearch && matchesStatus && matchesDeliveryMode && matchesSize && matchesDateRange;
    });

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDeliveryModeFilter('all');
        setSizeFilter('all');
        setDateFromFilter('');
        setDateToFilter('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Order - RDA Tube Ice" />
            
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
                                {user.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{user.name || 'Admin'}</div>
                                <div className="text-xs text-blue-200">{user.username || 'admin'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold md:hidden">
                            {user.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex relative">
                {/* Mobile Sidebar Overlay */}
                {isMobile && sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                {/* Sidebar - Hidden on mobile by default, shown on desktop */}
                <aside className="
                    w-64 bg-blue-600 text-white min-h-screen
                    hidden md:block
                ">
                    {/* Desktop sidebar content */}
                    <div className="p-6">
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4">Menu</h2>
                            <nav className="space-y-2">
                                <Link 
                                    href="/admin/dashboard" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link 
                                    href="/admin/point-of-sales" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>Order</span>
                                </Link>
                                <Link 
                                    href="/admin/inventory" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Inventory</span>
                                </Link>
                                <Link 
                                    href="/admin/employees" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Users className="w-5 h-5" />
                                    <span>Employees</span>
                                </Link>
                                <Link 
                                    href="/admin/equipment" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Equipment</span>
                                </Link>
                                <Link 
                                    href="/admin/sales-report" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Settings</span>
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
                                        href="/admin/dashboard" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link 
                                        href="/admin/point-of-sales" 
                                        className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>Order</span>
                                    </Link>
                                    <Link 
                                        href="/admin/inventory" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Package className="w-5 h-5" />
                                        <span>Inventory</span>
                                    </Link>
                                    <Link 
                                        href="/admin/employees" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Users className="w-5 h-5" />
                                        <span>Employees</span>
                                    </Link>
                                    <Link 
                                        href="/admin/equipment" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Settings className="w-5 h-5" />
                                        <span>Equipment</span>
                                    </Link>
                                    <Link 
                                        href="/admin/sales-report" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
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
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Settings className="w-5 h-5" />
                                        <span>Settings</span>
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
                <main className={`flex-1 p-4 md:p-8 ${isMobile ? 'w-full' : ''}`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">Order</h1>
                                <p className="text-blue-100 text-sm md:text-base">Manage and track Orders</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Order
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-lg shadow">
                        {/* Orders Section */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Orders</h3>
                            
                            {/* Tabs */}
                            <Tabs defaultValue="orders" className="mb-6">
                                <TabsList className="grid w-fit grid-cols-2">
                                    <TabsTrigger value="orders">Orders</TabsTrigger>
                                    <TabsTrigger value="archives">Archives</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="orders" className="mt-6">
                                    {/* Filters Section */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        <div className="flex flex-wrap gap-4 items-end">
                                            {/* Search */}
                                            <div className="flex-1 min-w-64">
                                                <Label className="text-sm font-medium mb-2 block">Search</Label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                    <Input
                                                        type="search"
                                                        placeholder="Search by customer, order ID, contact, or address"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Status</Label>
                                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Delivery Mode Filter */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Delivery Mode</Label>
                                                <Select value={deliveryModeFilter} onValueChange={setDeliveryModeFilter}>
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Modes</SelectItem>
                                                        <SelectItem value="pick_up">Pick Up</SelectItem>
                                                        <SelectItem value="deliver">Deliver</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Size Filter */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Size</Label>
                                                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sizes</SelectItem>
                                                        {[...new Set(inventory.map(item => item.size))].sort().map((size) => (
                                                            <SelectItem key={size} value={size}>
                                                                {size.charAt(0).toUpperCase() + size.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Date Range Filters */}
                                        <div className="flex gap-4 items-end mt-4">
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Date From</Label>
                                                <Input
                                                    type="date"
                                                    value={dateFromFilter}
                                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                                    className="w-40"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Date To</Label>
                                                <Input
                                                    type="date"
                                                    value={dateToFilter}
                                                    onChange={(e) => setDateToFilter(e.target.value)}
                                                    className="w-40"
                                                />
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                onClick={clearAllFilters}
                                                className="mb-0"
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                        
                                        {/* Results Counter */}
                                        <div className="mt-4 text-sm text-gray-600">
                                            Showing {filteredOrders.length} of {orders.length} orders
                                        </div>
                                    </div>

                                    {/* Orders Table */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="font-semibold">Status</TableHead>
                                                <TableHead className="font-semibold">Order ID</TableHead>
                                                <TableHead className="font-semibold">Customer</TableHead>
                                                <TableHead className="font-semibold">Address</TableHead>
                                                <TableHead className="font-semibold">Size</TableHead>
                                                <TableHead className="font-semibold">Quantity</TableHead>
                                                <TableHead className="font-semibold">Delivery Mode</TableHead>
                                                <TableHead className="font-semibold">Order Date</TableHead>
                                                <TableHead className="font-semibold">Total</TableHead>
                                                <TableHead className="font-semibold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredOrders.length > 0 ? (
                                                filteredOrders.map((order) => (
                                                    <TableRow key={order.order_id}>
                                                        <TableCell>
                                                            {getStatusBadge(order.status)}
                                                        </TableCell>
                                                        <TableCell className="font-medium">{order.order_id}</TableCell>
                                                        <TableCell>{order.customer_name}</TableCell>
                                                        <TableCell className="max-w-xs truncate" title={order.address}>{order.address}</TableCell>
                                                        <TableCell className="capitalize">{order.size}</TableCell>
                                                        <TableCell>{order.quantity}</TableCell>
                                                        <TableCell className="capitalize">{order.delivery_mode.replace('_', ' ')}</TableCell>
                                                        <TableCell>{formatDate(order.order_date)}</TableCell>
                                                        <TableCell className="font-medium">₱{order.total.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {order.status === 'pending' && (
                                                                        <>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleViewOrderDetails(order)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                                                                View Details
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                                                Mark as Completed
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusUpdate(order.order_id, 'cancelled')}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <X className="h-4 w-4 mr-2 text-red-600" />
                                                                                Mark as Cancelled
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                    {order.status === 'out_for_delivery' && (
                                                                        <>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleViewOrderDetails(order)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                                                                View Details
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem 
                                                                                className="cursor-pointer"
                                                                                onClick={() => handleViewReceipt(order)}
                                                                            >
                                                                                <Printer className="h-4 w-4 mr-2 text-blue-600" />
                                                                                View Receipt
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                                                Mark as Completed
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusUpdate(order.order_id, 'cancelled')}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <X className="h-4 w-4 mr-2 text-red-600" />
                                                                                Mark as Cancelled
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                    {(order.status === 'completed' || order.status === 'cancelled') && (
                                                                        <>
                                                                            <DropdownMenuItem 
                                                                                className="cursor-pointer"
                                                                                onClick={() => handleViewReceipt(order)}
                                                                            >
                                                                                <Printer className="h-4 w-4 mr-2 text-blue-600" />
                                                                                View Receipt
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem 
                                                                                className="cursor-pointer"
                                                                                onClick={() => handleArchiveOrder(order)}
                                                                            >
                                                                                <Archive className="h-4 w-4 mr-2 text-gray-600" />
                                                                                Archive Order
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                                        No orders found matching the current filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                                
                                <TabsContent value="archives" className="mt-6">
                                    {/* Filters Section for Archives */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        <div className="flex flex-wrap gap-4 items-end">
                                            {/* Search */}
                                            <div className="flex-1 min-w-64">
                                                <Label className="text-sm font-medium mb-2 block">Search</Label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                    <Input
                                                        type="search"
                                                        placeholder="Search by customer, order ID, contact, or address"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Status</Label>
                                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Delivery Mode Filter */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Delivery Mode</Label>
                                                <Select value={deliveryModeFilter} onValueChange={setDeliveryModeFilter}>
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Modes</SelectItem>
                                                        <SelectItem value="pick_up">Pick Up</SelectItem>
                                                        <SelectItem value="deliver">Deliver</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Size Filter */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Size</Label>
                                                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sizes</SelectItem>
                                                        {[...new Set(inventory.map(item => item.size))].sort().map((size) => (
                                                            <SelectItem key={size} value={size}>
                                                                {size.charAt(0).toUpperCase() + size.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Date Range Filters */}
                                        <div className="flex gap-4 items-end mt-4">
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Date From</Label>
                                                <Input
                                                    type="date"
                                                    value={dateFromFilter}
                                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                                    className="w-40"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Date To</Label>
                                                <Input
                                                    type="date"
                                                    value={dateToFilter}
                                                    onChange={(e) => setDateToFilter(e.target.value)}
                                                    className="w-40"
                                                />
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                onClick={clearAllFilters}
                                                className="mb-0"
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                        
                                        {/* Results Counter */}
                                        <div className="mt-4 text-sm text-gray-600">
                                            Showing {filteredArchivedOrders.length} of {(archivedOrders || []).length} archived orders
                                        </div>
                                    </div>

                                    {filteredArchivedOrders.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No archived orders found matching the current filters.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Archived Orders Table */}
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="font-semibold">Status</TableHead>
                                                        <TableHead className="font-semibold">Order ID</TableHead>
                                                        <TableHead className="font-semibold">Customer</TableHead>
                                                        <TableHead className="font-semibold">Address</TableHead>
                                                        <TableHead className="font-semibold">Size</TableHead>
                                                        <TableHead className="font-semibold">Quantity</TableHead>
                                                        <TableHead className="font-semibold">Delivery Mode</TableHead>
                                                        <TableHead className="font-semibold">Order Date</TableHead>
                                                        <TableHead className="font-semibold">Total</TableHead>
                                                        <TableHead className="font-semibold">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredArchivedOrders.map((order) => (
                                                        <TableRow key={order.order_id} className="hover:bg-gray-50 bg-gray-50">
                                                            <TableCell>
                                                                {getStatusBadge(order.status)}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-gray-600">{order.order_id}</TableCell>
                                                            <TableCell className="text-gray-600">{order.customer_name}</TableCell>
                                                            <TableCell className="max-w-xs truncate text-gray-600" title={order.address}>{order.address}</TableCell>
                                                            <TableCell className="capitalize text-gray-600">{order.size}</TableCell>
                                                            <TableCell className="text-gray-600">{order.quantity}</TableCell>
                                                            <TableCell className="capitalize text-gray-600">{order.delivery_mode.replace('_', ' ')}</TableCell>
                                                            <TableCell className="text-gray-600">{formatDate(order.order_date)}</TableCell>
                                                            <TableCell className="font-medium text-gray-600">₱{order.total.toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem 
                                                                            className="cursor-pointer"
                                                                            onClick={() => handleViewReceipt(order)}
                                                                        >
                                                                            <Printer className="h-4 w-4 mr-2 text-blue-600" />
                                                                            View Receipt
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRestoreOrder(order)}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
                                                                            Restore Order
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Order Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="!max-w-[1400px] !w-[98vw] max-h-[95vh] overflow-y-auto p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-bold">Create New Order</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Order Form */}
                        <div className="lg:col-span-2">
                            {/* Display server-side errors */}
                            {Object.keys(errors).length > 0 && (
                                <Alert className="mb-6 border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-800">
                                        <strong>Please fix the following errors:</strong>
                                        <ul className="mt-2 list-disc list-inside">
                                            {Object.entries(errors).map(([field, error]) => (
                                                <li key={field}>{Array.isArray(error) ? error[0] : error}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Customer Name */}
                                <div className="space-y-3">
                                    <Label htmlFor="customer_name" className="text-base font-medium">Customer Name</Label>
                                    <Input
                                        id="customer_name"
                                        type="text"
                                        placeholder="Enter customer name"
                                        value={data.customer_name}
                                        onChange={(e) => setData('customer_name', e.target.value)}
                                        className={`w-full h-12 text-base ${validationErrors.customer_name || errors.customer_name ? 'border-red-500' : ''}`}
                                    />
                                    {(validationErrors.customer_name || errors.customer_name) && (
                                        <p className="text-sm text-red-600">
                                            {validationErrors.customer_name || (Array.isArray(errors.customer_name) ? errors.customer_name[0] : errors.customer_name)}
                                        </p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="space-y-3">
                                    <Label htmlFor="address" className="text-base font-medium">Address</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        placeholder="Enter customer address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className={`w-full h-12 text-base ${validationErrors.address || errors.address ? 'border-red-500' : ''}`}
                                    />
                                    {(validationErrors.address || errors.address) && (
                                        <p className="text-sm text-red-600">
                                            {validationErrors.address || (Array.isArray(errors.address) ? errors.address[0] : errors.address)}
                                        </p>
                                    )}
                                </div>

                                {/* Contact No */}
                                <div className="space-y-3">
                                    <Label htmlFor="contact_number" className="text-base font-medium">Contact No. <span className="text-sm text-gray-500">(11 digits)</span></Label>
                                    <Input
                                        id="contact_number"
                                        type="tel"
                                        placeholder="09123456789"
                                        value={data.contact_number}
                                        onChange={(e) => {
                                            // Only allow numeric input and limit to 11 digits
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            setData('contact_number', value);
                                        }}
                                        className={`w-full h-12 text-base ${validationErrors.contact_number || errors.contact_number ? 'border-red-500' : ''}`}
                                        maxLength={11}
                                    />
                                    {(validationErrors.contact_number || errors.contact_number) && (
                                        <p className="text-sm text-red-600">
                                            {validationErrors.contact_number || (Array.isArray(errors.contact_number) ? errors.contact_number[0] : errors.contact_number)}
                                        </p>
                                    )}
                                </div>

                                {/* Quantity and Size Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="quantity" className="text-base font-medium">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            placeholder="Enter quantity"
                                            value={data.quantity}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setData('quantity', value);
                                                
                                                // Clear
                                                if (data.size && value) {
                                                    const requestedQuantity = parseInt(value);
                                                    const selectedItem = inventory.find(item => item.size === data.size);
                                                    if (selectedItem && selectedItem.quantity < requestedQuantity) {
                                                        setData('size', '');
                                                    }
                                                }
                                            }}
                                            className={`w-full h-12 text-base ${validationErrors.quantity || errors.quantity ? 'border-red-500' : ''}`}
                                        />
                                        {(validationErrors.quantity || errors.quantity) && (
                                            <p className="text-sm text-red-600">
                                                {validationErrors.quantity || (Array.isArray(errors.quantity) ? errors.quantity[0] : errors.quantity)}
                                            </p>
                                        )}
                                        {isQuantityTooHigh && !validationErrors.quantity && !errors.quantity && (
                                            <p className="text-sm text-amber-600">
                                                ⚠️ Quantity exceeds all available stock. Maximum available: {maxStock}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="size" className="text-base font-medium">Size</Label>
                                        {Array.isArray(availableItems) ? (
                                            <Select 
                                                value={availableItems.length > 0 ? data.size : ""} 
                                                onValueChange={(value) => {
                                                    if (value && value !== "" && value !== "no-stock") {
                                                        setData('size', value);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={`w-full h-12 text-base ${validationErrors.size || errors.size ? 'border-red-500' : ''}`}>
                                                    <SelectValue 
                                                        placeholder={
                                                            availableItems.length === 0 
                                                                ? (data.quantity ? `No sizes have enough stock for quantity ${data.quantity}` : 'No sizes available in stock')
                                                                : "Select size"
                                                        } 
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableItems.length > 0 ? (
                                                        availableItems.map((item) => (
                                                            <SelectItem key={item.size} value={item.size}>
                                                                {item.size.charAt(0).toUpperCase() + item.size.slice(1)} - ₱{item.price} (Stock: {item.quantity})
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-stock" disabled>
                                                            {data.quantity ? `No sizes have enough stock for quantity ${data.quantity}` : 'No sizes available in stock'}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="w-full h-12 text-base border border-gray-300 rounded-md flex items-center px-3 bg-gray-100">
                                                <span className="text-gray-500">Loading sizes...</span>
                                            </div>
                                        )}
                                        {(validationErrors.size || errors.size) && (
                                            <p className="text-sm text-red-600">
                                                {validationErrors.size || (Array.isArray(errors.size) ? errors.size[0] : errors.size)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Date Row */}
                                <div className="space-y-3">
                                    <Label className="text-base font-medium">Date</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="order_date" className="text-sm text-gray-600">Order Date</Label>
                                            <Input
                                                id="order_date"
                                                type="date"
                                                placeholder="00/00/00"
                                                value={data.order_date}
                                                onChange={(e) => setData('order_date', e.target.value)}
                                                className={`w-full h-12 text-base bg-gray-100 ${validationErrors.order_date || errors.order_date ? 'border-red-500' : ''}`}
                                                readOnly
                                            />
                                            {(validationErrors.order_date || errors.order_date) && (
                                                <p className="text-sm text-red-600">
                                                    {validationErrors.order_date || (Array.isArray(errors.order_date) ? errors.order_date[0] : errors.order_date)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="delivery_date" className="text-sm text-gray-600">Delivery Date</Label>
                                            <Input
                                                id="delivery_date"
                                                type="date"
                                                placeholder="00/00/00"
                                                value={data.delivery_date}
                                                onChange={(e) => setData('delivery_date', e.target.value)}
                                                className={`w-full h-12 text-base ${validationErrors.delivery_date || errors.delivery_date ? 'border-red-500' : ''}`}
                                                min={getTodayDate()}
                                            />
                                            {(validationErrors.delivery_date || errors.delivery_date) && (
                                                <p className="text-sm text-red-600">
                                                    {validationErrors.delivery_date || (Array.isArray(errors.delivery_date) ? errors.delivery_date[0] : errors.delivery_date)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mode of Delivery */}
                                <div className="space-y-3">
                                    <Label className="text-base font-medium">Mode of Delivery</Label>
                                    <RadioGroup 
                                        value={data.delivery_mode} 
                                        onValueChange={(value) => setData('delivery_mode', value)}
                                        className="flex flex-col space-y-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="pick_up" id="pick_up" className="w-5 h-5" />
                                            <Label htmlFor="pick_up" className="cursor-pointer text-base">Pick up</Label>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="deliver" id="deliver" className="w-5 h-5" />
                                            <Label htmlFor="deliver" className="cursor-pointer text-base">Deliver</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Delivery Rider Selection */}
                                {data.delivery_mode === 'deliver' && (
                                    <div className="space-y-3">
                                        <Label htmlFor="delivery_rider" className="text-base font-medium">
                                            Select Delivery Rider <span className="text-red-500">*</span>
                                        </Label>
                                        <Select 
                                            value={data.delivery_rider_id} 
                                            onValueChange={(value) => setData('delivery_rider_id', value)}
                                        >
                                            <SelectTrigger className={`w-full h-12 text-base ${validationErrors.delivery_rider_id || errors.delivery_rider_id ? 'border-red-500' : ''}`}>
                                                <SelectValue placeholder="Choose a delivery rider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {deliveryRiders.length > 0 ? (
                                                    deliveryRiders.map((rider) => (
                                                        <SelectItem key={rider.id} value={rider.id.toString()}>
                                                            {rider.name} - {rider.position}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="" disabled>
                                                        No delivery riders available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {(validationErrors.delivery_rider_id || errors.delivery_rider_id) && (
                                            <p className="text-sm text-red-600">
                                                {validationErrors.delivery_rider_id || (Array.isArray(errors.delivery_rider_id) ? errors.delivery_rider_id[0] : errors.delivery_rider_id)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-end pt-6 space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 text-base"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create Order
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Order Details Preview */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-6">Order Preview</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-base font-medium">Customer Name</Label>
                                    <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                        {data.customer_name || 'Name'}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium">Address</Label>
                                    <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                        {data.address || 'Address'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-base font-medium">Quantity</Label>
                                        <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                            {data.quantity || 'Quantity'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-base font-medium">Size</Label>
                                        <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                            {data.size || 'Size'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium">Date</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <div className="text-sm text-gray-500">Order Date</div>
                                            <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                                {data.order_date || '00/00/00'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Delivery Date</div>
                                            <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                                {data.delivery_date || '00/00/00'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium">Mode of Delivery</Label>
                                    <div className="text-base text-gray-600 mt-2">
                                        <div className="flex items-center space-x-3 mt-2">
                                            <div className={`w-3 h-3 rounded-full ${data.delivery_mode === 'pick_up' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                            <span className={`text-base ${data.delivery_mode === 'pick_up' ? 'font-medium' : ''}`}>Pick up</span>
                                        </div>
                                        <div className={`flex items-center space-x-3 mt-2`}>
                                            <div className={`w-3 h-3 rounded-full ${data.delivery_mode === 'deliver' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                            <span className={`text-base ${data.delivery_mode === 'deliver' ? 'font-medium' : ''}`}>Deliver</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <Alert className="bg-green-50 border-green-200 shadow-lg">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 font-medium">
                            Order created successfully!
                        </AlertDescription>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-green-600 hover:text-green-800"
                            onClick={() => setShowSuccess(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Alert>
                </div>
            )}

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
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                                <path d="M3 4a1 1 0 011-1h1a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM7.268 3.092a1 1 0 011.464 0l2.268 2.268a1 1 0 010 1.414L8.732 9.042a1 1 0 01-1.464 0L5 6.774a1 1 0 010-1.414l2.268-2.268z"/>
                                            </svg>
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
                                    <>
                                        <Button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder.order_id, 'out_for_delivery');
                                                setIsOrderDetailsModalOpen(false);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            size="sm"
                                        >
                                            <Truck className="h-4 w-4 mr-2" />
                                            Mark as On Delivery
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder.order_id, 'completed');
                                                setIsOrderDetailsModalOpen(false);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Mark as Completed
                                        </Button>
                                    </>
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