import { Head, Link, useForm, router } from '@inertiajs/react';
import { Package, Plus, AlertTriangle, CheckCircle, X, Search, Download, BarChart3, Cog, Settings, LogOut, Home, ShoppingCart, ClipboardList, Users, Menu, Trash2, Archive, RotateCcw, MoreHorizontal, Edit, Clock, Play, Square, Eye, Calendar, Monitor } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import DateFilterModal from '@/components/DateFilterModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface User {
    id: number;
    name?: string;
    username: string;
    user_type: number;
}

interface InventoryItem {
    inventory_id: number;
    product_name: string;
    size: string;
    price: number;
    quantity: number;
    date_created: string;
    status: string;
    archived_at?: string;
    formatted_inventory_id?: string;
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
    archived_at?: string;
}

interface CustomerOrder {
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
    archived_at?: string;
}

interface Employee {
    id: number;
    name: string;
}

interface InventoryProduct {
    product_name: string;
    sizes: string[];
}

interface InventoryProps {
    user: User;
    inventory: InventoryItem[];
    archivedInventory?: InventoryItem[];
    jobOrders: JobOrder[];
    archivedJobOrders?: JobOrder[];
    customerOrders: CustomerOrder[];
    employees: Employee[];
    inventoryProducts: InventoryProduct[];
}

