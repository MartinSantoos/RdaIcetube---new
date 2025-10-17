import { Head, Link, useForm, router } from '@inertiajs/react';
import { Package, Plus, AlertTriangle, CheckCircle, X, Search, Download, BarChart3, Settings, LogOut, Home, ShoppingCart, ClipboardList, Users, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useState, useEffect } from 'react';

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
}

interface InventoryProps {
    user: User;
    inventory: InventoryItem[];
}

export default function InventoryWorking({ user, inventory = [] }: InventoryProps) {
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
    const isMobile = useIsMobile();

    const handleLogout = () => {
        router.post('/logout');
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
        quantity: '',
        description: ''
    });

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
            quantity: '',
            description: ''
        });
        setSizeError(''); // Clear size error when opening modal
        setShowAddInventoryModal(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous size error
        setSizeError('');
        
        // Check for duplicate size before submitting
        const sizeStatus = getSizeStatus(addData.size);
        if (sizeStatus.exists) {
            setSizeError(`A product with size "${addData.size}" already exists in the inventory (${sizeStatus.item?.product_name}). Please choose a different size.`);
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

    const getStatusBadge = (status: string) => {
        if (status === 'critical') {
            return <Badge variant="destructive">Critical</Badge>;
        } else if (status === 'available') {
            return <Badge className="bg-green-500 text-white">In Stock</Badge>;
        } else if (status === 'out_of_stock') {
            return <Badge variant="secondary">Out of Stock</Badge>;
        }
        return <Badge variant="default">{status}</Badge>;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Inventory - RDA Tube Ice" />
            
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
                        {isMobile && (
                            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {user.name?.charAt(0) || 'A'}
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
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <Button 
                                    onClick={handleAddInventory}
                                    className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
                                    title="Add new inventory item"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Inventory</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
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
                            <h3 className="text-base md:text-lg font-semibold mb-4">Inventory</h3>
                            
                            {/* Tabs */}
                            <div className="mb-6">
                                <div className="flex space-x-4 md:space-x-8 mb-6">
                                    <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium text-sm">
                                        Inventory
                                    </button>
                                </div>
                                
                                {/* Search */}
                                <div className="flex justify-between items-center mb-4 gap-4">
                                    <div className="flex-1 md:flex-none">
                                        <div className="relative w-full md:w-64">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="search"
                                                placeholder="Search inventory..."
                                                className="pl-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Inventory Table */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="font-semibold text-xs md:text-sm">Status</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">ID</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Product</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Size</TableHead>
                                                <TableHead className="hidden sm:table-cell font-semibold text-xs md:text-sm">Price</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Stock</TableHead>
                                                <TableHead className="hidden lg:table-cell font-semibold text-xs md:text-sm">Date</TableHead>
                                                <TableHead className="font-semibold text-xs md:text-sm">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inventory.map((item) => (
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
                                                    {String(item.inventory_id).padStart(3, '0')}
                                                </TableCell>
                                                <TableCell>{item.product_name}</TableCell>
                                                <TableCell className="capitalize">{item.size}</TableCell>
                                                <TableCell>₱{item.price}</TableCell>
                                                <TableCell className="font-medium">{item.quantity}</TableCell>
                                                <TableCell>09/12/25</TableCell>
                                                <TableCell>
                                                    <Button
                                                        onClick={() => handleUpdateStock(item)}
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        Update Stocks
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add New Inventory Modal */}
            {showAddInventoryModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Add New Inventory</h3>
                                <p className="text-sm text-gray-600">Record New Product</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddInventoryModal(false);
                                    setSizeError('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

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
                                    <Label htmlFor="size">Size</Label>
                                    <div className="relative">
                                        <Input
                                            id="size"
                                            type="text"
                                            placeholder="Enter size or select from existing"
                                            value={addData.size}
                                            onChange={(e) => {
                                                setAddData('size', e.target.value);
                                                setSizeError(''); // Clear error when size changes
                                            }}
                                            list="size-options"
                                            className="mb-2"
                                        />
                                        <datalist id="size-options">
                                            {['small', 'medium', 'large'].map((size) => (
                                                <option key={size} value={size} />
                                            ))}
                                            {getExistingSizes().filter(size => 
                                                !['small', 'medium', 'large'].includes(size.toLowerCase())
                                            ).map((size) => (
                                                <option key={size} value={size} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                        Common sizes: 
                                        {['small', 'medium', 'large'].map((size, index) => (
                                            <span key={size}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAddData('size', size);
                                                        setSizeError('');
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                                                >
                                                    {size}
                                                </button>
                                                {index < 2 && ', '}
                                            </span>
                                        ))}
                                    </div>
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
                            
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Details"
                                    value={addData.description}
                                    onChange={(e) => setAddData('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                />
                                {addErrors.description && (
                                    <p className="text-sm text-red-600 mt-1">{addErrors.description}</p>
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
                                    disabled={addProcessing || !addData.size || getSizeStatus(addData.size).exists}
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
                    </div>
                </div>
            )}

            {/* Update Stock Modal */}
            {showUpdateStockModal && selectedItem && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {selectedItem.product_name} - {selectedItem.size}
                            </h3>
                            <button
                                onClick={() => setShowUpdateStockModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">Update Stocks</p>
                        
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
                                    <Label htmlFor="operation">Operation</Label>
                                    <Select
                                        value={updateData.operation}
                                        onValueChange={(value) => setUpdateData('operation', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Add">Add</SelectItem>
                                            <SelectItem value="Subtract">Subtract</SelectItem>
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
                            
                            <div className="flex space-x-2 pt-4">
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
                        </form>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            <DateFilterModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Inventory Report"
                description="Select date range to export inventory stock levels and transaction history."
            />
        </div>
    );
}
