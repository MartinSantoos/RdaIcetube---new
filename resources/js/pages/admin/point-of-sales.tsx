import { Head, Link, useForm, router } from '@inertiajs/react';
import { Search, Download, BarChart3,Cog, Package, Settings, ShoppingCart, MoreHorizontal, Check, X, Archive, Plus, Users, Printer, LogOut, Truck, Eye, RotateCcw, Menu, Calendar, Trash2, AlertTriangle, Monitor } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/enhanced/status-badge';
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
    DialogDescription,
    DialogFooter,
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
    delivery_photo?: string;
    delivery_rider_id?: number;
    completed_by?: string;
    cancellation_reason?: string;
    cancelled_at?: string;
    deliveryRider?: {
        id: number;
        name: string;
        position?: string;
    };
    delivery_rider?: {
        id: number;
        name: string;
        position?: string;
    };
    formatted_order_id?: string;
}

interface DeliveryRider {
    id: number;
    name: string;
    position: string;
}

interface InventoryItem {
    product_name: string;
    size: string;
    price: number;
    status: string;
    quantity: number;
    archived_at?: string | null; // Add archived field
    formatted_inventory_id?: string;
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deliveryModeFilter, setDeliveryModeFilter] = useState('all');
    const [sizeFilter, setSizeFilter] = useState('all');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState<{customer_name: string, address: string, contact_number: string}[]>([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [dateToFilter, setDateToFilter] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [pendingOrdersWarning, setPendingOrdersWarning] = useState<{open: boolean, order: Order | null, pendingCount: number}>({
        open: false,
        order: null,
        pendingCount: 0
    });
    const isMobile = useIsMobile();
    
    // CSS for custom radio button styling
    const radioButtonStyles = `
        .custom-radio {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #d1d5db;
            background-color: white;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .custom-radio:checked {
            border-color: #3b82f6;
            background-color: #3b82f6;
        }
        
        .custom-radio:checked::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: white;
        }
        
        .custom-radio:focus {
            outline: none;
            box-shadow: 0 0 0 2px #3b82f6;
        }
    `;
    
    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        router.post('/logout');
    };

    const cancelLogout = () => {
        setIsLogoutModalOpen(false);
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getPhilippinesDate = () => {
        // Get current time in Philippines (UTC+8)
        const now = new Date();
        const philippinesTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for UTC+8
        
        // Get hours in Philippines time (0-23)
        const hours = philippinesTime.getUTCHours();
        
        // Business Logic:
        // If current time < 2:00 AM (hours 0-1), use yesterday's date
        // If current time >= 2:00 AM (hours 2-23), use today's date
        if (hours < 2) {
            // Use previous day if before 2:00 AM (hours 0 or 1)
            const previousDay = new Date(philippinesTime.getTime() - (24 * 60 * 60 * 1000));
            return previousDay.toISOString().split('T')[0];
        } else {
            // Use today's date for 2:00 AM and later
            return philippinesTime.toISOString().split('T')[0];
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        customer_name: '',
        address: '',
        contact_number: '',
        quantity: '',
        size: '',
        order_date: getPhilippinesDate(),
        delivery_date: '',
        delivery_mode: 'pick_up',
        delivery_rider_id: '',
    });

    // Monitor time and update order date at 2:00 AM Philippines time
    useEffect(() => {
        const updateOrderDate = () => {
            const newDate = getPhilippinesDate();
            if (data.order_date !== newDate) {
                setData('order_date', newDate);
            }
        };

        // Update immediately
        updateOrderDate();

        // Set up interval to check every minute
        const interval = setInterval(updateOrderDate, 60000);

        return () => clearInterval(interval);
    }, [data.order_date, setData]);

    // Clear selected size
    useEffect(() => {
        if (data.quantity && data.size) {
            const requestedQuantity = parseInt(data.quantity);
            // Parse the selected value to get product_name and size (split on last hyphen)
            const lastHyphenIndex = data.size.lastIndexOf('-');
            const productName = lastHyphenIndex > -1 ? data.size.substring(0, lastHyphenIndex) : '';
            const size = lastHyphenIndex > -1 ? data.size.substring(lastHyphenIndex + 1) : data.size;
            const selectedItem = inventory.find(item => 
                item.product_name === productName && item.size === size
            );
            
            if (selectedItem && selectedItem.quantity < requestedQuantity) {
                setData('size', '');
            }
        }
    }, [data.quantity, data.size, inventory]);

    // Check if quantity exceeds all available stock
    const isQuantityTooHigh = useMemo(() => {
        if (!data.quantity || !inventory || !Array.isArray(inventory)) return false;
        
        const availableInventory = inventory.filter(item => item && item.quantity > 0);
        if (availableInventory.length === 0) return false;
        
        const requestedQuantity = parseInt(data.quantity);
        if (isNaN(requestedQuantity)) return false;
        
        const maxStock = Math.max(...availableInventory.map(item => item.quantity));
        return requestedQuantity > maxStock;
    }, [data.quantity, inventory]);

    // get maximum available stock
    const maxStock = useMemo(() => {
        if (!inventory || !Array.isArray(inventory)) return 0;
        
        const availableInventory = inventory.filter(item => item && item.status === 'available' && item.quantity >= 0 && !item.archived_at);
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
                const items = inventory.filter(item => item && (item.status === 'available' || item.status === 'critical') && item.quantity >= 0 && !item.archived_at) || [];
                // Group by product_name + size combination to allow different products with same size
                const uniqueItems = new Map();
                items.forEach(item => {
                    const key = `${item.product_name}-${item.size}`;
                    if (!uniqueItems.has(key)) {
                        uniqueItems.set(key, item);
                    }
                });
                return Array.from(uniqueItems.values());
            }
            
            const requestedQuantity = parseInt(data.quantity);
            if (isNaN(requestedQuantity) || requestedQuantity <= 0) return [];
            
            const filtered = inventory.filter(item => {
                return item && 
                       (item.status === 'available' || item.status === 'critical') && 
                       item.quantity >= 0 && 
                       item.quantity >= requestedQuantity &&
                       !item.archived_at; // Exclude archived items
            }) || [];
            
            // Group by product_name + size combination to allow different products with same size
            const uniqueItems = new Map();
            filtered.forEach(item => {
                const key = `${item.product_name}-${item.size}`;
                if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, item);
                }
            });
            
            return Array.from(uniqueItems.values());
        } catch (error) {
            console.error('Error in availableItems calculation:', error);
            return [];
        }
    }, [inventory, data.quantity]);

    // Get unique customers from previous orders
    const uniqueCustomers = useMemo(() => {
        if (!orders || !Array.isArray(orders)) return [];
        
        const customerMap = new Map();
        orders.forEach(order => {
            if (order.customer_name && order.address && order.contact_number) {
                const key = order.customer_name.toLowerCase();
                if (!customerMap.has(key)) {
                    customerMap.set(key, {
                        customer_name: order.customer_name,
                        address: order.address,
                        contact_number: order.contact_number
                    });
                }
            }
        });
        
        return Array.from(customerMap.values()).sort((a, b) => 
            a.customer_name.localeCompare(b.customer_name)
        );
    }, [orders]);

    // Filter customer suggestions based on input
    const filteredCustomerSuggestions = useMemo(() => {
        if (!data.customer_name || data.customer_name.length < 2) return [];
        
        return uniqueCustomers.filter(customer =>
            customer.customer_name.toLowerCase().includes(data.customer_name.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions
    }, [uniqueCustomers, data.customer_name]);

    // Calculate total based on selected size and quantity
    const calculatedTotal = useMemo(() => {
        if (!data.size || !data.quantity || !inventory) return 0;
        
        const quantity = parseInt(data.quantity);
        if (isNaN(quantity) || quantity <= 0) return 0;
        
        // Parse the selected size to get product name and size
        const lastHyphenIndex = data.size.lastIndexOf('-');
        const productName = lastHyphenIndex > -1 ? data.size.substring(0, lastHyphenIndex) : '';
        const size = lastHyphenIndex > -1 ? data.size.substring(lastHyphenIndex + 1) : data.size;
        
        // Find the inventory item to get the price
        const selectedItem = inventory.find(item => 
            item.product_name === productName && item.size === size
        );
        
        if (selectedItem && selectedItem.price) {
            return quantity * selectedItem.price;
        }
        
        return 0;
    }, [data.size, data.quantity, inventory]);

    // Handle customer selection from suggestions
    const handleCustomerSelect = (customer: {customer_name: string, address: string, contact_number: string}) => {
        setData({
            ...data,
            customer_name: customer.customer_name,
            address: customer.address,
            contact_number: customer.contact_number
        });
        setShowCustomerSuggestions(false);
    };

    // Handle customer name input change
    const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('customer_name', value);
        setShowCustomerSuggestions(value.length >= 2);
    };

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
        
        if (data.delivery_mode === 'deliver' && !data.delivery_rider_id.trim()) {
            errors.delivery_rider_id = 'Please select a delivery rider for delivery orders';
        }
        
        return errors;
    };

    // Handle modal close - reset form when modal is closed
    const handleModalOpenChange = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            // Reset form data when closing modal
            reset();
            // Set default values after reset
            setData({
                customer_name: '',
                address: '',
                contact_number: '',
                quantity: '',
                size: '',
                order_date: getPhilippinesDate(),
                delivery_date: '',
                delivery_mode: 'pick_up',
                delivery_rider_id: '',
            });
            // Clear validation errors and customer suggestions
            setValidationErrors({});
            setShowCustomerSuggestions(false);
            setCustomerSuggestions([]);
        } else {
            // When opening modal, ensure order date is set to current Philippines date
            const currentDate = getPhilippinesDate();
            setData('order_date', currentDate);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        setValidationErrors({});
        
        const errors = validateForm();
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        // Extract just the size from the combined product_name-size value (split on last hyphen)
        const lastHyphenIndex = data.size.lastIndexOf('-');
        const productName = lastHyphenIndex > -1 ? data.size.substring(0, lastHyphenIndex) : '';
        const size = lastHyphenIndex > -1 ? data.size.substring(lastHyphenIndex + 1) : data.size;
        
        // Create submit data with just the size
        const submitData = {
            ...data,
            size: size
        };
        
        // Submit the form with the corrected size
        router.post('/admin/orders', submitData, {
            onSuccess: () => {
                reset();
                setValidationErrors({});
                setShowSuccess(true);
                setIsModalOpen(false);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors: any) => {
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
            setData('order_date', getPhilippinesDate());
        }
    }, [isModalOpen, setData]);

    useEffect(() => {
        if (data.delivery_mode === 'pick_up') {
            setData('delivery_rider_id', '');
        }
    }, [data.delivery_mode]);

    // Enhanced status badge using StatusBadge component
    const getStatusBadge = (status: string) => {
        return <StatusBadge status={status} size="sm" />;
    };

    // Check if user can complete a delivery order
    const canCompleteDeliveryOrder = (order: Order) => {
        // For pickup orders, any admin or employee can complete them
        if (order.delivery_mode === 'pick_up') {
            return true;
        }
        
        // For delivery orders, only the assigned delivery rider can complete it
        // Admin (user_type 0 or 1) cannot complete delivery orders
        if (user.user_type === 0 || user.user_type === 1) {
            return false;
        }
        
        // Employee (user_type 2) can only complete delivery orders if they are the assigned delivery rider
        return order.delivery_rider_id === user.id;
    };

    const handleStatusUpdate = (orderId: number, newStatus: string) => {
        console.log('Attempting to update order:', orderId, 'to status:', newStatus);
        
        // If trying to complete an order, check permissions
        if (newStatus === 'completed') {
            const order = orders.find(o => o.order_id === orderId);
            console.log('Order found:', order);
            console.log('Can complete:', order ? canCompleteDeliveryOrder(order) : 'no order');
            if (order && !canCompleteDeliveryOrder(order)) {
                // Show error message or prevent action
                alert('Only the assigned delivery rider can complete delivery orders.');
                return;
            }
        }
        
        // If cancelling an order, open cancellation modal
        if (newStatus === 'cancelled') {
            const order = orders.find(o => o.order_id === orderId);
            if (order) {
                setOrderToCancel(order);
                setIsCancelModalOpen(true);
                return;
            }
        }
        
        console.log('Making PATCH request to:', `/admin/orders/${orderId}/status`);
        console.log('Request data:', { status: newStatus });
        console.log('User info:', user);
        
        router.patch(`/admin/orders/${orderId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            onStart: () => {
                console.log('Request started');
            },
            onProgress: () => {
                console.log('Request in progress');
            },
            onSuccess: (response) => {
                console.log('Order status updated successfully', response);
            },
            onError: (errors) => {
                console.error('Error updating order status:', errors);
                alert('Error: ' + JSON.stringify(errors));
            },
            onFinish: () => {
                console.log('Request finished');
            }
        });
    };

    // Handle order cancellation with reason
    const handleConfirmCancellation = () => {
        if (!orderToCancel || !cancellationReason.trim()) {
            alert('Please provide a cancellation reason.');
            return;
        }

        router.patch(`/admin/orders/${orderToCancel.order_id}/status`, {
            status: 'cancelled',
            cancellation_reason: cancellationReason.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCancelModalOpen(false);
                setOrderToCancel(null);
                setCancellationReason('');
                // Also close order details modal if open
                setIsOrderDetailsModalOpen(false);
            },
        });
    };

    // Archive order function
    const handleArchiveOrder = (order: Order) => {
        // Check if there are other pending orders for the same size
        const pendingOrdersForSize = orders.filter(o => 
            o.order_id !== order.order_id && // Exclude the current order
            o.size === order.size && 
            o.status === 'pending'
        );

        if (pendingOrdersForSize.length > 0) {
            setPendingOrdersWarning({ 
                open: true, 
                order, 
                pendingCount: pendingOrdersForSize.length 
            });
            return;
        }

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

    // Delete order permanently function
    const handleDeleteOrder = (order: Order) => {
        setOrderToDelete(order);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteOrder = () => {
        if (orderToDelete) {
            router.delete(`/admin/orders/${orderToDelete.order_id}/force-delete`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setOrderToDelete(null);
                }
            });
        }
    };

    const cancelDeleteOrder = () => {
        setIsDeleteModalOpen(false);
        setOrderToDelete(null);
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
            (order.formatted_order_id || `OR-${String(order.order_id).padStart(4, '0')}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            (order.formatted_order_id || `OR-${String(order.order_id).padStart(4, '0')}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <style dangerouslySetInnerHTML={{ __html: radioButtonStyles }} />
            
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
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
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
                                        isMobile && setSidebarOpen(false);
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

                {/* Main Content */}
                <main className={`flex-1 p-2 sm:p-4 md:p-8 ${isMobile ? 'w-full' : 'ml-64'} min-w-0 max-w-full overflow-hidden`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">Orders</h1>
                                <p className="text-blue-100 text-sm md:text-base">Manage and track Orders</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Order
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-lg shadow max-w-full overflow-hidden">
                        {/* Orders Section */}
                        <div className="p-6 max-w-full overflow-hidden">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Orders</h3>
                            
                            {/* Tabs */}
                            <Tabs defaultValue="orders" className="mb-6">
                                <TabsList className="grid w-fit grid-cols-2 bg-gray-200 p-1 rounded-xl h-12">
                                    <TabsTrigger 
                                        value="orders" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Orders
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="archives" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Archives
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="orders" className="mt-6">
                                    {/* Filters Section */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        {/* Search - Full width on mobile */}
                                        <div className="mb-4">
                                            <Label className="text-sm font-medium mb-2 block">Search</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search by customer, order ID, contact, or address"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Filter Controls */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            {/* Status Filter */}
                                            <div>
                                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                <select 
                                                    id="status-filter"
                                                    value={statusFilter} 
                                                    onChange={e => setStatusFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Status</option>
                                                    <option value="pending" style={{ color: '#111827', backgroundColor: 'white' }}>Pending</option>
                                                    <option value="out_for_delivery" style={{ color: '#111827', backgroundColor: 'white' }}>On Delivery</option>
                                                    <option value="completed" style={{ color: '#111827', backgroundColor: 'white' }}>Completed</option>
                                                    <option value="cancelled" style={{ color: '#111827', backgroundColor: 'white' }}>Cancelled</option>
                                                </select>
                                            </div>

                                            {/* Delivery Mode Filter */}
                                            <div>
                                                <label htmlFor="delivery-mode-filter" className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                                                <select 
                                                    id="delivery-mode-filter"
                                                    value={deliveryModeFilter} 
                                                    onChange={e => setDeliveryModeFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Modes</option>
                                                    <option value="pick_up" style={{ color: '#111827', backgroundColor: 'white' }}>Pick Up</option>
                                                    <option value="deliver" style={{ color: '#111827', backgroundColor: 'white' }}>Deliver</option>
                                                </select>
                                            </div>

                                            {/* Size Filter */}
                                            <div>
                                                <label htmlFor="size-filter" className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                                <select 
                                                    id="size-filter"
                                                    value={sizeFilter} 
                                                    onChange={e => setSizeFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Sizes</option>
                                                    {[...new Set(inventory.map(item => item.size))].sort().map((size) => (
                                                        <option key={size} value={size} style={{ color: '#111827', backgroundColor: 'white' }}>
                                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Date Range Filters */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Date From</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={dateFromFilter}
                                                        onChange={(e) => setDateFromFilter(e.target.value)}
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
                                                <Label className="text-sm font-medium mb-2 block">Date To</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={dateToFilter}
                                                        onChange={(e) => setDateToFilter(e.target.value)}
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
                                            <div className="sm:flex sm:items-end">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={clearAllFilters}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Clear Filters
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Results Counter */}
                                        <div className="mt-4 text-sm text-gray-600">
                                            Showing {filteredOrders.length} of {orders.length} orders
                                        </div>
                                    </div>

                                    {/* Orders Display - Responsive Design */}
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block">
                                        <div className="w-full">
                                            <Table className="w-full">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="font-semibold w-[8%]">Status</TableHead>
                                                        <TableHead className="font-semibold w-[6%]">ID</TableHead>
                                                        <TableHead className="font-semibold w-[15%]">Customer</TableHead>
                                                        <TableHead className="font-semibold w-[18%]">Address</TableHead>
                                                        <TableHead className="font-semibold w-[8%]">Size</TableHead>
                                                        <TableHead className="font-semibold w-[7%]">Qty</TableHead>
                                                        <TableHead className="font-semibold w-[10%]">Mode</TableHead>
                                                        <TableHead className="font-semibold w-[9%]">Order Date</TableHead>
                                                        <TableHead className="font-semibold w-[9%]">Delivery/Pick-Up Date</TableHead>
                                                        <TableHead className="font-semibold w-[8%]">Total</TableHead>
                                                        <TableHead className="font-semibold w-[2%]">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                            <TableBody>
                                            {filteredOrders.length > 0 ? (
                                                filteredOrders.map((order) => (
                                                    <TableRow key={order.order_id}>
                                                        <TableCell className="p-2">
                                                            {getStatusBadge(order.status)}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-sm p-2">
                                                            {order.formatted_order_id || `OR-${String(order.order_id).padStart(4, '0')}`}
                                                        </TableCell>
                                                        <TableCell className="break-words text-sm leading-tight p-2" title={order.customer_name}>
                                                            {order.customer_name}
                                                        </TableCell>
                                                        <TableCell className="break-words text-sm leading-tight p-2" title={order.address}>
                                                            {order.address}
                                                        </TableCell>
                                                        <TableCell className="capitalize text-sm p-2">{order.size}</TableCell>
                                                        <TableCell className="text-sm p-2">{order.quantity}</TableCell>
                                                        <TableCell className="capitalize text-sm break-words p-2">{order.delivery_mode.replace('_', ' ')}</TableCell>
                                                        <TableCell className="text-sm p-2">{formatDate(order.order_date)}</TableCell>
                                                        <TableCell className="text-sm p-2">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</TableCell>
                                                        <TableCell className="font-medium text-sm p-2">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</TableCell>
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
                                                                            {canCompleteDeliveryOrder(order) && (
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    <Check className="h-4 w-4 mr-2 text-green-600" />
                                                                                    Mark as Completed
                                                                                </DropdownMenuItem>
                                                                            )}
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
                                                                                View Invoice
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                    {(order.status === 'completed' || order.status === 'cancelled') && (
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
                                                                                View Invoice
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
                                                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                                        No orders found matching the current filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                        </div>
                                    </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <div key={order.order_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-800">
                                                            Order #{order.formatted_order_id || `OR-${String(order.order_id).padStart(4, '0')}`}
                                                        </div>
                                                        <div className="font-semibold text-lg text-gray-900">{order.customer_name}</div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusBadge(order.status)}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                                                                        {canCompleteDeliveryOrder(order) && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                                                Mark as Completed
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleStatusUpdate(order.order_id, 'cancelled')}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <X className="h-4 w-4 mr-2 text-red-600" />
                                                                            Cancel Order
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
                                                                            View Invoice
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {(order.status === 'completed' || order.status === 'cancelled') && (
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
                                                                            View Invoice
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
                                                    </div>
                                                </div>

                                                
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-800">Address:</span>
                                                        <div className="font-medium text-gray-900">{order.address}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-800">Size:</span>
                                                        <div className="font-medium text-gray-900 capitalize">{order.size}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-800">Quantity:</span>
                                                        <div className="font-medium text-gray-900">{order.quantity}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-800">Mode:</span>
                                                        <div className="font-medium text-gray-900 capitalize">{order.delivery_mode.replace('_', ' ')}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-800">Order Date:</span>
                                                        <div className="font-medium text-gray-900">{formatDate(order.order_date)}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-800">Delivery/Pick-Up Date:</span>
                                                        <div className="font-medium text-gray-900">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-800 text-sm font-medium">Total Amount</span>
                                                        <span className="font-bold text-lg text-green-700">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-800">
                                            No orders found matching the current filters.
                                        </div>
                                    )}
                                </div>
                                </TabsContent>
                                
                                <TabsContent value="archives" className="mt-6">
                                    {/* Filters Section for Archives */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        {/* Search - Full width on mobile */}
                                        <div className="mb-4">
                                            <Label className="text-sm font-medium mb-2 block">Search</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search by customer, order ID, contact, or address"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Filter Controls */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            {/* Status Filter */}
                                            <div>
                                                <label htmlFor="archives-status-filter" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                <select 
                                                    id="archives-status-filter"
                                                    value={statusFilter} 
                                                    onChange={e => setStatusFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Status</option>
                                                    <option value="completed" style={{ color: '#111827', backgroundColor: 'white' }}>Completed</option>
                                                    <option value="cancelled" style={{ color: '#111827', backgroundColor: 'white' }}>Cancelled</option>
                                                </select>
                                            </div>

                                            {/* Delivery Mode Filter */}
                                            <div>
                                                <label htmlFor="archives-delivery-mode-filter" className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                                                <select 
                                                    id="archives-delivery-mode-filter"
                                                    value={deliveryModeFilter}
                                                    onChange={e => setDeliveryModeFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Modes</option>
                                                    <option value="pick_up" style={{ color: '#111827', backgroundColor: 'white' }}>Pick Up</option>
                                                    <option value="deliver" style={{ color: '#111827', backgroundColor: 'white' }}>Deliver</option>
                                                </select>
                                            </div>

                                            {/* Size Filter */}
                                            <div>
                                                <label htmlFor="archives-size-filter" className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                                <select 
                                                    id="archives-size-filter"
                                                    value={sizeFilter} 
                                                    onChange={e => setSizeFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Sizes</option>
                                                    {[...new Set(inventory.map(item => item.size))].sort().map((size) => (
                                                        <option key={size} value={size} style={{ color: '#111827', backgroundColor: 'white' }}>
                                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Date Range Filters */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Date From</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={dateFromFilter}
                                                        onChange={(e) => setDateFromFilter(e.target.value)}
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
                                                <Label className="text-sm font-medium mb-2 block">Date To</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={dateToFilter}
                                                        onChange={(e) => setDateToFilter(e.target.value)}
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
                                            <div className="sm:flex sm:items-end">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={clearAllFilters}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Clear Filters
                                                </Button>
                                            </div>
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
                                            {/* Desktop Archived Orders Table */}
                                            <div className="hidden md:block">
                                                <div className="w-full">
                                                    <Table className="w-full">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="font-semibold w-[8%]">Status</TableHead>
                                                                <TableHead className="font-semibold w-[6%]">ID</TableHead>
                                                                <TableHead className="font-semibold w-[15%]">Customer</TableHead>
                                                                <TableHead className="font-semibold w-[18%]">Address</TableHead>
                                                                <TableHead className="font-semibold w-[8%]">Size</TableHead>
                                                                <TableHead className="font-semibold w-[7%]">Qty</TableHead>
                                                                <TableHead className="font-semibold w-[10%]">Mode</TableHead>
                                                                <TableHead className="font-semibold w-[9%]">Order Date</TableHead>
                                                                <TableHead className="font-semibold w-[9%]">Delivery/Pick-Up Date</TableHead>
                                                                <TableHead className="font-semibold w-[8%]">Total</TableHead>
                                                                <TableHead className="font-semibold w-[2%]">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredArchivedOrders.map((order) => (
                                                            <TableRow key={order.order_id} className="hover:bg-gray-50 bg-gray-50">
                                                                <TableCell className="p-2">
                                                                    {getStatusBadge(order.status)}
                                                                </TableCell>
                                                                <TableCell className="font-medium text-gray-600 text-sm p-2">
                                                                    {order.formatted_order_id || `OR-${String(order.order_id).padStart(4, '0')}`}
                                                                </TableCell>
                                                                <TableCell className="break-words text-sm leading-tight text-gray-600 p-2" title={order.customer_name}>
                                                                    {order.customer_name}
                                                                </TableCell>
                                                                <TableCell className="break-words text-sm leading-tight text-gray-600 p-2" title={order.address}>
                                                                    {order.address}
                                                                </TableCell>
                                                                <TableCell className="capitalize text-gray-600 text-sm p-2">{order.size}</TableCell>
                                                                <TableCell className="text-gray-600 text-sm p-2">{order.quantity}</TableCell>
                                                                <TableCell className="capitalize text-gray-600 text-sm break-words p-2">{order.delivery_mode.replace('_', ' ')}</TableCell>
                                                                <TableCell className="text-gray-600 text-sm p-2">{formatDate(order.order_date)}</TableCell>
                                                                <TableCell className="text-gray-600 text-sm p-2">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</TableCell>
                                                                <TableCell className="font-medium text-gray-600 text-sm p-2">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</TableCell>
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
                                                                                View Invoice
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleRestoreOrder(order)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
                                                                                Restore Order
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeleteOrder(order)}
                                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                                                                                Delete Permanently
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>

                                        {/* Mobile Archived Orders Card View */}
                                        <div className="md:hidden space-y-4">
                                            {filteredArchivedOrders.map((order) => (
                                                <div key={order.order_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="font-medium text-sm text-gray-800">Order #{order.order_id}</div>
                                                            <div className="font-semibold text-lg text-gray-900">{order.customer_name}</div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {getStatusBadge(order.status)}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleViewOrderDetails(order)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleRestoreOrder(order)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
                                                                        Restore Order
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteOrder(order)}
                                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                                                                        Delete Order
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-gray-800">Address:</span>
                                                            <div className="font-medium text-gray-900">{order.address}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-800">Size:</span>
                                                            <div className="font-medium text-gray-900 capitalize">{order.size}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-800">Quantity:</span>
                                                            <div className="font-medium text-gray-900">{order.quantity}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-800">Mode:</span>
                                                            <div className="font-medium text-gray-900 capitalize">{order.delivery_mode.replace('_', ' ')}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-800">Order Date:</span>
                                                            <div className="font-medium text-gray-900">{formatDate(order.order_date)}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-800">Delivery/Pick-Up Date:</span>
                                                            <div className="font-medium text-gray-900">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-800 text-sm font-medium">Total Amount</span>
                                                            <span className="font-bold text-lg text-green-700">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Order Modal */}
            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
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
                                {/* Customer Name with Autocomplete */}
                                <div className="space-y-3 relative">
                                    <Label htmlFor="customer_name" className="text-base font-medium">
                                        Customer Name 
                                        {uniqueCustomers.length > 0 && (
                                            <span className="text-sm text-gray-500 ml-2">(Start typing to see previous customers)</span>
                                        )}
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        type="text"
                                        placeholder="Enter customer name"
                                        value={data.customer_name}
                                        onChange={handleCustomerNameChange}
                                        onFocus={() => data.customer_name.length >= 2 && setShowCustomerSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                                        className={`w-full h-12 text-base ${validationErrors.customer_name || errors.customer_name ? 'border-red-500' : ''}`}
                                        autoComplete="off"
                                    />
                                    
                                    {/* Customer Suggestions Dropdown */}
                                    {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto top-full mt-1">
                                            {filteredCustomerSuggestions.map((customer, index) => (
                                                <div
                                                    key={index}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                    onClick={() => handleCustomerSelect(customer)}
                                                >
                                                    <div className="font-medium text-gray-900">{customer.customer_name}</div>
                                                    <div className="text-sm text-gray-600">{customer.address}</div>
                                                    <div className="text-sm text-gray-500">{customer.contact_number}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
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
                                                    // Parse the selected value to get product_name and size (split on last hyphen)
                                                    const lastHyphenIndex = data.size.lastIndexOf('-');
                                                    const productName = lastHyphenIndex > -1 ? data.size.substring(0, lastHyphenIndex) : '';
                                                    const size = lastHyphenIndex > -1 ? data.size.substring(lastHyphenIndex + 1) : data.size;
                                                    const selectedItem = inventory.find(item => 
                                                        item.product_name === productName && item.size === size
                                                    );
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
                                        <Label htmlFor="size-modal" className="text-base font-medium">Size</Label>
                                        {Array.isArray(availableItems) ? (
                                            <select 
                                                id="size-modal"
                                                value={data.size} 
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value && value !== "no-stock") {
                                                        setData('size', value);
                                                    }
                                                }}
                                                className={`w-full h-12 text-base px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${validationErrors.size || errors.size ? 'border-red-500' : 'border-gray-300'}`}
                                                style={{ 
                                                    color: '#111827', 
                                                    backgroundColor: 'white',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                <option value="" style={{ color: '#6B7280', backgroundColor: 'white' }}>
                                                    {availableItems.length === 0 
                                                        ? (data.quantity ? `No sizes have enough stock for quantity ${data.quantity}` : 'No sizes available in stock')
                                                        : "Select size"
                                                    }
                                                </option>
                                                {availableItems.length > 0 ? (
                                                    availableItems.map((item) => (
                                                        <option key={`${item.product_name}-${item.size}`} value={`${item.product_name}-${item.size}`} style={{ color: '#111827', backgroundColor: 'white' }}>
                                                            {item.product_name} - {item.size.charAt(0).toUpperCase() + item.size.slice(1)} - ₱{item.price} (Stock: {item.quantity})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="no-stock" disabled style={{ color: '#6B7280', backgroundColor: 'white' }}>
                                                        {data.quantity ? `No sizes have enough stock for quantity ${data.quantity}` : 'No sizes available in stock'}
                                                    </option>
                                                )}
                                            </select>
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
                                                placeholder="dd/mm/yyyy"
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
                                            <Label htmlFor="delivery_date" className="text-sm text-gray-600">Delivery/Pick-Up Date</Label>
                                            <div className="relative">
                                                <Input
                                                    id="delivery_date"
                                                    type="date"
                                                    placeholder="dd/mm/yyyy"
                                                    value={data.delivery_date}
                                                    onChange={(e) => setData('delivery_date', e.target.value)}
                                                    onFocus={(e) => e.target.showPicker?.()}
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
                                    <label className="block text-base font-medium text-gray-700">Mode</label>
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                id="pick_up"
                                                name="delivery_mode"
                                                value="pick_up"
                                                checked={data.delivery_mode === 'pick_up'}
                                                onChange={(e) => setData('delivery_mode', e.target.value)}
                                                className="custom-radio"
                                            />
                                            <label htmlFor="pick_up" className="cursor-pointer text-base text-gray-700">Pick up</label>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                id="deliver"
                                                name="delivery_mode"
                                                value="deliver"
                                                checked={data.delivery_mode === 'deliver'}
                                                onChange={(e) => setData('delivery_mode', e.target.value)}
                                                className="custom-radio"
                                            />
                                            <label htmlFor="deliver" className="cursor-pointer text-base text-gray-700">Deliver</label>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Rider Selection */}
                                {data.delivery_mode === 'deliver' && (
                                    <div className="space-y-3">
                                        <Label htmlFor="delivery_rider" className="text-base font-medium">
                                            Select Delivery Rider <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="delivery_rider"
                                            value={data.delivery_rider_id}
                                            onChange={(e) => setData('delivery_rider_id', e.target.value)}
                                            className={`w-full h-12 text-base px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${validationErrors.delivery_rider_id || errors.delivery_rider_id ? 'border-red-500' : 'border-gray-300'}`}
                                            style={{ 
                                                color: '#111827', 
                                                backgroundColor: 'white',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <option value="" style={{ color: '#6B7280', backgroundColor: 'white' }}>
                                                Choose a delivery rider
                                            </option>
                                            {deliveryRiders.length > 0 ? (
                                                deliveryRiders.map((rider) => (
                                                    <option key={rider.id} value={rider.id.toString()} style={{ color: '#111827', backgroundColor: 'white' }}>
                                                        {rider.name} - {rider.position}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled style={{ color: '#6B7280', backgroundColor: 'white' }}>
                                                    No delivery riders available
                                                </option>
                                            )}
                                        </select>
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
                                        onClick={() => handleModalOpenChange(false)}
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
                                    <Label className="text-base font-medium text-gray-700">Customer Name</Label>
                                    <div className="text-base text-gray-900 mt-1">
                                        {data.customer_name || 'Name'}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium text-gray-700">Address</Label>
                                    <div className="text-base text-gray-900 mt-1">
                                        {data.address || 'Address'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-base font-medium text-gray-700">Quantity</Label>
                                        <div className="text-base text-gray-900 mt-1">
                                            {data.quantity || 'Quantity'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-base font-medium text-gray-700">Size</Label>
                                        <div className="text-base text-gray-900 mt-1">
                                            {data.size ? (() => {
                                                const lastHyphenIndex = data.size.lastIndexOf('-');
                                                const productName = lastHyphenIndex > -1 ? data.size.substring(0, lastHyphenIndex) : '';
                                                const size = lastHyphenIndex > -1 ? data.size.substring(lastHyphenIndex + 1) : data.size;
                                                return productName && size ? `${productName} - ${size.charAt(0).toUpperCase() + size.slice(1)}` : 'Size';
                                            })() : 'Size'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium text-gray-700">Date</Label>
                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <div>
                                            <div className="text-sm text-gray-500">Order Date</div>
                                            <div className="text-base text-gray-900">
                                                {data.order_date || '00/00/00'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Delivery Date</div>
                                            <div className="text-base text-gray-900">
                                                {data.delivery_date || '00/00/00'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium text-gray-700">Mode</Label>
                                    <div className="text-base text-gray-900 mt-1">
                                        {data.delivery_mode === 'pick_up' ? 'Pick up' : 'Deliver'}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base font-medium text-gray-700">Total</Label>
                                    <div className="text-lg font-bold text-gray-700 mt-1">
                                        ₱{calculatedTotal.toFixed(2)}
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg font-semibold">Order Details</DialogTitle>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-2 pb-4">
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
                                        <span className="text-xs text-gray-500">Mode</span>
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
                                    {/* Show completed by info for completed orders */}
                                    {selectedOrder.status === 'completed' && (
                                        <div>
                                            <span className="text-xs text-gray-500">Completed By</span>
                                            <p className="font-semibold text-sm">
                                                {selectedOrder.completed_by || 'Unknown'}
                                            </p>
                                        </div>
                                    )}
                                    {/* Show delivery employee info for delivery orders */}
                                    {selectedOrder.delivery_mode === 'deliver' && (selectedOrder.deliveryRider || selectedOrder.delivery_rider) && (
                                        <div>
                                            <span className="text-xs text-gray-500">Delivery Employee</span>
                                            <p className="font-semibold text-sm">
                                                {selectedOrder.deliveryRider?.name || selectedOrder.delivery_rider?.name || 'Unknown'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transaction Status */}
                            <div className="bg-white border rounded-lg p-2">
                                <h3 className="text-base font-semibold mb-2 text-center text-blue-600">Transaction Status</h3>
                                
                                {selectedOrder.status === 'cancelled' ? (
                                    /* Cancelled Order Status */
                                    <div className="flex justify-center items-center">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-red-500 text-white">
                                                <X className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-medium text-red-600">Order Cancelled</p>
                                            <p className="text-xs text-gray-500">Transaction terminated</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal Order Status Flow */
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

                                        {/* Package Delivered / Picked Up */}
                                        <div className="flex flex-col items-center text-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                                selectedOrder.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-medium">Package</p>
                                            <p className="text-xs text-gray-500">
                                                {selectedOrder.delivery_mode === 'pick_up' ? 'Picked Up' : 'Delivered'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Current Status Text */}
                                <div className="mt-2 text-center">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Current Status: {getStatusBadge(selectedOrder.status)}
                                    </p>
                                </div>
                            </div>

                            {/* Cancellation Reason Section */}
                            {selectedOrder.status === 'cancelled' && selectedOrder.cancellation_reason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h3 className="text-base font-semibold mb-2 text-center text-red-600">Cancellation Information</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-gray-500">Cancellation Reason</span>
                                            <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                                                {selectedOrder.cancellation_reason}
                                            </p>
                                        </div>
                                        {selectedOrder.cancelled_at && (
                                            <div>
                                                <span className="text-xs text-gray-500">Cancelled On</span>
                                                <p className="text-sm font-medium text-red-600">
                                                    {formatDate(selectedOrder.cancelled_at)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Delivery Photo Section */}
                            {selectedOrder.delivery_photo && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <h3 className="text-base font-semibold mb-3 text-center text-green-600">Delivery Confirmation</h3>
                                    <div className="text-center">
                                        <img 
                                            src={`/storage/${selectedOrder.delivery_photo}`}
                                            alt="Delivery confirmation photo"
                                            className="max-w-full max-h-64 object-contain mx-auto rounded-lg shadow-md border border-gray-200"
                                        />
                                        <p className="text-sm text-gray-600 mt-3">
                                            Photo taken at delivery completion
                                        </p>
                                        {(selectedOrder.deliveryRider || selectedOrder.delivery_rider) && (
                                            <p className="text-sm text-green-600 font-medium mt-2">
                                                Delivered by: {selectedOrder.deliveryRider?.name || selectedOrder.delivery_rider?.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2 pt-1">
                                <Button
                                    onClick={() => setIsOrderDetailsModalOpen(false)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    aria-label="Close order details modal"
                                >
                                    Close
                                </Button>
                                
                                {selectedOrder.status === 'pending' && (
                                    <>
                                        {canCompleteDeliveryOrder(selectedOrder) && (
                                            <Button
                                                onClick={() => {
                                                    handleStatusUpdate(selectedOrder.order_id, 'completed');
                                                    setIsOrderDetailsModalOpen(false);
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                                size="sm"
                                                aria-label="Mark order as completed"
                                            >
                                                <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                                                Mark as Completed
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder.order_id, 'cancelled');
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                                            aria-label="Cancel order"
                                        >
                                            <X className="h-4 w-4 mr-2" aria-hidden="true" />
                                            Cancel Order
                                        </Button>
                                    </>
                                )}
                                
                                {selectedOrder.status === 'out_for_delivery' && (
                                    <>
                                        <Button
                                            onClick={() => window.print()}
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                                            aria-label="Print receipt"
                                        >
                                            <Printer className="h-4 w-4 mr-2" aria-hidden="true" />
                                            Print Receipt
                                        </Button>
                                        {canCompleteDeliveryOrder(selectedOrder) && (
                                            <Button
                                                onClick={() => {
                                                    handleStatusUpdate(selectedOrder.order_id, 'completed');
                                                    setIsOrderDetailsModalOpen(false);
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                                size="sm"
                                                aria-label="Mark order as delivered"
                                            >
                                                <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                                                Mark as Delivered
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Permanently Delete Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete order #{orderToDelete?.order_id} for {orderToDelete?.customer_name}?
                            <br /><br />
                            <span className="font-medium text-red-600">⚠️ Warning: This action cannot be undone!</span>
                            <br />
                            All order data will be permanently removed from the system.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={cancelDeleteOrder}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteOrder}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel order #{orderToCancel?.order_id} for {orderToCancel?.customer_name}?
                            <br />
                            Please provide a reason for cancellation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
                            <Textarea
                                id="cancellation-reason"
                                placeholder="Please explain why this order is being cancelled..."
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                className="mt-1 text-gray-900 bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                            setIsCancelModalOpen(false);
                            setOrderToCancel(null);
                            setCancellationReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmCancellation}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
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

            {/* Pending Orders Warning Dialog */}
            <Dialog open={pendingOrdersWarning.open} onOpenChange={(open) => !open && setPendingOrdersWarning({ open: false, order: null, pendingCount: 0 })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                            Cannot Archive Order
                        </DialogTitle>
                        <DialogDescription className="space-y-2">
                            <p>
                                Cannot archive order <strong>{pendingOrdersWarning.order?.formatted_order_id || `OR-${String(pendingOrdersWarning.order?.order_id).padStart(4, '0')}`}</strong> for <strong>{pendingOrdersWarning.order?.size}</strong> size because there {pendingOrdersWarning.pendingCount === 1 ? 'is' : 'are'} still <strong>{pendingOrdersWarning.pendingCount}</strong> other pending {pendingOrdersWarning.pendingCount === 1 ? 'order' : 'orders'} for the same size.
                            </p>
                            <p className="text-red-600 font-medium">
                                Please complete or cancel the other pending orders for this size first before archiving this order.
                            </p>
                            <p className="text-gray-600">
                                This ensures all orders for the same product size are processed in the correct sequence.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setPendingOrdersWarning({ open: false, order: null, pendingCount: 0 })}
                        >
                            Understood
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}