// Utility function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function InventoryWorking({ user, inventory = [], archivedInventory = [], jobOrders = [], archivedJobOrders = [], customerOrders = [], employees = [], inventoryProducts = [] }: InventoryProps) {
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [showCreateJobOrderModal, setShowCreateJobOrderModal] = useState(false);
    const [showJobOrderDetailsModal, setShowJobOrderDetailsModal] = useState(false);
    const [showCancelJobOrderModal, setShowCancelJobOrderModal] = useState(false);
    const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
    const [jobOrderToCancel, setJobOrderToCancel] = useState<JobOrder | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [sizeError, setSizeError] = useState('');
    const [customSizeMode, setCustomSizeMode] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [jobOrderSearchTerm, setJobOrderSearchTerm] = useState('');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{open: boolean, type: 'restore' | 'delete' | null, item: InventoryItem | null}>({
        open: false,
        type: null,
        item: null
    });
    const [archiveDialog, setArchiveDialog] = useState<{open: boolean, item: InventoryItem | null}>({
        open: false,
        item: null
    });
    const [jobOrderArchiveDialog, setJobOrderArchiveDialog] = useState<{open: boolean, jobOrder: JobOrder | null}>({
        open: false,
        jobOrder: null
    });
    const [jobOrderArchiveProcessing, setJobOrderArchiveProcessing] = useState(false);
    const [jobOrderConfirmDialog, setJobOrderConfirmDialog] = useState<{open: boolean, type: 'restore' | 'delete' | null, jobOrder: JobOrder | null}>({
        open: false,
        type: null,
        jobOrder: null
    });
    const [pendingOrdersWarning, setPendingOrdersWarning] = useState<{open: boolean, item: InventoryItem | null, pendingCount: number}>({
        open: false,
        item: null,
        pendingCount: 0
    });
    const [showStockDeductionModal, setShowStockDeductionModal] = useState(false);
    const [itemToDeduct, setItemToDeduct] = useState<InventoryItem | null>(null);
    const [deductionQuantity, setDeductionQuantity] = useState('');
    const [deductionReason, setDeductionReason] = useState('');
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
        window.open(`/admin/inventory/export?${params.toString()}`, '_blank');
    };

    // Get all existing sizes from inventory
    const getExistingSizes = () => {
        return inventory.map(item => item.size);
    };

    // Get default size options
    const getDefaultSizes = () => {
        return ['small', 'medium', 'large'];
    };

    // Check if a size already exists
    const getSizeStatus = (size: string) => {
        const existingItem = inventory.find(item => item.size.toLowerCase() === size.toLowerCase());
        return existingItem ? { exists: true, item: existingItem } : { exists: false, item: null };
    };

    // Check if a size already exists in any product
    const getProductSizeCombinationStatus = (productName: string, size: string) => {
        const existingItem = inventory.find(item => 
            item.size.toLowerCase() === size.toLowerCase()
        );
        return existingItem ? { exists: true, item: existingItem } : { exists: false, item: null };
    };

    // Get all available size options (default + existing custom sizes)
    const getAllSizeOptions = () => {
        const defaultSizes = getDefaultSizes();
        const existingSizes = getExistingSizes();
        const customSizes = existingSizes.filter(size => 
            !defaultSizes.map(s => s.toLowerCase()).includes(size.toLowerCase())
        );
        return [...defaultSizes, ...customSizes];
    };

    const {
        data: addData,
        setData: setAddData,
        post: addPost,
        processing: addProcessing,
        errors: addErrors,
        reset: resetAdd
    } = useForm({
        product_name: '',
        size: '',
        price: ''
    });

    const {
        data: jobOrderData,
        setData: setJobOrderData,
        post: jobOrderPost,
        processing: jobOrderProcessing,
        errors: jobOrderErrors,
        reset: resetJobOrder
    } = useForm({
        product_name: '',
        size: '',
        quantity_to_produce: '',
        production_date: '',
        assigned_to: '',
        notes: ''
    });

    const {
        delete: deleteItem,
        processing: deleteProcessing
    } = useForm({});

    const {
        patch: archiveItem,
        processing: archiveProcessing
    } = useForm({});

    const {
        patch: restoreItem,
        processing: restoreProcessing
    } = useForm({});

    const handleAddInventory = () => {
        setAddData({
            product_name: '',
            size: '',
            price: ''
        });
        setSizeError(''); // Clear size error when opening modal
        setShowAddInventoryModal(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous size error
        setSizeError('');
        
        // Check for duplicate product name and size combination before submitting
        const combinationStatus = getProductSizeCombinationStatus(addData.product_name, addData.size);
        if (combinationStatus.exists) {
            setSizeError(`A product with the name "${addData.product_name}" and size "${addData.size}" already exists in the inventory. Please choose a different product name or size combination.`);
            return;
        }
        
        addPost('/admin/inventory', {
            onSuccess: () => {
                setShowAddInventoryModal(false);
                resetAdd();
                setSizeError(''); // Clear any size errors
                
                // Show success message
                setSuccessMessage('Inventory item added successfully!');
                setShowSuccess(true);
                
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
                
                // Force reload
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            },
            onError: (errors: any) => {
                console.error('Add failed:', errors);
            }
        });
    };

    const handleCreateJobOrder = () => {
        setJobOrderData({
            product_name: '',
            size: '',
            quantity_to_produce: '',
            production_date: '',
            assigned_to: '',
            notes: ''
        });
        setShowCreateJobOrderModal(true);
    };

    const handleJobOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        jobOrderPost('/admin/inventory/job-orders', {
            onSuccess: () => {
                setShowCreateJobOrderModal(false);
                resetJobOrder();
                setSuccessMessage('Job order created successfully!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
                
                // Force reload
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        });
    };

    const handleJobOrderStatusUpdate = (jobOrderId: number, newStatus: string) => {
        router.patch(`/admin/inventory/job-orders/${jobOrderId}/status`, {
            status: newStatus
        });
    };

    const handleDeleteJobOrder = (jobOrderId: number) => {
        if (confirm('Are you sure you want to delete this job order?')) {
            router.delete(`/admin/inventory/job-orders/${jobOrderId}`);
        }
    };

    // Archive job order functions
    const openJobOrderArchiveDialog = (jobOrder: JobOrder) => {
        setJobOrderArchiveDialog({ open: true, jobOrder });
    };

    const closeJobOrderArchiveDialog = () => {
        setJobOrderArchiveDialog({ open: false, jobOrder: null });
    };

    const handleArchiveJobOrder = (jobOrderId: number) => {
        setJobOrderArchiveProcessing(true);
        
        // Frontend-only solution: Make an actual API call to archive the job order
        router.patch(`/admin/inventory/job-orders/${jobOrderId}/archive`, {}, {
            onSuccess: () => {
                setJobOrderArchiveDialog({ open: false, jobOrder: null });
                setJobOrderArchiveProcessing(false);
                
                setSuccessMessage('Job order archived successfully!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors) => {
                setJobOrderArchiveProcessing(false);
                console.error('Archive failed:', errors);
                
                // If API fails, show error message
                setSuccessMessage('Failed to archive job order. Please check if the backend route exists.');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 4000);
                
                // Close the dialog even on error
                setJobOrderArchiveDialog({ open: false, jobOrder: null });
            }
        });
    };

    const handleViewJobOrderDetails = (jobOrder: JobOrder) => {
        setSelectedJobOrder(jobOrder);
        setShowJobOrderDetailsModal(true);
    };

    const handleCancelJobOrder = (jobOrder: JobOrder) => {
        setJobOrderToCancel(jobOrder);
        setCancellationReason('');
        setShowCancelJobOrderModal(true);
    };

    const handleConfirmCancelJobOrder = () => {
        if (jobOrderToCancel && cancellationReason.trim()) {
            router.patch(`/admin/inventory/job-orders/${jobOrderToCancel.job_order_id}/status`, {
                status: 'cancelled',
                cancellation_reason: cancellationReason.trim()
            });
            setShowCancelJobOrderModal(false);
            setJobOrderToCancel(null);
            setCancellationReason('');
        }
    };

    const getAvailableSizes = (productName: string) => {
        const product = inventoryProducts.find(p => p.product_name === productName);
        return product ? product.sizes : [];
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

    const handleArchiveInventory = (inventory_id: number) => {
        archiveItem(`/admin/inventory/${inventory_id}/archive`, {
            onSuccess: () => {
                setArchiveDialog({ open: false, item: null });
                
                // Show success message
                setSuccessMessage('Inventory item archived successfully!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);

                // Force reload
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            },
            onError: (errors: any) => {
                console.error('Archive failed:', errors);
                alert('Failed to archive inventory item. Please try again.');
            }
        });
    };

    const handleRestoreInventory = (inventory_id: number) => {
        restoreItem(`/admin/inventory/${inventory_id}/restore`, {
            onSuccess: () => {
                closeConfirmDialog();
                // Show success message
                setSuccessMessage('Inventory item restored successfully!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);

                // Force reload
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            },
            onError: (errors: any) => {
                console.error('Restore failed:', errors);
                alert('Failed to restore inventory item. Please try again.');
            }
        });
    };

    const handleDeleteInventory = (inventory_id: number) => {
        deleteItem(`/admin/inventory/${inventory_id}`, {
            onSuccess: () => {
                closeConfirmDialog();
                // Show success message
                setSuccessMessage('Inventory item deleted permanently!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);

                // Force reload
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            },
            onError: (errors: any) => {
                console.error('Delete failed:', errors);
                alert('Failed to delete inventory item. Please try again.');
            }
        });
    };

    // Job Order restore/delete handlers
    const handleRestoreJobOrder = (jobOrderId: number) => {
        router.patch(`/admin/inventory/job-orders/${jobOrderId}/restore`, {}, {
            onSuccess: () => {
                closeJobOrderConfirmDialog();
                setSuccessMessage('Job order restored successfully!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors: any) => {
                console.error('Restore failed:', errors);
                alert('Failed to restore job order. Please try again.');
            }
        });
    };

    const handleDeleteArchivedJobOrder = (jobOrderId: number) => {
        router.delete(`/admin/inventory/job-orders/${jobOrderId}`, {
            onSuccess: () => {
                closeJobOrderConfirmDialog();
                setSuccessMessage('Job order deleted permanently!');
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors: any) => {
                console.error('Delete failed:', errors);
                closeJobOrderConfirmDialog();
                alert('Failed to delete job order. Please try again.');
            }
        });
    };

    // Open confirmation dialogs
    const openConfirmDialog = (type: 'restore' | 'delete', item: InventoryItem) => {
        setConfirmDialog({ open: true, type, item });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, type: null, item: null });
    };

    // Job Order confirmation dialog functions
    const openJobOrderConfirmDialog = (type: 'restore' | 'delete', jobOrder: JobOrder) => {
        setJobOrderConfirmDialog({ open: true, type, jobOrder });
    };

    const closeJobOrderConfirmDialog = () => {
        setJobOrderConfirmDialog({ open: false, type: null, jobOrder: null });
    };

    // Open archive dialog
    const openArchiveDialog = (item: InventoryItem) => {
        // Check if there are pending job orders for this product size
        const pendingJobOrders = jobOrders.filter(order => 
            order.product_name === item.product_name && 
            order.size === item.size && 
            order.status === 'pending'
        );

        // Check if there are pending customer orders for this product size
        // Customer orders are for ice tube products, so we check by size and status
        // Assuming customer orders are for ice tube products
        const pendingCustomerOrders = customerOrders.filter(order => 
            order.size === item.size && 
            order.status === 'pending'
        );

        const totalPendingOrders = pendingJobOrders.length + pendingCustomerOrders.length;

        if (totalPendingOrders > 0) {
            setPendingOrdersWarning({ 
                open: true, 
                item, 
                pendingCount: totalPendingOrders 
            });
            return;
        }

        setArchiveDialog({ open: true, item });
    };

    // Stock deduction handlers
    const handleDeductStock = (item: InventoryItem) => {
        setItemToDeduct(item);
        setDeductionQuantity('');
        setDeductionReason('');
        setShowStockDeductionModal(true);
    };

    const handleConfirmStockDeduction = () => {
        if (!itemToDeduct || !deductionQuantity || !deductionReason.trim()) {
            alert('Please fill in all fields.');
            return;
        }

        const quantity = parseInt(deductionQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }

        if (quantity > itemToDeduct.quantity) {
            alert(`Cannot deduct ${quantity} items. Only ${itemToDeduct.quantity} items available.`);
            return;
        }

        router.patch(`/admin/inventory/${itemToDeduct.inventory_id}/deduct-stock`, {
            quantity: quantity,
            reason: deductionReason.trim()
        }, {
            onSuccess: () => {
                setShowStockDeductionModal(false);
                setItemToDeduct(null);
                setDeductionQuantity('');
                setDeductionReason('');
                
                setSuccessMessage(`Successfully deducted ${quantity} units from ${itemToDeduct.product_name} (${itemToDeduct.size})`);
                setShowSuccess(true);
                
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            },
            onError: (errors: any) => {
                console.error('Stock deduction failed:', errors);
                alert('Failed to deduct stock. Please try again.');
            }
        });
    };

    const closeArchiveDialog = () => {
        setArchiveDialog({ open: false, item: null });
    };
  
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    // Calculate stock statistics
    const inStockCount = inventory.filter(item => item.status === 'available').length;
    const criticalStockCount = inventory.filter(item => item.status === 'critical').length;

    // Filter inventory based on search term
    const filteredInventory = inventory.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            item.product_name.toLowerCase().includes(searchLower) ||
            item.size.toLowerCase().includes(searchLower) ||
            item.inventory_id.toString().includes(searchLower)
        );
    });

    // Filter job orders based on search term
    const filteredJobOrders = jobOrders.filter((jobOrder: JobOrder) => {
        const searchLower = jobOrderSearchTerm.toLowerCase();
        return (
            jobOrder.job_order_number.toLowerCase().includes(searchLower) ||
            jobOrder.product_name.toLowerCase().includes(searchLower) ||
            jobOrder.size.toLowerCase().includes(searchLower) ||
            jobOrder.status.toLowerCase().includes(searchLower) ||
            (jobOrder.assigned_user && 
                (jobOrder.assigned_user.name?.toLowerCase().includes(searchLower) ||
                 jobOrder.assigned_user.username?.toLowerCase().includes(searchLower)))
        );
    });

    const getStatusBadge = (status: string) => {
        if (status === 'critical') {
            return <Badge variant="destructive">Critical</Badge>;
        } else if (status === 'available') {
            return <Badge variant="default">In Stock</Badge>;
        } else if (status === 'out_of_stock') {
            return <Badge variant="secondary">Out of Stock</Badge>;
        }
        return <Badge variant="default">{status}</Badge>;
    };

    // Add CSS overrides for select components with proper hover states
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            /* Force visible text in all select components */
            [data-radix-select-trigger] {
                color: #111827 !important;
                background-color: white !important;
                border: 1px solid #d1d5db !important;
            }
            [data-radix-select-value] {
                color: #111827 !important;
                opacity: 1 !important;
            }
            [data-radix-select-content] {
                background-color: white !important;
                border: 1px solid #d1d5db !important;
                z-index: 9999 !important;
            }
            [data-radix-select-item] {
                color: #111827 !important;
                background-color: white !important;
                padding: 0.5rem !important;
            }
            [data-radix-select-item]:hover,
            [data-radix-select-item][data-highlighted] {
                background-color: #e5e7eb !important;
                color: #111827 !important;
            }
            [data-radix-select-item]:focus {
                background-color: #e5e7eb !important;
                color: #111827 !important;
                outline: none !important;
            }
            /* Alternative selectors */
            .select-trigger, .select-trigger * {
                color: #111827 !important;
                background-color: white !important;
            }
            .select-value, .select-value * {
                color: #111827 !important;
                opacity: 1 !important;
            }
            .select-content, .select-content * {
                color: #111827 !important;
                background-color: white !important;
            }
            .select-item, .select-item * {
                color: #111827 !important;
                background-color: white !important;
            }
            .select-item:hover, .select-item:hover * {
                color: #111827 !important;
                background-color: #e5e7eb !important;
            }
            /* Shadcn UI specific overrides */
            .relative button[role="combobox"] {
                color: #111827 !important;
                background-color: white !important;
            }
            .relative button[role="combobox"] span {
                color: #111827 !important;
                opacity: 1 !important;
            }
            div[role="listbox"] {
                background-color: white !important;
            }
            div[role="option"] {
                color: #111827 !important;
                background-color: white !important;
            }
            div[role="option"]:hover,
            div[role="option"][data-highlighted="true"] {
                color: #111827 !important;
                background-color: #e5e7eb !important;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Inventory - RDA Tube Ice" />
            
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
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                <main className={`flex-1 p-4 md:p-8 w-full min-w-0 ${isMobile ? '' : 'ml-64'}`}>
                    {/* Success Alert */}
                    {showSuccess && (
                        <div className="mb-4 md:mb-6">
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">
                                    {successMessage}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">Inventory</h1>
                                <p className="text-blue-100 text-sm md:text-base">Manage products and job orders</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <Button 
                                    onClick={handleAddInventory}
                                    variant="secondary"
                                    className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base"
                                    title="Create a new product entry"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Product</span>
                                    <span className="sm:hidden">Add Product</span>
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base"
                                    onClick={() => setIsExportModalOpen(true)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                        {/* In Stock Card */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">In Stock</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{inStockCount}</p>
                                </div>
                                <div className="w-10 md:w-12 h-10 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Critical Stock Card */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">Critical Stock</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{criticalStockCount}</p>
                                </div>
                                <div className="w-10 md:w-12 h-10 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-lg shadow">
                        {/* Inventory Section */}
                        <div className="p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Inventory</h3>
                            
                            {/* Tabs */}
                            <Tabs defaultValue="inventory" className="mb-6">
                                <TabsList className="grid w-fit grid-cols-3 bg-gray-200 p-1 rounded-xl h-12">
                                    <TabsTrigger 
                                        value="inventory" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Inventory
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="job-orders" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Job Orders
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="archives" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Archives
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="inventory" className="mt-6">
                                {/* Search */}
                                <div className="flex justify-between items-center mb-4 gap-4">
                                    <div className="flex-1 md:flex-none">
                                        <div className="relative w-full md:w-64">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="search"
                                                placeholder="Search inventory..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Inventory Display - Responsive Design */}
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="font-semibold text-xs md:text-sm">Status</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Inventory ID</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Product</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Size</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Price</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Stock</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Date</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInventory.length > 0 ? (
                                            filteredInventory.map((item) => (
                                                <TableRow key={item.inventory_id}>
                                                    <TableCell>
                                                        {item.status === 'critical' ? (
                                                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
                                                        ) : item.status === 'available' ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                                                        ) : (
                                                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Out of Stock</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.formatted_inventory_id || `INV-${String(item.inventory_id).padStart(4, '0')}`}
                                                    </TableCell>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell className="capitalize">{item.size}</TableCell>
                                                    <TableCell>₱{item.price}</TableCell>
                                                    <TableCell className="font-medium">{item.quantity}</TableCell>
                                                    <TableCell>
                                                        {new Date(item.date_created).toLocaleDateString('en-US', {
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            year: '2-digit'
                                                        })}
                                                    </TableCell>
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
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleDeductStock(item)}
                                                                    className="text-orange-600"
                                                                >
                                                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                                                    Deduct Stock
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    onClick={() => openArchiveDialog(item)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Archive className="mr-2 h-4 w-4" />
                                                                    Archive Item
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                    {searchTerm ? `No inventory items found matching "${searchTerm}"` : 'No inventory items available'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredInventory.length > 0 ? (
                                        filteredInventory.map((item) => (
                                            <div key={item.inventory_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-700">
                                                            {item.formatted_inventory_id || `INV-${String(item.inventory_id).padStart(4, '0')}`}
                                                        </div>
                                                        <div className="font-semibold text-lg text-gray-900">{item.product_name}</div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {item.status === 'critical' ? (
                                                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
                                                        ) : item.status === 'available' ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                                                        ) : (
                                                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Out of Stock</Badge>
                                                        )}
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
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleDeductStock(item)}
                                                                    className="text-orange-600"
                                                                >
                                                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                                                    Deduct Stock
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    onClick={() => openArchiveDialog(item)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Archive className="mr-2 h-4 w-4" />
                                                                    Archive Item
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                    <div>
                                                        <span className="text-gray-700">Size:</span>
                                                        <div className="font-medium capitalize text-gray-900">{item.size}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-700">Price:</span>
                                                        <div className="font-medium text-gray-900">₱{item.price}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-700">Stock:</span>
                                                        <div className="font-medium text-gray-900">{item.quantity}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-700">Date:</span>
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(item.date_created).toLocaleDateString('en-US', {
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                                year: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? `No inventory items found matching "${searchTerm}"` : 'No inventory items available'}
                                        </div>
                                    )}
                                </div>
                                </TabsContent>
                                
                                <TabsContent value="job-orders" className="mt-6">
                                    {/* Job Orders Header */}
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Job Orders</h2>
                                            <p className="text-gray-600">Manage production orders and track stock updates</p>
                                        </div>
                                        <Button 
                                            onClick={handleCreateJobOrder}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition duration-200"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Job Order
                                        </Button>
                                    </div>

                                    {/* Job Orders Search */}
                                    <div className="flex items-center space-x-2 mb-6">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                type="text"
                                                placeholder="Search job orders..."
                                                value={jobOrderSearchTerm}
                                                onChange={(e) => setJobOrderSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Job Orders Table - Desktop */}
                                    <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-semibold text-gray-700">Job Order #</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Product</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Size</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Assigned To</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Production Date</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredJobOrders.length > 0 ? (
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
                                                                {jobOrder.assigned_user ? 
                                                                    (jobOrder.assigned_user.name || jobOrder.assigned_user.username || 'No Name') 
                                                                    : 'Unassigned'
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {new Date(jobOrder.production_date).toLocaleDateString()}
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
                                                                        {jobOrder.status !== 'pending' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => openJobOrderArchiveDialog(jobOrder)}
                                                                                className="text-orange-600"
                                                                            >
                                                                                <Archive className="w-4 h-4 mr-2" />
                                                                                Archive
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                            {jobOrderSearchTerm ? `No job orders found matching "${jobOrderSearchTerm}"` : 'No job orders available'}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-4">
                                        {filteredJobOrders.length > 0 ? (
                                            filteredJobOrders.map((jobOrder) => (
                                                <div key={jobOrder.job_order_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="font-medium text-sm text-blue-600">
                                                                {jobOrder.formatted_job_order_id || `JO-${String(jobOrder.job_order_id).padStart(4, '0')}`}
                                                            </div>
                                                            <div className="font-semibold text-lg text-gray-900">{jobOrder.product_name}</div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {getJobOrderStatusBadge(jobOrder.status)}
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
                                                                    {jobOrder.status !== 'pending' && (
                                                                        <DropdownMenuItem 
                                                                            onClick={() => openJobOrderArchiveDialog(jobOrder)}
                                                                            className="text-orange-600"
                                                                        >
                                                                            <Archive className="w-4 h-4 mr-2" />
                                                                            Archive
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                        <div>
                                                            <span className="text-gray-700">Size:</span>
                                                            <div className="font-medium capitalize text-gray-900">{jobOrder.size}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-700">Quantity:</span>
                                                            <div className="font-medium text-gray-900">{jobOrder.quantity_to_produce}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-700">Assigned To:</span>
                                                            <div className="font-medium text-gray-900">
                                                                {jobOrder.assigned_user ? 
                                                                    (jobOrder.assigned_user.name || jobOrder.assigned_user.username || 'No Name') 
                                                                    : 'Unassigned'
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-700">Production Date:</span>
                                                            <div className="font-medium text-gray-900">
                                                                {new Date(jobOrder.production_date).toLocaleDateString('en-US', {
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    year: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                                                <div className="text-gray-500">
                                                    {jobOrderSearchTerm ? `No job orders found matching "${jobOrderSearchTerm}"` : 'No job orders available'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="archives" className="mt-6">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Archives</h2>
                                                <p className="text-gray-600">View and manage archived inventory items and job orders</p>
                                            </div>
                                        </div>

                                        {/* Archive Sub-tabs */}
                                        <Tabs defaultValue="inventory-archives" className="w-full">
                                            <TabsList className="grid w-fit grid-cols-2 bg-gray-200 p-1 rounded-xl h-12">
                                                <TabsTrigger 
                                                    value="inventory-archives" 
                                                    className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                                >
                                                    Inventory Items ({archivedInventory.length})
                                                </TabsTrigger>
                                                <TabsTrigger 
                                                    value="job-order-archives" 
                                                    className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                                >
                                                    Job Orders ({archivedJobOrders.length})
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="inventory-archives" className="mt-6">
                                                {archivedInventory.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                                                        <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Items</h3>
                                                        <p>No inventory items have been archived yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                                        {/* Desktop Table */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-50">
                                                                        <TableHead className="font-semibold text-gray-700">ID</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Product</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Size</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Price</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Archived</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {archivedInventory.map((item) => (
                                                                        <TableRow key={item.inventory_id} className="hover:bg-gray-50">
                                                                            <TableCell className="font-medium">
                                                                                {item.formatted_inventory_id || `INV-${String(item.inventory_id).padStart(4, '0')}`}
                                                                            </TableCell>
                                                                            <TableCell className="text-gray-700">{item.product_name}</TableCell>
                                                                            <TableCell className="capitalize text-gray-700">{item.size}</TableCell>
                                                                            <TableCell className="text-gray-700">₱{item.price}</TableCell>
                                                                            <TableCell className="font-medium text-gray-700">{item.quantity}</TableCell>
                                                                            <TableCell className="text-gray-700">
                                                                                {item.archived_at ? new Date(item.archived_at).toLocaleDateString() : 'N/A'}
                                                                            </TableCell>
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
                                                                                        <DropdownMenuItem 
                                                                                            onClick={() => openConfirmDialog('restore', item)}
                                                                                            className="text-green-600"
                                                                                        >
                                                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                                                            Restore Item
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem 
                                                                                            onClick={() => openConfirmDialog('delete', item)}
                                                                                            className="text-red-600"
                                                                                        >
                                                                                            <Trash2 className="mr-2 h-4 w-4" />
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

                                                        {/* Mobile Cards */}
                                                        <div className="md:hidden p-4 space-y-4">
                                                            {archivedInventory.map((item) => (
                                                                <div key={item.inventory_id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <div className="font-medium text-sm text-gray-600">
                                                                                {item.formatted_inventory_id || `INV-${String(item.inventory_id).padStart(4, '0')}`}
                                                                            </div>
                                                                            <div className="font-semibold text-lg text-gray-800">{item.product_name}</div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Badge variant="secondary" className="bg-gray-200 text-gray-700">Archived</Badge>
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
                                                                                    <DropdownMenuItem 
                                                                                        onClick={() => openConfirmDialog('restore', item)}
                                                                                        className="text-green-600"
                                                                                    >
                                                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                                                        Restore Item
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem 
                                                                                        onClick={() => openConfirmDialog('delete', item)}
                                                                                        className="text-red-600"
                                                                                    >
                                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                                        Delete Permanently
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                                        <div>
                                                                            <span className="text-gray-600">Size:</span>
                                                                            <div className="font-medium capitalize text-gray-800">{item.size}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Price:</span>
                                                                            <div className="font-medium text-gray-800">₱{item.price}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Stock:</span>
                                                                            <div className="font-medium text-gray-800">{item.quantity}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Archived:</span>
                                                                            <div className="font-medium text-gray-800">
                                                                                {item.archived_at ? new Date(item.archived_at).toLocaleDateString() : 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="job-order-archives" className="mt-6">
                                                {archivedJobOrders.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                                                        <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Job Orders</h3>
                                                        <p>No job orders have been archived yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                                        {/* Desktop Table */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-50">
                                                                        <TableHead className="font-semibold text-gray-700">Job Order #</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Product</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Size</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Archived At</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {archivedJobOrders.map((jobOrder) => (
                                                                        <TableRow key={jobOrder.job_order_id} className="hover:bg-gray-50">
                                                                            <TableCell className="font-medium text-blue-600">
                                                                                {jobOrder.formatted_job_order_id || `JO-${String(jobOrder.job_order_id).padStart(4, '0')}`}
                                                                            </TableCell>
                                                                            <TableCell className="text-gray-700">{jobOrder.product_name}</TableCell>
                                                                            <TableCell className="text-gray-700">{jobOrder.size}</TableCell>
                                                                            <TableCell className="text-gray-700">{jobOrder.quantity_to_produce}</TableCell>
                                                                            <TableCell>
                                                                                {getJobOrderStatusBadge(jobOrder.status)}
                                                                            </TableCell>
                                                                            <TableCell className="text-gray-700">
                                                                                {jobOrder.archived_at ? new Date(jobOrder.archived_at).toLocaleDateString() : 'N/A'}
                                                                            </TableCell>
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
                                                                                        <DropdownMenuItem 
                                                                                            onClick={() => openJobOrderConfirmDialog('restore', jobOrder)}
                                                                                            className="text-green-600"
                                                                                        >
                                                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                                                            Restore Job Order
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem 
                                                                                            onClick={() => openJobOrderConfirmDialog('delete', jobOrder)}
                                                                                            className="text-red-600"
                                                                                        >
                                                                                            <Trash2 className="mr-2 h-4 w-4" />
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

                                                        {/* Mobile Cards */}
                                                        <div className="md:hidden p-4 space-y-4">
                                                            {archivedJobOrders.map((jobOrder) => (
                                                                <div key={jobOrder.job_order_id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <div className="font-medium text-sm text-blue-600">
                                                                                {jobOrder.formatted_job_order_id || `JO-${String(jobOrder.job_order_id).padStart(4, '0')}`}
                                                                            </div>
                                                                            <div className="font-semibold text-lg text-gray-800">{jobOrder.product_name}</div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            {getJobOrderStatusBadge(jobOrder.status)}
                                                                            <Badge variant="secondary" className="bg-gray-200 text-gray-700">Archived</Badge>
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
                                                                                    <DropdownMenuItem 
                                                                                        onClick={() => openJobOrderConfirmDialog('restore', jobOrder)}
                                                                                        className="text-green-600"
                                                                                    >
                                                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                                                        Restore Job Order
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem 
                                                                                        onClick={() => openJobOrderConfirmDialog('delete', jobOrder)}
                                                                                        className="text-red-600"
                                                                                    >
                                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                                        Delete Permanently
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                                        <div>
                                                                            <span className="text-gray-600">Size:</span>
                                                                            <div className="font-medium text-gray-800">{jobOrder.size}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Quantity:</span>
                                                                            <div className="font-medium text-gray-800">{jobOrder.quantity_to_produce}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Archived:</span>
                                                                            <div className="font-medium text-gray-800">
                                                                                {jobOrder.archived_at ? new Date(jobOrder.archived_at).toLocaleDateString() : 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add New Inventory Modal */}
            <Dialog open={showAddInventoryModal} onOpenChange={(open) => {
                setShowAddInventoryModal(open);
                if (!open) {
                    setSizeError('');
                }
            }}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-gray-900 font-medium">Add New Product</DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Create a new product entry. Stock levels will be automatically managed through job orders.
                        </p>
                    </DialogHeader>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="product_name">Name</Label>
                                <Input
                                    id="product_name"
                                    type="text"
                                    placeholder="Product Name"
                                    value={addData.product_name}
                                    onChange={(e) => setAddData('product_name', e.target.value)}
                                    className={addErrors.product_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                    required
                                />
                                {addErrors.product_name && (
                                    <p className="text-sm text-red-600 mt-1">{addErrors.product_name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="size">Size</Label>
                                    <Input
                                        id="size"
                                        type="text"
                                        list="sizeOptions"
                                        value={addData.size}
                                        onChange={(e) => {
                                            setAddData('size', e.target.value);
                                            setSizeError(''); // Clear error when size changes
                                        }}
                                        placeholder="Enter size or select from existing"
                                        className={`${
                                            addErrors.size || sizeError || (addData.size && getProductSizeCombinationStatus(addData.product_name, addData.size).exists)
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                : ''
                                        }`}
                                        required
                                    />
                                    <datalist id="sizeOptions">
                                        <option value="small" style={{ color: '#111827', backgroundColor: 'white' }}>small</option>
                                        <option value="medium" style={{ color: '#111827', backgroundColor: 'white' }}>medium</option>
                                        <option value="large" style={{ color: '#111827', backgroundColor: 'white' }}>large</option>
                                        <option value="Extra Large" style={{ color: '#111827', backgroundColor: 'white' }}>Extra Large</option>
                                        {getExistingSizes().filter(size => 
                                            !['small', 'medium', 'large', 'Extra Large'].includes(size)
                                        ).map((size) => (
                                            <option key={size} value={size} style={{ color: '#111827', backgroundColor: 'white' }}>
                                                {size}
                                            </option>
                                        ))}
                                    </datalist>
                                    {sizeError && (
                                        <p className="text-sm text-red-600 mt-1">{sizeError}</p>
                                    )}
                                    {addErrors.size && (
                                        <p className="text-sm text-red-600 mt-1">{addErrors.size}</p>
                                    )}
                                    {addData.size && getProductSizeCombinationStatus(addData.product_name, addData.size).exists && (
                                        <p className="text-sm text-red-600 mt-1">
                                            Size "{addData.size}" already exists in inventory. Please choose a different size.
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="Price"
                                        value={addData.price}
                                        onChange={(e) => setAddData('price', e.target.value)}
                                        className={addErrors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                    {addErrors.price && (
                                        <p className="text-sm text-red-600 mt-1">{addErrors.price}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddInventoryModal(false);
                                        setSizeError(''); // Clear size error when closing
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={addProcessing}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addProcessing ? 'Creating...' : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Product
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                </DialogContent>
            </Dialog>

            {/* Export Modal */}
            <DateFilterModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Inventory Report"
                description="Select date range to export inventory stock levels and transaction history."
            />

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                            {confirmDialog.type === 'restore' && 'Restore Inventory Item'}
                            {confirmDialog.type === 'delete' && 'Permanently Delete Inventory Item'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === 'restore' && confirmDialog.item && 
                                `Are you sure you want to restore "${confirmDialog.item.product_name} (${confirmDialog.item.size})"? It will be moved back to the active inventory.`
                            }
                            {confirmDialog.type === 'delete' && confirmDialog.item && 
                                <>
                                    Are you sure you want to permanently delete "{confirmDialog.item.product_name} ({confirmDialog.item.size})"?
                                    <br />
                                    <span className="text-red-600 font-medium">⚠️ Warning: This action cannot be undone!</span>
                                    <br />
                                    All inventory data will be permanently removed from the system.
                                </>
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={closeConfirmDialog}
                            disabled={restoreProcessing || deleteProcessing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            className={
                                confirmDialog.type === 'restore' 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : "bg-red-600 hover:bg-red-700"
                            }
                            disabled={restoreProcessing || deleteProcessing}
                            onClick={() => {
                                if (confirmDialog.type === 'restore' && confirmDialog.item) {
                                    handleRestoreInventory(confirmDialog.item.inventory_id);
                                } else if (confirmDialog.type === 'delete' && confirmDialog.item) {
                                    handleDeleteInventory(confirmDialog.item.inventory_id);
                                }
                            }}
                        >
                            {(restoreProcessing || deleteProcessing) ? 'Processing...' : (
                                confirmDialog.type === 'restore' ? 'Restore' : 'Delete Permanently'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Archive Confirmation Dialog */}
            <Dialog open={archiveDialog.open} onOpenChange={(open) => !open && closeArchiveDialog()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                            Archive Inventory Item
                        </DialogTitle>
                        <DialogDescription>
                            {archiveDialog.item && 
                                `Are you sure you want to archive "${archiveDialog.item.product_name} (${archiveDialog.item.size})"? It will be moved to the archives and can be restored later.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={closeArchiveDialog}
                            disabled={archiveProcessing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={archiveProcessing}
                            onClick={() => {
                                if (archiveDialog.item) {
                                    handleArchiveInventory(archiveDialog.item.inventory_id);
                                }
                            }}
                        >
                            {archiveProcessing ? 'Archiving...' : 'Archive'}
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

            {/* Create Job Order Modal */}
            <Dialog open={showCreateJobOrderModal} onOpenChange={setShowCreateJobOrderModal}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-gray-900 font-medium">Create Job Order</DialogTitle>
                        <DialogDescription>
                            Create a new production order. Completed job orders will automatically update inventory stock levels.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleJobOrderSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="product_name" className="text-sm font-medium text-gray-700">Product Name</Label>
                            <Select
                                value={jobOrderData.product_name}
                                onValueChange={(value) => setJobOrderData({ ...jobOrderData, product_name: value, size: '' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventory && inventory.length > 0 ? (
                                        Array.from(new Set(inventory.map(item => item.product_name))).map((productName) => (
                                            <SelectItem key={productName} value={productName}>
                                                {productName}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="" disabled>
                                            No products available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {jobOrderErrors.product_name && (
                                <p className="text-red-500 text-sm mt-1">{jobOrderErrors.product_name}</p>
                            )}
                            {(!inventory || inventory.length === 0) && (
                                <p className="text-yellow-600 text-sm mt-1">
                                    ⚠️ No products available. Please create inventory items first.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="size" className="text-sm font-medium text-gray-700">Size</Label>
                            <Select
                                value={jobOrderData.size}
                                onValueChange={(value) => setJobOrderData({ ...jobOrderData, size: value })}
                                disabled={!jobOrderData.product_name}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={jobOrderData.product_name ? "Select size" : "Select a product first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobOrderData.product_name && inventory ? 
                                        Array.from(new Set(
                                            inventory
                                                .filter(item => item.product_name === jobOrderData.product_name)
                                                .map(item => item.size)
                                        )).map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {size.charAt(0).toUpperCase() + size.slice(1)}
                                            </SelectItem>
                                        ))
                                        : null
                                    }
                                </SelectContent>
                            </Select>
                            {jobOrderErrors.size && (
                                <p className="text-red-500 text-sm mt-1">{jobOrderErrors.size}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="quantity_to_produce" className="text-sm font-medium text-gray-700">Quantity to Produce</Label>
                            <Input
                                id="quantity_to_produce"
                                type="number"
                                min="1"
                                value={jobOrderData.quantity_to_produce}
                                onChange={(e) => setJobOrderData({ ...jobOrderData, quantity_to_produce: e.target.value })}
                                className="mt-1"
                                placeholder="Enter quantity"
                                required
                            />
                            {jobOrderErrors.quantity_to_produce && (
                                <p className="text-red-500 text-sm mt-1">{jobOrderErrors.quantity_to_produce}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="production_date" className="text-sm font-medium text-gray-700">Production Date</Label>
                            <div className="relative">
                                <Input
                                    id="production_date"
                                    type="date"
                                    placeholder="dd/mm/yyyy"
                                    value={jobOrderData.production_date}
                                    onChange={(e) => setJobOrderData({ ...jobOrderData, production_date: e.target.value })}
                                    onFocus={(e) => e.target.showPicker?.()}
                                    className={`mt-1 w-full h-12 text-base pr-10 ${jobOrderErrors.production_date ? 'border-red-500' : ''}`}
                                    min={getTodayDate()}
                                    required
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                            {jobOrderErrors.production_date && (
                                <p className="text-red-500 text-sm mt-1">{jobOrderErrors.production_date}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="assigned_to" className="text-sm font-medium text-gray-700">Assign To (Optional)</Label>
                            <Select
                                value={jobOrderData.assigned_to}
                                onValueChange={(value) => setJobOrderData({ ...jobOrderData, assigned_to: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee (auto-assign if empty)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees && employees.length > 0 ? (
                                        employees.map((employee) => (
                                            <SelectItem key={employee.id} value={employee.id.toString()}>
                                                {employee.name || 'Unnamed Employee'}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="" disabled>No employees available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                If no employee is selected, the system will automatically assign an available employee with no pending job orders.
                            </p>
                            {jobOrderErrors.assigned_to && (
                                <p className="text-red-500 text-sm mt-1">{jobOrderErrors.assigned_to}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={jobOrderData.notes}
                                onChange={(e) => setJobOrderData({ ...jobOrderData, notes: e.target.value })}
                                className="mt-1 text-gray-900 bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Add any notes or special instructions..."
                                rows={3}
                            />
                            {jobOrderErrors.notes && (
                                <p className="text-red-500 text-sm mt-1">{jobOrderErrors.notes}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowCreateJobOrderModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={jobOrderProcessing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {jobOrderProcessing ? 'Creating...' : 'Create Job Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Job Order Details Modal */}
            <Dialog open={showJobOrderDetailsModal} onOpenChange={setShowJobOrderDetailsModal}>
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
                                    <p className="mt-1 text-sm text-gray-900 font-mono">
                                        {selectedJobOrder.job_order_number}
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
                            onClick={() => setShowJobOrderDetailsModal(false)}
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
                                    {jobOrderToCancel.job_order_number}
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

            {/* Job Order Archive Confirmation Dialog */}
            <Dialog open={jobOrderArchiveDialog.open} onOpenChange={(open) => !open && closeJobOrderArchiveDialog()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                            Archive Job Order
                        </DialogTitle>
                        <DialogDescription>
                            {jobOrderArchiveDialog.jobOrder && 
                                `Are you sure you want to archive job order "${jobOrderArchiveDialog.jobOrder.formatted_job_order_id || `JO-${String(jobOrderArchiveDialog.jobOrder.job_order_id).padStart(4, '0')}`}" for ${jobOrderArchiveDialog.jobOrder.product_name} (${jobOrderArchiveDialog.jobOrder.size})? It will be moved to the archives and can be restored later.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={closeJobOrderArchiveDialog}
                            disabled={jobOrderArchiveProcessing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={jobOrderArchiveProcessing}
                            onClick={() => {
                                if (jobOrderArchiveDialog.jobOrder) {
                                    handleArchiveJobOrder(jobOrderArchiveDialog.jobOrder.job_order_id);
                                }
                            }}
                        >
                            {jobOrderArchiveProcessing ? 'Archiving...' : 'Archive'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stock Deduction Modal */}
            <Dialog open={showStockDeductionModal} onOpenChange={setShowStockDeductionModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-orange-600">Deduct Stock</DialogTitle>
                        <DialogDescription>
                            Reduce inventory for {itemToDeduct?.product_name} ({itemToDeduct?.size})
                            <br />
                            Current stock: <span className="font-medium">{itemToDeduct?.quantity} units</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="deduction-quantity">Quantity to Deduct *</Label>
                            <Input
                                id="deduction-quantity"
                                type="number"
                                placeholder="Enter quantity to deduct"
                                value={deductionQuantity}
                                onChange={(e) => setDeductionQuantity(e.target.value)}
                                min="1"
                                max={itemToDeduct?.quantity || 0}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="deduction-reason">Reason for Deduction *</Label>
                            <Textarea
                                id="deduction-reason"
                                placeholder=""
                                value={deductionReason}
                                onChange={(e) => setDeductionReason(e.target.value)}
                                className="mt-1 text-gray-900 bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowStockDeductionModal(false);
                                setItemToDeduct(null);
                                setDeductionQuantity('');
                                setDeductionReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleConfirmStockDeduction}
                            disabled={!deductionQuantity || !deductionReason.trim()}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Deduct Stock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Job Order Confirmation Dialog */}
            <Dialog open={jobOrderConfirmDialog.open} onOpenChange={(open) => !open && closeJobOrderConfirmDialog()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                            {jobOrderConfirmDialog.type === 'restore' && 'Restore Job Order'}
                            {jobOrderConfirmDialog.type === 'delete' && 'Permanently Delete Job Order'}
                        </DialogTitle>
                        <DialogDescription>
                            {jobOrderConfirmDialog.type === 'restore' && jobOrderConfirmDialog.jobOrder && 
                                `Are you sure you want to restore "${jobOrderConfirmDialog.jobOrder.formatted_job_order_id || `JO-${String(jobOrderConfirmDialog.jobOrder.job_order_id).padStart(4, '0')}`}" for ${jobOrderConfirmDialog.jobOrder.product_name} (${jobOrderConfirmDialog.jobOrder.size})? It will be moved back to the active job orders.`
                            }
                            {jobOrderConfirmDialog.type === 'delete' && jobOrderConfirmDialog.jobOrder && 
                                <>
                                    Are you sure you want to permanently delete "{jobOrderConfirmDialog.jobOrder.formatted_job_order_id || `JO-${String(jobOrderConfirmDialog.jobOrder.job_order_id).padStart(4, '0')}`}" for {jobOrderConfirmDialog.jobOrder.product_name} ({jobOrderConfirmDialog.jobOrder.size})?
                                    <br />
                                    <span className="text-red-600 font-medium">⚠️ Warning: This action cannot be undone!</span>
                                    <br />
                                    All job order data will be permanently removed from the system.
                                </>
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={closeJobOrderConfirmDialog}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            className={
                                jobOrderConfirmDialog.type === 'restore' 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : "bg-red-600 hover:bg-red-700"
                            }
                            onClick={() => {
                                if (jobOrderConfirmDialog.type === 'restore' && jobOrderConfirmDialog.jobOrder) {
                                    handleRestoreJobOrder(jobOrderConfirmDialog.jobOrder.job_order_id);
                                } else if (jobOrderConfirmDialog.type === 'delete' && jobOrderConfirmDialog.jobOrder) {
                                    handleDeleteArchivedJobOrder(jobOrderConfirmDialog.jobOrder.job_order_id);
                                }
                            }}
                        >
                            {jobOrderConfirmDialog.type === 'restore' ? 'Restore' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pending Orders Warning Dialog */}
            <Dialog open={pendingOrdersWarning.open} onOpenChange={(open) => !open && setPendingOrdersWarning({ open: false, item: null, pendingCount: 0 })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                            Cannot Archive Product
                        </DialogTitle>
                        <DialogDescription className="space-y-2">
                            <p>
                                Cannot archive <strong>{pendingOrdersWarning.item?.product_name} ({pendingOrdersWarning.item?.size})</strong> because there {pendingOrdersWarning.pendingCount === 1 ? 'is' : 'are'} still <strong>{pendingOrdersWarning.pendingCount}</strong> pending {pendingOrdersWarning.pendingCount === 1 ? 'order' : 'orders'} for this product size.
                            </p>
                            <p className="text-red-600 font-medium">
                                Please complete or cancel the pending orders first before archiving this inventory item.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setPendingOrdersWarning({ open: false, item: null, pendingCount: 0 })}
                        >
                            Understood
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
