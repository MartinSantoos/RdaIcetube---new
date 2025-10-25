import { Head, Link, useForm, router } from '@inertiajs/react';
import { Package, Plus, AlertTriangle, CheckCircle, X, Search, Download, BarChart3, Cog, Settings, LogOut, Home, ShoppingCart, ClipboardList, Users, Menu, Trash2, Archive, RotateCcw, MoreHorizontal, Edit } from 'lucide-react';
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
}

interface InventoryProps {
    user: User;
    inventory: InventoryItem[];
    archivedInventory?: InventoryItem[];
}

export default function InventoryWorking({ user, inventory = [], archivedInventory = [] }: InventoryProps) {
    const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentStock, setCurrentStock] = useState('');
    const [sizeError, setSizeError] = useState('');
    const [customSizeMode, setCustomSizeMode] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    // Check if a product name and size combination already exists
    const getProductSizeCombinationStatus = (productName: string, size: string) => {
        const existingItem = inventory.find(item => 
            item.product_name.toLowerCase() === productName.toLowerCase() && 
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
        data: updateData,
        setData: setUpdateData,
        patch: updatePatch,
        processing: updateProcessing,
        errors: updateErrors,
        reset: resetUpdate
    } = useForm({
        operation: 'Add',
        quantity: '',
        price: ''
    });

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
        price: '',
        quantity: ''
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

    const handleUpdateStock = (item: InventoryItem) => {
        setSelectedItem(item);
        setSelectedItemId(item.inventory_id);
        setCurrentStock(item.quantity.toString());
        setUpdateData({
            operation: 'Add',
            quantity: '',
            price: item.price.toString()
        });
        setShowUpdateStockModal(true);
    };

    const handleAddInventory = () => {
        setAddData({
            product_name: '',
            size: '',
            price: '',
            quantity: ''
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

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !selectedItemId) return;
        
        updatePatch(`/admin/inventory/${selectedItemId}/update-stock`, {
            onSuccess: () => {
                setShowUpdateStockModal(false);
                resetUpdate();
                setSelectedItem(null);
                setSelectedItemId(null);
                
                // Show success message
                setSuccessMessage('Stock updated successfully!');
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
                console.error('Update failed:', errors);
                // Show error message if there's a validation error
                if (errors.quantity) {
                    // Keep modal open to show error
                    console.log('Quantity error:', errors.quantity);
                }
            }
        });
    };

    const handleArchiveInventory = (inventory_id: number) => {
        archiveItem(`/admin/inventory/${inventory_id}/archive`, {
            onSuccess: () => {
                setShowUpdateStockModal(false);
                setSelectedItem(null);
                setSelectedItemId(null);
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

    // Open confirmation dialogs
    const openConfirmDialog = (type: 'restore' | 'delete', item: InventoryItem) => {
        setConfirmDialog({ open: true, type, item });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, type: null, item: null });
    };

    // Open archive dialog
    const openArchiveDialog = (item: InventoryItem) => {
        setArchiveDialog({ open: true, item });
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
                                <p className="text-blue-100 text-sm md:text-base">Manage and track Inventory</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <Button 
                                    onClick={handleAddInventory}
                                    variant="secondary"
                                    className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base"
                                    title="Add new inventory item"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Inventory</span>
                                    <span className="sm:hidden">Add Inventory</span>
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
                                <TabsList className="grid w-fit grid-cols-2 bg-gray-200 p-1 rounded-xl h-12">
                                    <TabsTrigger 
                                        value="inventory" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Inventory
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
                                                        {item.inventory_id}
                                                    </TableCell>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell className="capitalize">{item.size}</TableCell>
                                                    <TableCell>₱{item.price}</TableCell>
                                                    <TableCell className="font-medium">{item.quantity}</TableCell>
                                                    <TableCell>09/12/25</TableCell>
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
                                                                <DropdownMenuItem onClick={() => handleUpdateStock(item)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Update Stock
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
                                                        <div className="font-medium text-sm text-gray-700">Inventory ID #{item.inventory_id}</div>
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
                                                        <div className="font-medium text-gray-900">09/12/25</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="pt-3 border-t border-gray-200 flex justify-end">
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
                                                            <DropdownMenuItem onClick={() => handleUpdateStock(item)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Update Stock
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
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? `No inventory items found matching "${searchTerm}"` : 'No inventory items available'}
                                        </div>
                                    )}
                                </div>
                                </TabsContent>
                                
                                <TabsContent value="archives" className="mt-6">
                                    {archivedInventory.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No archived inventory items found.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop Archives Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="font-semibold text-xs md:text-sm">ID</TableHead>
                                                            <TableHead className="font-semibold text-xs md:text-sm">Product</TableHead>
                                                            <TableHead className="font-semibold text-xs md:text-sm">Size</TableHead>
                                                            <TableHead className="font-semibold text-xs md:text-sm">Price</TableHead>
                                                            <TableHead className="font-semibold text-xs md:text-sm">Stock</TableHead>
                                                            <TableHead className="font-semibold text-xs md:text-sm">Archived At</TableHead>
                                                            <TableHead className="font-semibold text-xs md:text-sm">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {archivedInventory.map((item) => (
                                                            <TableRow key={item.inventory_id} className="hover:bg-gray-50 bg-gray-50">
                                                                <TableCell className="font-medium">
                                                                    {item.inventory_id}
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
                                            
                                            {/* Mobile Archive Cards */}
                                            <div className="md:hidden space-y-4">
                                                {archivedInventory.map((item) => (
                                                    <div key={item.inventory_id} className="bg-gray-100 rounded-lg p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium text-sm text-gray-600">ID #{item.inventory_id}</div>
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
                                        </>
                                    )}
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
                        <DialogTitle className="text-xl text-gray-900 font-medium">Add New Inventory</DialogTitle>
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
                                    required
                                />
                                {addErrors.product_name && (
                                    <p className="text-sm text-red-600 mt-1">{addErrors.product_name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                    <input
                                        id="size"
                                        type="text"
                                        list="sizeOptions"
                                        value={addData.size}
                                        onChange={(e) => {
                                            setAddData('size', e.target.value);
                                            setSizeError(''); // Clear error when size changes
                                        }}
                                        placeholder="Enter size or select from existing"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        style={{ 
                                            color: addData.size ? '#111827' : '#9CA3AF', 
                                            backgroundColor: 'white',
                                            fontSize: '0.875rem'
                                        }}
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
                                </div>
                                
                                <div>
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="Price"
                                        value={addData.price}
                                        onChange={(e) => setAddData('price', e.target.value)}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                    {addErrors.price && (
                                        <p className="text-sm text-red-600 mt-1">{addErrors.price}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="Quantity"
                                    value={addData.quantity}
                                    onChange={(e) => setAddData('quantity', e.target.value)}
                                    required
                                    min="0"
                                />
                                {addErrors.quantity && (
                                    <p className="text-sm text-red-600 mt-1">{addErrors.quantity}</p>
                                )}
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
                                    disabled={addProcessing || !addData.size || !addData.product_name || getProductSizeCombinationStatus(addData.product_name, addData.size).exists}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addProcessing ? 'Adding...' : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Inventory
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                </DialogContent>
            </Dialog>

            {/* Update Stock Modal */}
            <Dialog open={showUpdateStockModal && !!selectedItem} onOpenChange={(open) => {
                setShowUpdateStockModal(open);
            }}>
                <DialogContent className="w-full max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-gray-900 font-medium">
                            {selectedItem?.product_name} - {selectedItem?.size}
                        </DialogTitle>
                    </DialogHeader>
                        
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="current_stock">Current Stock</Label>
                                <Input
                                    id="current_stock"
                                    type="number"
                                    value={currentStock}
                                    readOnly
                                    className="bg-gray-50"
                                />
                            </div>
                            
                            {updateData.quantity && (
                                <div>
                                    <Label htmlFor="operation" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Operation</Label>
                                    <Select
                                        value={updateData.operation}
                                        onValueChange={(value) => setUpdateData('operation', value)}
                                    >
                                        <SelectTrigger style={{ backgroundColor: 'white', border: '1px solid #d1d5db', color: '#111827' }}>
                                            <SelectValue placeholder="Select operation" style={{ color: '#111827', opacity: '1' }} />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: 'white', border: '1px solid #d1d5db', zIndex: 9999 }}>
                                            <SelectItem value="Add" style={{ color: '#111827', backgroundColor: 'white' }}>Add</SelectItem>
                                            <SelectItem value="Subtract" style={{ color: '#111827', backgroundColor: 'white' }}>Subtract</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={updateData.quantity}
                                    onChange={(e) => setUpdateData('quantity', e.target.value)}
                                    min="1"
                                    placeholder="Enter quantity to add/subtract"
                                />
                                {updateErrors.quantity && (
                                    <p className="text-sm text-red-600 mt-1">{updateErrors.quantity}</p>
                                )}
                            </div>
                            
                            <div>
                                <Label htmlFor="price">Price (₱)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={updateData.price}
                                    onChange={(e) => setUpdateData('price', e.target.value)}
                                    required
                                    min="0"
                                    placeholder="Enter new price"
                                />
                                {updateErrors.price && (
                                    <p className="text-sm text-red-600 mt-1">{updateErrors.price}</p>
                                )}
                            </div>
                            
                            <div className="flex flex-col space-y-2 pt-4">
                                <div className="flex space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowUpdateStockModal(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={updateProcessing}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {updateProcessing ? 'Updating...' : 'Update Stock'}
                                    </Button>
                                </div>
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
        </div>
    );
}
