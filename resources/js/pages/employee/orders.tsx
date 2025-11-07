import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Package, ShoppingCart, User, LogOut, Eye, Check, Truck, Search, Filter, Calendar, MoreHorizontal, Menu, X, Camera, Upload, Plus, Settings, BarChart3, Clock, Play, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
    status: 'pending' | 'out_for_delivery' | 'completed' | 'cancelled';
    total: number;
    delivery_rider_id?: number;
    deliveryRider?: User;
    delivery_photo?: string;
    cancellation_reason?: string;
    cancelled_at?: string;
    archived?: boolean; // Add archived field for type safety
    formatted_order_id?: string;
}

interface InventoryItem {
    product_name: string;
    size: string;
    price: number;
    status: string;
    quantity: number;
    archived_at?: string | null; // Add archived field
}

interface JobOrder {
    job_order_id: number;
    job_order_number: string;
    product_name: string;
    size: string;
    quantity_to_produce: number;
    status: string;
    production_date: string;
    started_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    created_by: number;
    assigned_to?: number;
    notes?: string;
    cancellation_reason?: string;
    creator: User;
    assigned_user?: User;
    created_at: string;
    formatted_job_order_id?: string;
}

interface EmployeeOrdersProps {
    user: User;
    orders: Order[];
    inventory: InventoryItem[];
    jobOrders: JobOrder[];
}

