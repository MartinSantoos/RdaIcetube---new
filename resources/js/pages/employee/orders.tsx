import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Package, ShoppingCart, User, LogOut, Eye, Check, Truck, Search, Filter, Calendar, MoreHorizontal, Menu, X, Camera, Upload, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    delivery_photo?: string;
}

interface InventoryItem {
    size: string;
    price: number;
    status: string;
    quantity: number;
}

interface EmployeeOrdersProps {
    user: User;
    orders: Order[];
    inventory: InventoryItem[];
}

export default function EmployeeOrders({ user, orders, inventory = [] }: EmployeeOrdersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
    const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);
    const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Cleanup camera stream on component unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    // Set video stream when camera is active
    useEffect(() => {
        const video = document.getElementById('camera-video') as HTMLVideoElement;
        if (video && cameraStream) {
            video.srcObject = cameraStream;
        }
    }, [cameraStream, isCameraActive]);

    const { data, setData, post, processing, errors, reset } = useForm({
        customer_name: '',
        address: '',
        contact_number: '',
        quantity: '',
        size: '',
        order_date: getTodayDate(),
        delivery_date: '',
        delivery_mode: 'deliver', // Default to deliver for employees
        delivery_rider_id: user.id.toString(), // Set current employee as delivery rider
    });

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

    const handleViewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderDetailsModalOpen(true);
    };

    const handleCompleteOrder = (order: Order) => {
        setOrderToComplete(order);
        setIsPhotoUploadModalOpen(true);
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = async () => {
        try {
            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                // Fallback to file input if camera is not supported
                const cameraInput = document.getElementById('photo-camera') as HTMLInputElement;
                if (cameraInput) {
                    cameraInput.value = '';
                    cameraInput.click();
                }
                return;
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Use rear camera on mobile
                } 
            });
            
            setCameraStream(stream);
            setIsCameraActive(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            // Fallback to file input if camera access fails
            const cameraInput = document.getElementById('photo-camera') as HTMLInputElement;
            if (cameraInput) {
                cameraInput.value = '';
                cameraInput.click();
            }
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        const video = document.getElementById('camera-video') as HTMLVideoElement;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (video && context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setSelectedPhoto(file);
                    setPhotoPreview(canvas.toDataURL());
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const handleFileUpload = () => {
        // Reset the file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    };

    const handlePhotoUpload = async () => {
        if (!selectedPhoto || !orderToComplete) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('delivery_photo', selectedPhoto);

            // Use Inertia's router.post with FormData to handle CSRF properly
            router.post(`/employee/orders/${orderToComplete.order_id}/complete-with-photo`, formData, {
                forceFormData: true,
                onSuccess: () => {
                    // Reset modal state
                    setIsPhotoUploadModalOpen(false);
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                    setOrderToComplete(null);
                    
                    // Success message will be handled by backend flash message
                    alert('Order completed successfully with delivery photo!');
                },
                onError: (errors) => {
                    console.error('Upload failed:', errors);
                    alert('Failed to upload photo and complete order. Please try again.');
                },
                onFinish: () => {
                    setIsUploading(false);
                }
            });
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('An error occurred while uploading the photo. Please try again.');
            setIsUploading(false);
        }
    };

    const closePhotoModal = () => {
        stopCamera(); // Stop camera if active
        setIsPhotoUploadModalOpen(false);
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setOrderToComplete(null);
        setIsCameraActive(false);
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

    // Available items calculation
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

    // Form validation
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
            }
        }
        
        return errors;
    };

    // Form submission
    const handleCreateOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        setValidationErrors({});
        
        const errors = validateForm();
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        
        post('/employee/orders', {
            onSuccess: () => {
                reset();
                setValidationErrors({});
                setShowSuccess(true);
                setIsCreateOrderModalOpen(false);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors) => {
                setValidationErrors(errors);
            }
        });
    };

    // Effects
    useEffect(() => {
        if (data.delivery_mode === 'pick_up') {
            setData('delivery_rider_id', '');
        } else {
            setData('delivery_rider_id', user.id.toString());
        }
    }, [data.delivery_mode, user.id]);

    useEffect(() => {
        if (isCreateOrderModalOpen) {
            setData('order_date', getTodayDate());
            setData('delivery_rider_id', user.id.toString());
        }
    }, [isCreateOrderModalOpen, user.id]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

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
                            <Button
                                onClick={() => setIsCreateOrderModalOpen(true)}
                                className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 md:px-6 md:py-3"
                            >
                                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                <span className="hidden md:inline">Create Order</span>
                                <span className="md:hidden">Create</span>
                            </Button>
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
                                            <TableHead>Delivery Date</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
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
                                                        <span className="capitalize">
                                                            {order.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{formatDate(order.order_date)}</TableCell>
                                                    <TableCell>{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</TableCell>
                                                    <TableCell className="font-semibold">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</TableCell>
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
                                                                        onClick={() => handleCompleteOrder(order)}
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
                                                    <span className="font-medium capitalize">
                                                        {order.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Order Date:</span>
                                                    <span className="font-medium">{formatDate(order.order_date)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Delivery Date:</span>
                                                    <span className="font-medium">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="font-bold text-lg">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</span>
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
                                                        onClick={() => handleCompleteOrder(order)}
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
                                        <span className="text-xs text-gray-500">Delivery Date</span>
                                        <p className="font-semibold text-sm">{selectedOrder.delivery_date ? formatDate(selectedOrder.delivery_date) : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Total</span>
                                        <p className="font-semibold text-base">₱{selectedOrder.total ? parseFloat(selectedOrder.total.toString()).toFixed(2) : '0.00'}</p>
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

                            {/* Delivery Photo Section */}
                            {selectedOrder.delivery_photo && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <h3 className="text-base font-semibold mb-2 text-center text-green-600">Delivery Confirmation</h3>
                                    <div className="text-center">
                                        <img 
                                            src={`/storage/${selectedOrder.delivery_photo}`}
                                            alt="Delivery confirmation photo"
                                            className="max-w-full h-48 object-cover mx-auto rounded-lg shadow-md"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Photo taken at delivery completion
                                        </p>
                                    </div>
                                </div>
                            )}

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
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Photo Upload Modal */}
            <Dialog open={isPhotoUploadModalOpen} onOpenChange={setIsPhotoUploadModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold flex items-center">
                            <Camera className="mr-2 h-5 w-5" />
                            Complete Delivery
                        </DialogTitle>
                    </DialogHeader>
                    
                    {orderToComplete && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">Order ID:</p>
                                <p className="font-semibold">#{orderToComplete.order_id}</p>
                                <p className="text-sm text-gray-600 mt-1">Customer:</p>
                                <p className="font-semibold">{orderToComplete.customer_name}</p>
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-3">
                                    Please take a photo of the delivered product to complete this order
                                </p>
                                
                                {/* Photo Upload Area */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                                    {photoPreview ? (
                                        <div className="space-y-3">
                                            <img 
                                                src={photoPreview} 
                                                alt="Delivery photo preview" 
                                                className="max-w-full h-32 object-cover mx-auto rounded-lg"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedPhoto(null);
                                                    setPhotoPreview(null);
                                                }}
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Remove Photo
                                            </Button>
                                        </div>
                                    ) : isCameraActive ? (
                                        <div className="space-y-3">
                                            <video
                                                id="camera-video"
                                                autoPlay
                                                playsInline
                                                className="w-full max-w-sm mx-auto rounded-lg bg-black"
                                                style={{ maxHeight: '300px' }}
                                            />
                                            <div className="flex gap-3 justify-center">
                                                <Button
                                                    type="button"
                                                    onClick={capturePhoto}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Capture Photo
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={stopCamera}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                            <p className="text-sm text-gray-600 mb-4">
                                                Choose how to add a photo of the delivered product
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                {/* Take Photo Button */}
                                                <Button
                                                    type="button"
                                                    onClick={handleCameraCapture}
                                                    className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                                                >
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Take Photo with Camera
                                                </Button>
                                                <Input
                                                    id="photo-camera"
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={handlePhotoChange}
                                                    className="hidden"
                                                />
                                                
                                                {/* Upload Photo Button */}
                                                <Button
                                                    type="button"
                                                    onClick={handleFileUpload}
                                                    className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Upload from Gallery
                                                </Button>
                                                <Input
                                                    id="photo-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={closePhotoModal}
                                    className="flex-1"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePhotoUpload}
                                    disabled={!selectedPhoto || isUploading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Complete Order
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Order Modal */}
            <Dialog open={isCreateOrderModalOpen} onOpenChange={setIsCreateOrderModalOpen}>
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
                            
                            <form onSubmit={handleCreateOrderSubmit} className="space-y-6">
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
                                                
                                                // Clear size if quantity changes and no longer sufficient
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
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="size" className="text-base font-medium">Size</Label>
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
                                            <div className="relative">
                                                <Input
                                                    id="delivery_date"
                                                    type="date"
                                                    placeholder="dd/mm/yyyy"
                                                    value={data.delivery_date}
                                                    onChange={(e) => setData('delivery_date', e.target.value)}
                                                    className={`w-full h-12 text-base pr-10 ${validationErrors.delivery_date || errors.delivery_date ? 'border-red-500' : ''}`}
                                                    min={getTodayDate()}
                                                />
                                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                            </div>
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

                                {/* Submit Button */}
                                <div className="flex justify-end pt-6 space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOrderModalOpen(false)}
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

                                {/* Show who will be the delivery rider */}
                                {data.delivery_mode === 'deliver' && (
                                    <div>
                                        <Label className="text-base font-medium">Delivery Rider</Label>
                                        <div className="text-base text-gray-600 bg-white p-3 rounded border">
                                            {user.name} (You)
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
        </div>
    );
}