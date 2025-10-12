import { Head, Link, useForm, router } from '@inertiajs/react';
import { BarChart3, Package, Settings, ShoppingCart, Search, Download, Plus, Calendar, X, Users, LogOut, MoreHorizontal, Eye, CheckCircle, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DateFilterModal from '@/components/DateFilterModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    username: string;
    user_type: number;
}

interface Equipment {
    id: number;
    equipment_name: string;
    equipment_type: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    maintenances?: Maintenance[];
}

interface Maintenance {
    id: number;
    equipment_id: number;
    maintenance_type: string;
    status: string;
    description?: string;
    maintenance_date: string;
    cost?: number;
    created_at: string;
    updated_at: string;
}

interface MaintenanceFormData {
    equipment_id: string;
    maintenance_type: string;
    description: string;
    maintenance_date: string;
    cost: string;
}

interface EquipmentProps {
    user: User;
    equipment: Equipment[];
}

export default function Equipment({ user, equipment = [] }: EquipmentProps) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleLogout = () => {
        router.post('/logout');
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        equipment_name: '',
        equipment_type: '',
    });

    const { data: maintenanceData, setData: setMaintenanceData, post: postMaintenance, processing: maintenanceProcessing, errors: maintenanceErrors, reset: resetMaintenance } = useForm<MaintenanceFormData>({
        equipment_id: '',
        maintenance_type: '',
        description: '',
        maintenance_date: '',
        cost: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    const getStatusBadge = (status: string) => {
        if (status === 'operational') {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">● Operational</Badge>;
        } else if (status === 'under_maintenance') {
            return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">● Under Maintenance</Badge>;
        } else if (status === 'broken') {
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">● Broken</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/equipment', {
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            }
        });
    };

    const handleMaintenanceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postMaintenance('/admin/equipment/maintenance', {
            onSuccess: () => {
                resetMaintenance();
                setIsMaintenanceModalOpen(false);
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            }
        });
    };

    const markAsCompleted = (equipmentId: number) => {
        // Mark equipment as operational using Inertia router
        router.post(`/admin/equipment/${equipmentId}/mark-operational`, {}, {
            onSuccess: () => {
                // Optionally show success message or handle success
                console.log('Equipment marked as operational successfully');
            },
            onError: (errors) => {
                console.error('Error marking equipment as operational:', errors);
            }
        });
    };

    const viewDetails = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setIsViewDetailsModalOpen(true);
    };

    const handleExport = (startDate: string, endDate: string, format: 'pdf' | 'csv') => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            format: format
        });
        
        // Open export URL in new tab
        window.open(`/admin/equipment/export?${params.toString()}`, '_blank');
    };

    // success message
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    // Close dropdown


    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Equipment - RDA Tube Ice" />
            
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

                {/* Desktop Sidebar */}
                <aside className="w-64 bg-blue-600 min-h-screen text-white hidden md:block">
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
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                                        href="/admin/dashboard" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link 
                                        href="/admin/point-of-sales" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
                                        className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                <main className="flex-1 p-4 md:p-8 w-full min-w-0">
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Operation System</h1>
                                <p className="text-blue-100">Manage your Equipment</p>
                            </div>
                            <div className="flex space-x-3">
                                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => setIsMaintenanceModalOpen(true)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Maintenance
                                </Button>
                                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => setIsModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Equipment
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="bg-white text-blue-600 hover:bg-gray-100"
                                    onClick={() => setIsExportModalOpen(true)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-lg shadow">
                        {/* Equipment Section */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Equipment</h3>
                            
                            {/* Tabs */}
                            <Tabs defaultValue="equipment" className="mb-6">
                                <TabsList className="grid w-fit grid-cols-2">
                                    <TabsTrigger value="equipment">Equipment</TabsTrigger>
                                    <TabsTrigger value="maintenance">Maintenance Record</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="equipment" className="mt-6">
                                    {/* Search */}
                                    <div className="flex justify-end mb-4">
                                        <div className="relative w-full md:w-64">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="search"
                                                placeholder="Search"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Equipment Table - Desktop */}
                                    {!isMobile ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="font-semibold">Status ↕</TableHead>
                                                    <TableHead className="font-semibold">Equipment ID ↕</TableHead>
                                                    <TableHead className="font-semibold">Equipment Name</TableHead>
                                                    <TableHead className="font-semibold">Type ↕</TableHead>
                                                    <TableHead className="font-semibold">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {equipment.length > 0 ? (
                                                    equipment.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                {getStatusBadge(item.status)}
                                                            </TableCell>
                                                            <TableCell className="font-medium">{item.id.toString().padStart(4, '0')}</TableCell>
                                                            <TableCell>{item.equipment_name}</TableCell>
                                                            <TableCell>{item.equipment_type}</TableCell>
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
                                                                        <DropdownMenuItem onClick={() => viewDetails(item)}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        {item.status === 'under_maintenance' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => markAsCompleted(item.id)}
                                                                                className="text-green-600"
                                                                            >
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark as Completed
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                            No equipment found. Click "Add Equipment" to get started.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        /* Equipment Cards - Mobile */
                                        <div className="space-y-4">
                                            {equipment.length > 0 ? (
                                                equipment.map((item) => (
                                                    <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="font-semibold text-lg">#{item.id.toString().padStart(4, '0')}</div>
                                                            {getStatusBadge(item.status)}
                                                        </div>
                                                        
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Equipment Name:</span>
                                                                <span className="font-medium">{item.equipment_name}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Type:</span>
                                                                <span className="font-medium">{item.equipment_type}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex gap-2 mt-4">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => viewDetails(item)}
                                                                className="flex-1"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Button>
                                                            {item.status === 'under_maintenance' && (
                                                                <Button 
                                                                    variant="default" 
                                                                    size="sm"
                                                                    onClick={() => markAsCompleted(item.id)}
                                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Complete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    No equipment found. Click "Add Equipment" to get started.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Equipment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-96 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Add Equipment</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Equipment Name
                                </label>
                                <input
                                    type="text"
                                    value={data.equipment_name}
                                    onChange={(e) => setData('equipment_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter equipment name"
                                    required
                                />
                                {errors.equipment_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.equipment_name}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Equipment Type
                                </label>
                                <input
                                    type="text"
                                    value={data.equipment_type}
                                    onChange={(e) => setData('equipment_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter equipment type"
                                    required
                                />
                                {errors.equipment_type && (
                                    <p className="text-red-500 text-sm mt-1">{errors.equipment_type}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Adding...' : 'Add Equipment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Schedule Maintenance Modal */}
            {isMaintenanceModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-[500px] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Schedule Maintenance</h2>
                            <button
                                onClick={() => setIsMaintenanceModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                            {/* Equipment Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Equipment
                                </label>
                                <select
                                    value={maintenanceData.equipment_id}
                                    onChange={(e) => setMaintenanceData('equipment_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Equipment</option>
                                    {equipment.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.equipment_name}
                                        </option>
                                    ))}
                                </select>
                                {maintenanceErrors.equipment_id && (
                                    <p className="text-red-500 text-sm mt-1">{maintenanceErrors.equipment_id}</p>
                                )}
                            </div>
                            
                            {/* Maintenance Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maintenance Type
                                </label>
                                <select
                                    value={maintenanceData.maintenance_type}
                                    onChange={(e) => setMaintenanceData('maintenance_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Maintenance Type</option>
                                    <option value="preventive">Preventive</option>
                                    <option value="corrective">Corrective</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="routine">Routine</option>
                                </select>
                                {maintenanceErrors.maintenance_type && (
                                    <p className="text-red-500 text-sm mt-1">{maintenanceErrors.maintenance_type}</p>
                                )}
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={maintenanceData.description}
                                    onChange={(e) => setMaintenanceData('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    placeholder="Description of maintenance details and requirements"
                                    rows={3}
                                />
                                {maintenanceErrors.description && (
                                    <p className="text-red-500 text-sm mt-1">{maintenanceErrors.description}</p>
                                )}
                            </div>
                            
                            {/* Row with Maintenance Date and Cost */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maintenance Date
                                    </label>
                                    <input
                                        type="date"
                                        value={maintenanceData.maintenance_date}
                                        onChange={(e) => setMaintenanceData('maintenance_date', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {maintenanceErrors.maintenance_date && (
                                        <p className="text-red-500 text-sm mt-1">{maintenanceErrors.maintenance_date}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cost
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={maintenanceData.cost}
                                        onChange={(e) => setMaintenanceData('cost', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                    {maintenanceErrors.cost && (
                                        <p className="text-red-500 text-sm mt-1">{maintenanceErrors.cost}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsMaintenanceModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={maintenanceProcessing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {maintenanceProcessing ? 'Scheduling...' : 'Schedule Maintenance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {isViewDetailsModalOpen && selectedEquipment && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Equipment Details</h2>
                            <button
                                onClick={() => setIsViewDetailsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Equipment ID
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {selectedEquipment.id.toString().padStart(4, '0')}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <div>
                                        {getStatusBadge(selectedEquipment.status)}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Equipment Name
                                </label>
                                <div className="text-sm text-gray-900">
                                    {selectedEquipment.equipment_name}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Equipment Type
                                </label>
                                <div className="text-sm text-gray-900">
                                    {selectedEquipment.equipment_type}
                                </div>
                            </div>
                            
                            {selectedEquipment.created_at && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date Added
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {new Date(selectedEquipment.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                            
                            {/* Maintenance Records */}
                            {selectedEquipment.maintenances && selectedEquipment.maintenances.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maintenance History
                                    </label>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {selectedEquipment.maintenances.map((maintenance) => (
                                            <div key={maintenance.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="font-medium text-gray-700">Type:</span>
                                                        <span className="ml-1 capitalize">{maintenance.maintenance_type}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">Status:</span>
                                                        <span className="ml-1 capitalize">{maintenance.status.replace('_', ' ')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">Date:</span>
                                                        <span className="ml-1">{new Date(maintenance.maintenance_date).toLocaleDateString()}</span>
                                                    </div>
                                                    {maintenance.cost && (
                                                        <div>
                                                            <span className="font-medium text-gray-700">Cost:</span>
                                                            <span className="ml-1">₱{parseFloat(maintenance.cost.toString()).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {maintenance.description && (
                                                    <div className="mt-2">
                                                        <span className="font-medium text-gray-700">Description:</span>
                                                        <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-2">
                                                    Scheduled: {new Date(maintenance.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end pt-4">
                                <button onClick={() => {setIsViewDetailsModalOpen(false)}}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            <DateFilterModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Equipment Report"
                description="Select date range to export equipment maintenance records and status history."
            />
        </div>
    );
}