export default function EmployeeOrders({ user, orders, inventory = [], jobOrders = [] }: EmployeeOrdersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [jobOrderSearchTerm, setJobOrderSearchTerm] = useState('');
    const [jobOrderStatusFilter, setJobOrderStatusFilter] = useState('all');
    const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
    const [isJobOrderDetailsModalOpen, setIsJobOrderDetailsModalOpen] = useState(false);
    const [showCancelJobOrderModal, setShowCancelJobOrderModal] = useState(false);
    const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
    const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
    const [jobOrderToCancel, setJobOrderToCancel] = useState<JobOrder | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [orderCancellationReason, setOrderCancellationReason] = useState('');
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
    const [customerSuggestions, setCustomerSuggestions] = useState<{customer_name: string, address: string, contact_number: string}[]>([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    // Get today's date in YYYY-MM-DD format
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
        
        if (hours < 2) {
            // Use previous day if before 2:00 AM (hours 0 or 1)
            const previousDay = new Date(philippinesTime.getTime() - (24 * 60 * 60 * 1000));
            return previousDay.toISOString().split('T')[0];
        } else {
            // Use today's date for 2:00 AM and later
            return philippinesTime.toISOString().split('T')[0];
        }
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
        order_date: getPhilippinesDate(),
        delivery_date: '',
        delivery_mode: 'deliver', // Default to deliver for employees
        delivery_rider_id: user.id.toString(), // Set current employee as delivery rider
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
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">● Pending</Badge>;
        } else if (status === 'out_for_delivery') {
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">● Out for Delivery</Badge>;
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
        // If cancelling an order, open cancellation modal
        if (newStatus === 'cancelled') {
            const order = orders.find(o => o.order_id === orderId);
            if (order) {
                setOrderToCancel(order);
                setShowCancelOrderModal(true);
                return;
            }
        }
        
        try {
            await router.post(`/employee/orders/${orderId}/update-status`, {
                status: newStatus
            });
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    // Handle order cancellation with reason  
    const handleCancelOrder = (order: Order) => {
        setOrderToCancel(order);
        setOrderCancellationReason('');
        setShowCancelOrderModal(true);
    };

    const handleConfirmCancelOrder = async () => {
        if (orderToCancel && orderCancellationReason.trim()) {
            try {
                await router.post(`/employee/orders/${orderToCancel.order_id}/update-status`, {
                    status: 'cancelled',
                    cancellation_reason: orderCancellationReason.trim()
                });
                setShowCancelOrderModal(false);
                setOrderToCancel(null);
                setOrderCancellationReason('');
            } catch (error) {
                console.error('Failed to cancel order:', error);
            }
        } else {
            alert('Please provide a cancellation reason.');
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

    // Check if quantity exceeds all available stock
    const isQuantityTooHigh = useMemo(() => {
        if (!data.quantity || !inventory || !Array.isArray(inventory)) return false;
        
        const availableInventory = inventory.filter(item => item && (item.status === 'available' || item.status === 'critical') && item.quantity >= 0 && !item.archived_at);
        if (availableInventory.length === 0) return false;
        
        const requestedQuantity = parseInt(data.quantity);
        if (isNaN(requestedQuantity)) return false;
        
        const maxStock = Math.max(...availableInventory.map(item => item.quantity));
        return requestedQuantity > maxStock;
    }, [data.quantity, inventory]);

    // get maximum available stock
    const maxStock = useMemo(() => {
        if (!inventory || !Array.isArray(inventory)) return 0;
        
        const availableInventory = inventory.filter(item => item && (item.status === 'available' || item.status === 'critical') && item.quantity >= 0 && !item.archived_at);
        if (availableInventory.length === 0) return 0;
        
        return Math.max(...availableInventory.map(item => item.quantity));
    }, [inventory]);

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
        
        if (lastHyphenIndex > -1) {
            // Format: "product_name-size"
            const productName = data.size.substring(0, lastHyphenIndex);
            const size = data.size.substring(lastHyphenIndex + 1);
            
            // Try to find by product_name and size
            let selectedItem = inventory.find(item => 
                item.product_name === productName && item.size === size
            );
            
            // If product_name is empty/undefined, try finding by size only
            if (!selectedItem || !productName || productName === '' || productName === 'undefined') {
                selectedItem = inventory.find(item => item.size === size);
            }
            
            if (selectedItem && selectedItem.price) {
                return quantity * selectedItem.price;
            }
        } else {
            // Fallback: if no hyphen, treat it as just size (legacy format)
            const selectedItem = inventory.find(item => item.size === data.size);
            
            if (selectedItem && selectedItem.price) {
                return quantity * selectedItem.price;
            }
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

    // Handle modal close - reset form when modal is closed
    const handleCreateOrderModalOpenChange = (open: boolean) => {
        setIsCreateOrderModalOpen(open);
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
                delivery_mode: 'deliver', // Default to deliver for employees
                delivery_rider_id: user.id.toString(), // Set current employee as delivery rider
            });
            // Clear validation errors
            setValidationErrors({});
            // Clear customer suggestions
            setShowCustomerSuggestions(false);
            setCustomerSuggestions([]);
        } else {
            // When opening modal, ensure order date is set to current Philippines date
            const currentDate = getPhilippinesDate();
            setData('order_date', currentDate);
            setData('delivery_rider_id', user.id.toString());
        }
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
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    // Filter orders based on search term and status
    const filteredOrders = useMemo(() => {
        if (!orders || !Array.isArray(orders)) return [];
        
        return orders.filter(order => {
            try {
                const searchTermLower = searchTerm.toLowerCase();
                const matchesSearch = searchTerm === '' || 
                    (order?.customer_name || '').toLowerCase().includes(searchTermLower) ||
                    (order?.order_id || '').toString().toLowerCase().includes(searchTermLower) ||
                    (order?.formatted_order_id || `OR-${String(order?.order_id || '').padStart(4, '0')}`).toLowerCase().includes(searchTermLower)

                const matchesStatus = statusFilter === 'all' || order?.status === statusFilter;

                return matchesSearch && matchesStatus;
            } catch (error) {
                console.error('Error filtering order:', error, order);
                return false;
            }
        });
    }, [orders, searchTerm, statusFilter]);

    const filteredJobOrders = useMemo(() => {
        if (!jobOrders || !Array.isArray(jobOrders)) return [];
        
        return jobOrders.filter(jobOrder => {
            try {
                const searchTermLower = jobOrderSearchTerm.toLowerCase();
                const matchesSearch = jobOrderSearchTerm === '' || 
                    (jobOrder?.formatted_job_order_id || `JO-${String(jobOrder?.job_order_id).padStart(4, '0')}`).toLowerCase().includes(searchTermLower) ||
                    (jobOrder?.job_order_number || '').toLowerCase().includes(searchTermLower) ||
                    (jobOrder?.product_name || '').toLowerCase().includes(searchTermLower) ||
                    (jobOrder?.size || '').toLowerCase().includes(searchTermLower);

                const matchesStatus = jobOrderStatusFilter === 'all' || jobOrder?.status === jobOrderStatusFilter;

                return matchesSearch && matchesStatus;
            } catch (error) {
                console.error('Error filtering job order:', error, jobOrder);
                return false;
            }
        });
    }, [jobOrders, jobOrderSearchTerm, jobOrderStatusFilter]);

    // Job order status update functions
    const handleJobOrderStatusUpdate = (jobOrderId: number, newStatus: string) => {
        router.patch(`/employee/job-orders/${jobOrderId}/status`, {
            status: newStatus
        });
    };

    const handleViewJobOrderDetails = (jobOrder: JobOrder) => {
        setSelectedJobOrder(jobOrder);
        setIsJobOrderDetailsModalOpen(true);
    };

    const handleCancelJobOrder = (jobOrder: JobOrder) => {
        setJobOrderToCancel(jobOrder);
        setCancellationReason('');
        setShowCancelJobOrderModal(true);
    };

    const handleConfirmCancelJobOrder = () => {
        if (jobOrderToCancel && cancellationReason.trim()) {
            router.patch(`/employee/job-orders/${jobOrderToCancel.job_order_id}/status`, {
                status: 'cancelled',
                cancellation_reason: cancellationReason.trim()
            });
            setShowCancelJobOrderModal(false);
            setJobOrderToCancel(null);
            setCancellationReason('');
        }
    };

    const getJobOrderStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">● Pending</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">● In Progress</Badge>;
            case 'completed':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">● Completed</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">● Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="My Orders - RDA Tube Ice" />
            
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
                                    href="/employee/dashboard" 
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link 
                                    href="/employee/orders" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
                                    onClick={() => isMobile && setSidebarOpen(false)}
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
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Settings</span>
                                </Link>
                                <button 
                                    onClick={() => {
                                        if (isMobile) setSidebarOpen(false);
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

                {/* Main Content */}
                <main className={`flex-1 p-4 md:p-8 bg-gray-50 ${isMobile ? 'w-full' : 'ml-64'}`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">My Work</h1>
                                <p className="text-blue-100 text-sm md:text-base">Manage your assigned orders and production tasks</p>
                            </div>
                            <Button
                                onClick={() => setIsCreateOrderModalOpen(true)}
                                className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 md:px-6 md:py-3"
                            >
                                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                <span className="hidden md:inline">Add Order</span>
                                <span className="md:hidden">Add Order</span>
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

                    {/* Tabs Section */}
                    <Tabs defaultValue="orders" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-200 p-1 rounded-xl h-12 mb-6">
                            <TabsTrigger 
                                value="orders" 
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium flex items-center gap-2"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Delivery Orders
                            </TabsTrigger>
                            <TabsTrigger 
                                value="job-orders" 
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium flex items-center gap-2"
                            >
                                <Package className="w-4 h-4" />
                                Production Tasks
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="orders">
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
                                <div className="flex gap-4 text-gray-600">
                                    {/* Status Filter */}
                                    <div>
                                        <select 
                                            value={statusFilter} 
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </div>
                        </div>

                        {/* Orders Table - Desktop */}
                        <div className="hidden md:block">
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold w-[8%]">Status</TableHead>
                                            <TableHead className="font-semibold w-[6%]">Order ID</TableHead>
                                            <TableHead className="font-semibold w-[15%]">Customer</TableHead>
                                            <TableHead className="font-semibold w-[18%]">Address</TableHead>
                                            <TableHead className="font-semibold w-[8%]">Size</TableHead>
                                            <TableHead className="font-semibold w-[7%]">Quantity</TableHead>
                                            <TableHead className="font-semibold w-[10%]">Mode</TableHead>
                                            <TableHead className="font-semibold w-[9%]">Order Date</TableHead>
                                            <TableHead className="font-semibold w-[9%]">Delivery/Pick-Up Date</TableHead>
                                            <TableHead className="font-semibold w-[8%]">Total</TableHead>
                                            <TableHead className="font-semibold w-[2%]">Actions</TableHead>
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
                                                    <TableCell className="p-2">
                                                        {getStatusBadge(order.status)}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm p-2">
                                                        {order.formatted_order_id || `OR-${String(order.order_id).padStart(4, '0')}`}
                                                    </TableCell>
                                                    <TableCell className="break-words text-sm leading-tight p-2" title={order.customer_name}>{order.customer_name}</TableCell>
                                                    <TableCell className="break-words text-sm leading-tight p-2" title={order.address}>{order.address}</TableCell>
                                                    <TableCell className="capitalize text-sm p-2">{order.size}</TableCell>
                                                    <TableCell className="text-sm p-2">{order.quantity}</TableCell>
                                                    <TableCell className="capitalize text-sm break-words p-2">
                                                        <span className="capitalize">
                                                            {order.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm p-2">{formatDate(order.order_date)}</TableCell>
                                                    <TableCell className="text-sm p-2">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</TableCell>
                                                    <TableCell className="font-medium text-sm p-2">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</TableCell>
                                                    <TableCell className="p-2">
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
                                                                    <>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleStatusUpdate(order.order_id, 'out_for_delivery')}
                                                                            className="text-blue-600"
                                                                        >
                                                                            <Truck className="mr-2 h-4 w-4" />
                                                                            Start Delivery
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleCancelOrder(order)}
                                                                            className="text-red-600"
                                                                        >
                                                                            <X className="mr-2 h-4 w-4" />
                                                                            Cancel Order
                                                                        </DropdownMenuItem>
                                                                    </>
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
                        </div>

                        {/* Orders Cards - Mobile */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <div key={order.order_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-medium text-sm text-gray-700">
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
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {order.status === 'pending' && (
                                                            <>
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleStatusUpdate(order.order_id, 'out_for_delivery')}
                                                                    className="text-blue-600"
                                                                >
                                                                    <Truck className="mr-2 h-4 w-4" />
                                                                    Start Delivery
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleCancelOrder(order)}
                                                                    className="text-red-600"
                                                                >
                                                                    <X className="mr-2 h-4 w-4" />
                                                                    Cancel Order
                                                                </DropdownMenuItem>
                                                            </>
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
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-700">Address:</span>
                                                <div className="font-medium text-gray-800">{order.address}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Size:</span>
                                                <div className="font-medium text-gray-800 capitalize">{order.size}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Quantity:</span>
                                                <div className="font-medium text-gray-800">{order.quantity}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Mode:</span>
                                                <div className="font-medium text-gray-800 capitalize">{order.delivery_mode === 'pick_up' ? 'Pick Up' : 'Deliver'}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Order Date:</span>
                                                <div className="font-medium text-gray-800">{formatDate(order.order_date)}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-700">Delivery/Pick-Up Date:</span>
                                                <div className="font-medium text-gray-800">{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700 text-sm">Total Amount</span>
                                                <span className="font-bold text-lg text-green-600">₱{order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-600">
                                    {searchTerm || statusFilter !== 'all' ? 'No orders found matching your filters' : 'No orders assigned to you'}
                                </div>
                            )}
                        </div>
                    </div>
                        </TabsContent>

                        <TabsContent value="job-orders">
                            {/* Job Orders Section */}
                            <div className="bg-white rounded-lg shadow-md">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Search */}
                                        <div className="flex-1 max-w-md">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search by job order, product, or size"
                                                    value={jobOrderSearchTerm}
                                                    onChange={(e) => setJobOrderSearchTerm(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        {/* Filters */}
                                        <div className="flex gap-4 text-gray-600">
                                            {/* Status Filter */}
                                            <div>
                                                <select 
                                                    value={jobOrderStatusFilter} 
                                                    onChange={e => setJobOrderStatusFilter(e.target.value)}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <option value="all" style={{ color: '#111827', backgroundColor: 'white' }}>All Status</option>
                                                    <option value="pending" style={{ color: '#111827', backgroundColor: 'white' }}>Pending</option>
                                                    <option value="in_progress" style={{ color: '#111827', backgroundColor: 'white' }}>In Progress</option>
                                                    <option value="completed" style={{ color: '#111827', backgroundColor: 'white' }}>Completed</option>
                                                    <option value="cancelled" style={{ color: '#111827', backgroundColor: 'white' }}>Cancelled</option>
                                                </select>
                                            </div>

                                            {/* Results Count */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                Showing {filteredJobOrders.length} of {jobOrders.length} job orders
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Orders Mobile Card View */}
                                <div className="block md:hidden space-y-4">
                                    {filteredJobOrders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-gray-500">
                                                {jobOrderSearchTerm || jobOrderStatusFilter !== 'all' ? 'No job orders found matching your filters' : 'No job orders assigned to you'}
                                            </div>
                                        </div>
                                    ) : (
                                        filteredJobOrders.map((jobOrder) => (
                                            <div key={jobOrder.job_order_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                {/* Header with Job Order # and Status */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-medium text-blue-600">
                                                            {jobOrder.formatted_job_order_id || `JO-${String(jobOrder.job_order_id).padStart(4, '0')}`}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">{jobOrder.product_name}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {getJobOrderStatusBadge(jobOrder.status)}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleViewJobOrderDetails(jobOrder)}
                                                                    className="text-blue-600"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                {jobOrder.status === 'pending' && (
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleJobOrderStatusUpdate(jobOrder.job_order_id, 'in_progress')}
                                                                        className="text-blue-600"
                                                                    >
                                                                        <Play className="w-4 h-4 mr-2" />
                                                                        Start Production
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {jobOrder.status === 'in_progress' && (
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleJobOrderStatusUpdate(jobOrder.job_order_id, 'completed')}
                                                                        className="text-green-600"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Mark Complete
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {(jobOrder.status === 'pending' || jobOrder.status === 'in_progress') && (
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleCancelJobOrder(jobOrder)}
                                                                        className="text-red-600"
                                                                    >
                                                                        <X className="w-4 h-4 mr-2" />
                                                                        Cancel
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>

                                                {/* Information Grid */}
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-700">Size:</span>
                                                        <div className="font-medium text-gray-800">{jobOrder.size}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-700">Quantity:</span>
                                                        <div className="font-medium text-gray-800">{jobOrder.quantity_to_produce}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-700">Production Date:</span>
                                                        <div className="font-medium text-gray-800">{new Date(jobOrder.production_date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-700">Created By:</span>
                                                        <div className="font-medium text-gray-800">{jobOrder.creator.name || jobOrder.creator.username}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Job Orders Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold text-gray-700">Job Order #</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Product</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Size</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Production Date</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Created By</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredJobOrders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-12">
                                                        <div className="text-gray-500">
                                                            {jobOrderSearchTerm || jobOrderStatusFilter !== 'all' ? 'No job orders found matching your filters' : 'No job orders assigned to you'}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredJobOrders.map((jobOrder) => (
                                                    <TableRow key={jobOrder.job_order_id} className="hover:bg-gray-50">
                                                        <TableCell className="font-medium text-blue-600">
                                                            {jobOrder.formatted_job_order_id || `JO-${String(jobOrder.job_order_id).padStart(4, '0')}`}
                                                        </TableCell>
                                                        <TableCell>{jobOrder.product_name}</TableCell>
                                                        <TableCell>{jobOrder.size}</TableCell>
                                                        <TableCell>{jobOrder.quantity_to_produce}</TableCell>
                                                        <TableCell>
                                                            {getJobOrderStatusBadge(jobOrder.status)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(jobOrder.production_date).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            {jobOrder.creator.name || jobOrder.creator.username}
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleViewJobOrderDetails(jobOrder)}
                                                                        className="text-blue-600"
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-2" />
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    {jobOrder.status === 'pending' && (
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleJobOrderStatusUpdate(jobOrder.job_order_id, 'in_progress')}
                                                                            className="text-blue-600"
                                                                        >
                                                                            <Play className="w-4 h-4 mr-2" />
                                                                            Start Production
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {jobOrder.status === 'in_progress' && (
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleJobOrderStatusUpdate(jobOrder.job_order_id, 'completed')}
                                                                            className="text-green-600"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                                            Mark Complete
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {(jobOrder.status === 'pending' || jobOrder.status === 'in_progress') && (
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleCancelJobOrder(jobOrder)}
                                                                            className="text-red-600"
                                                                        >
                                                                            <X className="w-4 h-4 mr-2" />
                                                                            Cancel
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
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Order Details Modal */}
            <Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
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
                                        <p className="font-semibold">
                                            {selectedOrder.formatted_order_id || `OR-${String(selectedOrder.order_id).padStart(4, '0')}`}
                                        </p>
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
                                        <span className="text-xs text-gray-500">Delivery/Pick-Up Date</span>
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
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <h3 className="text-base font-semibold mb-2 text-center text-green-600">Delivery Confirmation</h3>
                                    <div className="text-center">
                                        <img 
                                            src={`/storage/${selectedOrder.delivery_photo}`}
                                            alt="Delivery confirmation photo"
                                            className="max-w-full h-32 sm:h-48 object-cover mx-auto rounded-lg shadow-md"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Photo taken at delivery completion
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-4 border-t mt-4">
                                <div className="flex justify-center space-x-2">
                                    <Button
                                        onClick={() => setIsOrderDetailsModalOpen(false)}
                                        variant="outline"
                                        size="sm"
                                        className="min-w-[80px]"
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
                                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                                size="sm"
                                            >
                                                <Truck className="h-4 w-4 mr-2" />
                                                Start Delivery
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    handleCancelOrder(selectedOrder);
                                                }}
                                                variant="outline"
                                                className="border-red-600 text-red-600 hover:bg-red-50 min-w-[120px]"
                                                size="sm"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel Order
                                            </Button>
                                        </>
                                    )}
                                </div>
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
                                <p className="font-semibold">
                                    #{orderToComplete.formatted_order_id || `OR-${String(orderToComplete.order_id).padStart(4, '0')}`}
                                </p>
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
            <Dialog open={isCreateOrderModalOpen} onOpenChange={handleCreateOrderModalOpenChange}>
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
                                                
                                                // Clear size if quantity changes and no longer sufficient
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
                                                    availableItems.map((item) => {
                                                        const productName = item.product_name || '';
                                                        const size = item.size || '';
                                                        
                                                        // Create key and value based on whether product_name exists
                                                        const key = productName && productName !== '' && productName !== 'undefined' 
                                                            ? `${productName}-${size}` 
                                                            : size;
                                                        
                                                        const value = productName && productName !== '' && productName !== 'undefined' 
                                                            ? `${productName}-${size}` 
                                                            : size;
                                                        
                                                        const displayText = productName && productName !== '' && productName !== 'undefined'
                                                            ? `${productName} - ${size.charAt(0).toUpperCase() + size.slice(1)} - ₱${item.price} (Stock: ${item.quantity})`
                                                            : `${size.charAt(0).toUpperCase() + size.slice(1)} - ₱${item.price} (Stock: ${item.quantity})`;
                                                        
                                                        return (
                                                            <option key={key} value={value} style={{ color: '#111827', backgroundColor: 'white' }}>
                                                                {displayText}
                                                            </option>
                                                        );
                                                    })
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

                                {/* Submit Button */}
                                <div className="flex justify-end pt-6 space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleCreateOrderModalOpenChange(false)}
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
                                                
                                                if (productName && productName !== '' && productName !== 'undefined') {
                                                    return `${productName} - ${size.charAt(0).toUpperCase() + size.slice(1)}`;
                                                } else {
                                                    return size.charAt(0).toUpperCase() + size.slice(1);
                                                }
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

                                {/* Show who will be the delivery rider */}
                                {data.delivery_mode === 'deliver' && (
                                    <div>
                                        <Label className="text-base font-medium text-gray-700">Delivery Rider</Label>
                                        <div className="text-base text-gray-900 mt-1">
                                            {user.name} (You)
                                        </div>
                                    </div>
                                )}

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

            {/* Job Order Details Modal */}
            <Dialog open={isJobOrderDetailsModalOpen} onOpenChange={setIsJobOrderDetailsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Job Order Details</DialogTitle>
                        <DialogDescription>
                            View complete information for this job order
                        </DialogDescription>
                    </DialogHeader>

                    {selectedJobOrder && (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Job Order Number</Label>
                                    <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                                        {selectedJobOrder.formatted_job_order_id || `JO-${String(selectedJobOrder.job_order_id).padStart(4, '0')}`}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                                    <div className="mt-1">
                                        {getJobOrderStatusBadge(selectedJobOrder.status)}
                                    </div>
                                </div>
                            </div>

                            {/* Product Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Product Name</Label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedJobOrder.product_name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Size</Label>
                                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedJobOrder.size}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Quantity to Produce</Label>
                                    <p className="mt-1 text-sm text-gray-900 font-semibold">
                                        {selectedJobOrder.quantity_to_produce} units
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Production Date</Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedJobOrder.production_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Assignment Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Created By</Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedJobOrder.creator.name || selectedJobOrder.creator.username || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedJobOrder.assigned_user ? 
                                            (selectedJobOrder.assigned_user.name || selectedJobOrder.assigned_user.username || 'No Name') 
                                            : 'Unassigned'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedJobOrder.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {selectedJobOrder.started_at && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Started Date</Label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {new Date(selectedJobOrder.started_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedJobOrder.completed_at && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Completed Date</Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedJobOrder.completed_at).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {selectedJobOrder.cancelled_at && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Cancelled Date</Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedJobOrder.cancelled_at).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedJobOrder.notes && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Notes</Label>
                                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {selectedJobOrder.notes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!selectedJobOrder.notes && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Notes</Label>
                                    <p className="mt-1 text-sm text-gray-500 italic">No notes provided</p>
                                </div>
                            )}

                            {/* Cancellation Reason */}
                            {selectedJobOrder.cancellation_reason && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Cancellation Reason</Label>
                                    <div className="mt-1 p-3 bg-red-50 rounded-md border border-red-200">
                                        <p className="text-sm text-red-900 whitespace-pre-wrap">
                                            {selectedJobOrder.cancellation_reason}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsJobOrderDetailsModalOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Job Order Modal */}
            <Dialog open={showCancelJobOrderModal} onOpenChange={setShowCancelJobOrderModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancel Job Order</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for cancelling this job order.
                        </DialogDescription>
                    </DialogHeader>

                    {jobOrderToCancel && (
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium text-gray-900">
                                    {jobOrderToCancel.formatted_job_order_id || `JO-${String(jobOrderToCancel.job_order_id).padStart(4, '0')}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {jobOrderToCancel.product_name} ({jobOrderToCancel.size}) - {jobOrderToCancel.quantity_to_produce} units
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="cancellation_reason" className="text-sm font-medium text-gray-700">
                                    Reason for Cancellation <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="cancellation_reason"
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="Enter the reason for cancelling this job order..."
                                    className="mt-1 text-gray-900 bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                                setShowCancelJobOrderModal(false);
                                setJobOrderToCancel(null);
                                setCancellationReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmCancelJobOrder}
                            disabled={!cancellationReason.trim()}
                        >
                            Cancel Job Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Modal */}
            <Dialog open={showCancelOrderModal} onOpenChange={setShowCancelOrderModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel order #{orderToCancel?.formatted_order_id || `OR-${String(orderToCancel?.order_id || '').padStart(4, '0')}`} for {orderToCancel?.customer_name}?
                            <br />
                            Please provide a reason for cancellation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="order-cancellation-reason">Cancellation Reason *</Label>
                            <Textarea
                                id="order-cancellation-reason"
                                placeholder="Please explain why this order is being cancelled..."
                                value={orderCancellationReason}
                                onChange={(e) => setOrderCancellationReason(e.target.value)}
                                className="mt-1 text-gray-900 bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowCancelOrderModal(false);
                                setOrderToCancel(null);
                                setOrderCancellationReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleConfirmCancelOrder}
                            disabled={!orderCancellationReason.trim()}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
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