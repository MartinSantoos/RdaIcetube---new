import { Head, Link, useForm, router } from '@inertiajs/react';
import { BarChart3, Package, Cog, Settings, ShoppingCart, Search, Download, Plus, Calendar, X, Users, LogOut, MoreHorizontal, Eye, CheckCircle, Menu, AlertTriangle, Wrench, Monitor } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import DateFilterModal from '@/components/DateFilterModal';
import { StatusBadge } from '@/components/enhanced/status-badge';
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
    broken_reason?: string;
    created_at?: string;
    updated_at?: string;
    maintenances?: Maintenance[];
    selectedMaintenance?: Maintenance;
    formatted_equipment_id?: string;
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
    equipment_status_at_maintenance?: string;
    equipment_broken_reason_at_maintenance?: string;
    operational_reason?: string;
    broken_reason?: string;
}

interface MaintenanceFormData {
    equipment_id: string;
    maintenance_type: string;
    description: string;
    maintenance_date: string;
    cost: string;
    is_recurring: boolean;
    recurring_frequency: string;
    recurring_interval: string;
    recurring_end_date: string;
}

interface EquipmentProps {
    user: User;
    equipment: Equipment[];
}

export default function Equipment({ user, equipment = [] }: EquipmentProps) {
    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const [showSuccess, setShowSuccess] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    // Filter equipment based on search term
    const filteredEquipment = equipment.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            item.equipment_name.toLowerCase().includes(searchLower) ||
            item.equipment_type.toLowerCase().includes(searchLower) ||
            item.id.toString().includes(searchLower) ||
            (item.formatted_equipment_id || `EQ-${String(item.id).padStart(4, '0')}`).toLowerCase().includes(searchLower) ||
            item.status.toLowerCase().includes(searchLower)
        );
    });

    // CSS overrides for form input visibility in equipment modals
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            /* Equipment Modal Form Input Visibility */
            .equipment-modal input,
            .equipment-modal select,
            .equipment-modal textarea,
            .equipment-modal option {
                color: #111827 !important;
                background-color: white !important;
            }
            
            .equipment-modal input:hover,
            .equipment-modal select:hover,
            .equipment-modal textarea:hover {
                background-color: #f9fafb !important;
            }
            
            .equipment-modal input:focus,
            .equipment-modal select:focus,
            .equipment-modal textarea:focus {
                color: #111827 !important;
                background-color: white !important;
            }
            
            .equipment-modal input::placeholder,
            .equipment-modal textarea::placeholder {
                color: #9ca3af !important;
            }
            
            /* Equipment Modal Header and Text Visibility */
            .equipment-modal h2,
            .equipment-modal h3,
            .equipment-modal label,
            .equipment-modal p,
            .equipment-modal span,
            .equipment-modal div {
                color: #111827 !important;
            }
            
            .equipment-modal .text-xl {
                color: #111827 !important;
                font-weight: 600 !important;
            }
            
            .equipment-modal .text-sm {
                color: #374151 !important;
            }
            
            .equipment-modal .font-semibold,
            .equipment-modal .font-medium {
                color: #111827 !important;
            }
            
            /* View Details Modal Text Visibility */
            .equipment-details-modal,
            .equipment-details-modal div,
            .equipment-details-modal span,
            .equipment-details-modal p,
            .equipment-details-modal label {
                color: #111827 !important;
            }
            
            .equipment-details-modal .text-gray-700 {
                color: #374151 !important;
            }
            
            .equipment-details-modal .text-gray-600 {
                color: #4b5563 !important;
            }
            
            .equipment-details-modal .font-medium {
                color: #111827 !important;
                font-weight: 500 !important;
            }
            
            /* Additional Radix UI Select overrides if present */
            [data-radix-select-trigger],
            [data-radix-select-value],
            [data-radix-select-content],
            [data-radix-select-item] {
                color: #111827 !important;
                background-color: white !important;
            }
            
            [data-radix-select-item]:hover {
                background-color: #f3f4f6 !important;
                color: #111827 !important;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
        is_recurring: false,
        recurring_frequency: 'monthly',
        recurring_interval: '1',
        recurring_end_date: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isBrokenModalOpen, setIsBrokenModalOpen] = useState(false);
    const [isOperationalModalOpen, setIsOperationalModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [equipmentToBroken, setEquipmentToBroken] = useState<Equipment | null>(null);
    const [equipmentToOperational, setEquipmentToOperational] = useState<Equipment | null>(null);
    const [brokenReason, setBrokenReason] = useState('');
    const [operationalReason, setOperationalReason] = useState('');

    // Enhanced status badge using StatusBadge component
    const getStatusBadge = (status: string) => {
        return <StatusBadge status={status} size="sm" />;
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

    const markAsCompleted = (equipment: Equipment) => {
        setEquipmentToOperational(equipment);
        setIsOperationalModalOpen(true);
    };

    const markAsBroken = (equipment: Equipment) => {
        setEquipmentToBroken(equipment);
        setIsBrokenModalOpen(true);
    };

    const handleMarkAsBroken = () => {
        if (!equipmentToBroken || !brokenReason.trim()) {
            alert('Please provide a reason for marking as broken');
            return;
        }

        // Mark equipment as broken using Inertia router
        router.post(`/admin/equipment/${equipmentToBroken.id}/mark-broken`, {
            reason: brokenReason
        }, {
            onSuccess: () => {
                console.log('Equipment marked as broken successfully');
                setIsBrokenModalOpen(false);
                setBrokenReason('');
                setEquipmentToBroken(null);
            },
            onError: (errors) => {
                console.error('Error marking equipment as broken:', errors);
            }
        });
    };

    const handleMarkAsOperational = () => {
        if (!equipmentToOperational || !operationalReason.trim()) {
            alert('Please provide a reason for marking as operational');
            return;
        }

        // Mark equipment as operational using Inertia router
        router.post(`/admin/equipment/${equipmentToOperational.id}/mark-operational`, {
            reason: operationalReason
        }, {
            onSuccess: () => {
                console.log('Equipment marked as operational successfully');
                setIsOperationalModalOpen(false);
                setOperationalReason('');
                setEquipmentToOperational(null);
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

                {/* Desktop Sidebar */}
                <aside className="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-blue-600 overflow-y-auto text-white hidden md:block">
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

                {/* Mobile Sidebar */}
                {isMobile && sidebarOpen && (
                    <aside className="
                        fixed inset-y-0 left-0 z-50 w-64 
                        bg-blue-600 text-white
                        transform translate-x-0 
                        transition-transform duration-300 ease-in-out
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
                                        <Cog className="w-5 h-5" />
                                        <span>Equipment</span>
                                    </Link>
                                    <a 
                                        href="/admin/product-monitoring" 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Monitor className="w-5 h-5" />
                                        <span>Product Monitoring</span>
                                    </a>
                                    <Link 
                                        href="/admin/sales-report" 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setSidebarOpen(false)}
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
                <main className={`flex-1 p-4 md:p-8 w-full min-w-0 ${isMobile ? '' : 'ml-64'}`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Equipment and Maintenance Record</h1>
                                <p className="text-blue-100">Manage your Equipment</p>
                            </div>
                            <div className="flex flex-wrap gap-2 md:space-x-3">
                                <Button variant="secondary" size="sm" onClick={() => setIsMaintenanceModalOpen(true)} className="bg-white text-blue-600 hover:bg-gray-100 text-xs md:text-sm whitespace-nowrap">
                                    <Calendar className="h-4 w-4 mr-1 md:mr-2" />
                                    <span className="hidden sm:inline">Schedule</span>
                                    <span className="sm:hidden">Sched</span>
                                    <span className="hidden md:inline"> Maintenance</span>
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)} className="bg-white text-blue-600 hover:bg-gray-100 text-xs md:text-sm whitespace-nowrap">
                                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                                    <span className="hidden sm:inline">Add</span>
                                    <span className="sm:hidden">Add</span>
                                    <span className="hidden md:inline"> Equipment</span>
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => setIsExportModalOpen(true)}
                                    className="bg-white text-blue-600 hover:bg-gray-100 text-xs md:text-sm whitespace-nowrap"
                                >
                                    <Download className="h-4 w-4 mr-1 md:mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        {/* Operational Equipment Card */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">Operational</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {equipment.filter(item => item.status === 'operational').length}
                                    </p>
                                </div>
                                <div className="w-10 md:w-12 h-10 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Under Maintenance Equipment Card */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">Under Maintenance</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {equipment.filter(item => item.status === 'under_maintenance').length}
                                    </p>
                                </div>
                                <div className="w-10 md:w-12 h-10 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Wrench className="w-5 md:w-6 h-5 md:h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        {/* Broken Equipment Card */}
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">Broken</h3>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {equipment.filter(item => item.status === 'broken').length}
                                    </p>
                                </div>
                                <div className="w-10 md:w-12 h-10 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-lg shadow">
                        {/* Equipment Section */}
                        <div className="p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Equipment</h3>                        
                            {/* Tabs */}
                            <Tabs defaultValue="equipment" className="mb-6">
                                <TabsList className="grid w-fit grid-cols-2 bg-gray-200 p-1 rounded-xl h-12">
                                    <TabsTrigger 
                                        value="equipment" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Equipment
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="maintenance" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Maintenance
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="equipment" className="mt-6">
                                    {/* Search */}
                                    <div className="flex justify-start mb-4">
                                        <div className="relative w-full md:w-64">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="search"
                                                placeholder="Search Equipment..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Equipment Table - Desktop */}
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Equipment ID</TableHead>
                                                    <TableHead className="font-semibold">Equipment Name</TableHead>
                                                    <TableHead className="font-semibold">Type</TableHead>
                                                    <TableHead className="font-semibold">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredEquipment.length > 0 ? (
                                                    filteredEquipment.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                {getStatusBadge(item.status)}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {item.formatted_equipment_id || `EQ-${String(item.id).padStart(4, '0')}`}
                                                            </TableCell>
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
                                                                                onClick={() => markAsCompleted(item)}
                                                                                className="text-green-600"
                                                                            >
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark as Completed
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {item.status === 'broken' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => markAsCompleted(item)}
                                                                                className="text-green-600"
                                                                            >
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark as Operational
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {item.status === 'under_maintenance' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => markAsBroken(item)}
                                                                                className="text-red-600"
                                                                            >
                                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                                Mark as Broken
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
                                    </div>

                                    {/* Equipment Cards - Mobile */}
                                    <div className="md:hidden space-y-4">
                                            {filteredEquipment.length > 0 ? (
                                                filteredEquipment.map((item) => (
                                                    <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="font-semibold text-lg text-gray-900">
                                                                #{item.formatted_equipment_id || `EQ-${String(item.id).padStart(4, '0')}`}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusBadge(item.status)}
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
                                                                                onClick={() => markAsCompleted(item)}
                                                                                className="text-green-600"
                                                                            >
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark as Completed
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {item.status === 'broken' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => markAsCompleted(item)}
                                                                                className="text-green-600"
                                                                            >
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark as Operational
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {item.status === 'under_maintenance' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => markAsBroken(item)}
                                                                                className="text-red-600"
                                                                            >
                                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                                Mark as Broken
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-700">Equipment Name:</span>
                                                                <div className="font-medium text-gray-900">{item.equipment_name}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-700">Type:</span>
                                                                <div className="font-medium text-gray-900">{item.equipment_type}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    No equipment found. Click "Add Equipment" to get started.
                                                </div>
                                            )}
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="maintenance" className="mt-6">
                                    <div className="mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Maintenance Records</h3>
                                            <p className="text-sm text-gray-600">Track and manage equipment maintenance history</p>
                                        </div>
                                    </div>

                                    {/* Search Bar for Maintenance */}
                                    <div className="mb-6">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="text"
                                                placeholder="Search maintenance records..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Maintenance Records Table - Desktop */}
                                    <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="text-left">Equipment</TableHead>
                                                    <TableHead className="text-left">Maintenance Type</TableHead>
                                                    <TableHead className="text-left">Status</TableHead>
                                                    <TableHead className="text-left">Date</TableHead>
                                                    <TableHead className="text-left">Cost</TableHead>
                                                    <TableHead className="text-left">Description</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {equipment
                                                    .filter(item => item.maintenances && item.maintenances.length > 0)
                                                    .flatMap(item => 
                                                        item.maintenances!.map(maintenance => ({
                                                            equipment: item,
                                                            maintenance: maintenance
                                                        }))
                                                    )
                                                    .filter(({ equipment: item, maintenance }) => {
                                                        const searchLower = searchTerm.toLowerCase();
                                                        return (
                                                            item.equipment_name.toLowerCase().includes(searchLower) ||
                                                            maintenance.maintenance_type.toLowerCase().includes(searchLower) ||
                                                            maintenance.status.toLowerCase().includes(searchLower) ||
                                                            (maintenance.description && maintenance.description.toLowerCase().includes(searchLower))
                                                        );
                                                    })
                                                    .sort((a, b) => new Date(b.maintenance.maintenance_date).getTime() - new Date(a.maintenance.maintenance_date).getTime())
                                                    .map(({ equipment: item, maintenance }) => (
                                                        <TableRow key={`${item.id}-${maintenance.id}`} className="hover:bg-gray-50">
                                                            <TableCell className="font-medium">
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{item.equipment_name}</div>
                                                                    <div className="text-sm text-gray-500">{item.equipment_type}</div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                                    {maintenance.maintenance_type}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(maintenance.status)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-sm">
                                                                    <div className="font-medium">
                                                                        {new Date(maintenance.maintenance_date).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                    <div className="text-gray-500">
                                                                        {new Date(maintenance.created_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })} (Scheduled)
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {maintenance.cost ? (
                                                                    <span className="font-medium text-green-600">
                                                                        ₱{Number(maintenance.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">Not specified</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="max-w-xs">
                                                                    {maintenance.description ? (
                                                                        <p className="text-sm text-gray-600 truncate" title={maintenance.description}>
                                                                            {maintenance.description}
                                                                        </p>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">No description</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setSelectedEquipment({
                                                                                ...item,
                                                                                selectedMaintenance: maintenance
                                                                            } as any);
                                                                            setIsViewDetailsModalOpen(true);
                                                                        }}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        {maintenance.status === 'scheduled' && (
                                                                            <DropdownMenuItem onClick={() => {
                                                                                // Here you can add functionality to mark as completed
                                                                                router.patch(`/admin/equipment/maintenance/${maintenance.id}/complete`);
                                                                            }}>
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark Complete
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>

                                        {equipment.filter(item => item.maintenances && item.maintenances.length > 0)
                                            .flatMap(item => item.maintenances!)
                                            .filter(maintenance => {
                                                const searchLower = searchTerm.toLowerCase();
                                                return maintenance.maintenance_type.toLowerCase().includes(searchLower) ||
                                                       maintenance.status.toLowerCase().includes(searchLower) ||
                                                       (maintenance.description && maintenance.description.toLowerCase().includes(searchLower));
                                            }).length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                {searchTerm ? 'No maintenance records found matching your search.' : 'No maintenance records available.'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Maintenance Records Cards - Mobile */}
                                    <div className="md:hidden space-y-4">
                                        {equipment
                                            .filter(item => item.maintenances && item.maintenances.length > 0)
                                            .flatMap(item => 
                                                item.maintenances!.map(maintenance => ({
                                                    equipment: item,
                                                    maintenance: maintenance
                                                }))
                                            )
                                            .filter(({ equipment: item, maintenance }) => {
                                                const searchLower = searchTerm.toLowerCase();
                                                return (
                                                    item.equipment_name.toLowerCase().includes(searchLower) ||
                                                    maintenance.maintenance_type.toLowerCase().includes(searchLower) ||
                                                    maintenance.status.toLowerCase().includes(searchLower) ||
                                                    (maintenance.description && maintenance.description.toLowerCase().includes(searchLower))
                                                );
                                            })
                                            .sort((a, b) => new Date(b.maintenance.maintenance_date).getTime() - new Date(a.maintenance.maintenance_date).getTime())
                                            .length > 0 ? (
                                                equipment
                                                    .filter(item => item.maintenances && item.maintenances.length > 0)
                                                    .flatMap(item => 
                                                        item.maintenances!.map(maintenance => ({
                                                            equipment: item,
                                                            maintenance: maintenance
                                                        }))
                                                    )
                                                    .filter(({ equipment: item, maintenance }) => {
                                                        const searchLower = searchTerm.toLowerCase();
                                                        return (
                                                            item.equipment_name.toLowerCase().includes(searchLower) ||
                                                            maintenance.maintenance_type.toLowerCase().includes(searchLower) ||
                                                            maintenance.status.toLowerCase().includes(searchLower) ||
                                                            (maintenance.description && maintenance.description.toLowerCase().includes(searchLower))
                                                        );
                                                    })
                                                    .sort((a, b) => new Date(b.maintenance.maintenance_date).getTime() - new Date(a.maintenance.maintenance_date).getTime())
                                                    .map(({ equipment: item, maintenance }) => (
                                                        <div key={`${item.id}-${maintenance.id}`} className="bg-white border rounded-lg p-4 shadow-sm">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                                        {maintenance.maintenance_type}
                                                                    </span>
                                                                    {getStatusBadge(maintenance.status)}
                                                                </div>
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
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setSelectedEquipment({
                                                                                ...item,
                                                                                selectedMaintenance: maintenance
                                                                            } as any);
                                                                            setIsViewDetailsModalOpen(true);
                                                                        }}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        {maintenance.status === 'scheduled' && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => {
                                                                                    router.patch(`/admin/equipment/maintenance/${maintenance.id}/complete`);
                                                                                }}
                                                                                className="text-green-600"
                                                                            >
                                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                                Mark Complete
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                                <div>
                                                                    <span className="text-gray-700">Equipment:</span>
                                                                    <div className="font-medium text-gray-900">{item.equipment_name}</div>
                                                                    <div className="text-xs text-gray-500">{item.equipment_type}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-700">Scheduled Date:</span>
                                                                    <div className="font-medium text-gray-900">
                                                                        {new Date(maintenance.maintenance_date).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Scheduled: {new Date(maintenance.created_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-700">Cost:</span>
                                                                    <div className="font-medium">
                                                                        {maintenance.cost ? (
                                                                            <span className="text-green-600">
                                                                                ₱{Number(maintenance.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400">Not specified</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {maintenance.description && (
                                                                    <div>
                                                                        <span className="text-gray-700">Description:</span>
                                                                        <div className="text-gray-600 text-sm">{maintenance.description}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    {searchTerm ? 'No maintenance records found matching your search.' : 'No maintenance records available.'}
                                                </div>
                                            )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Equipment Modal */}
            <Dialog open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-gray-900 font-medium">Add Equipment</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="equipment_name">Equipment Name</Label>
                            <Input
                                id="equipment_name"
                                type="text"
                                placeholder="Enter equipment name"
                                value={data.equipment_name}
                                onChange={(e) => setData('equipment_name', e.target.value)}
                                required
                            />
                            {errors.equipment_name && (
                                <p className="text-sm text-red-600 mt-1">{errors.equipment_name}</p>
                            )}
                        </div>
                        
                        <div>
                            <Label htmlFor="equipment_type">Equipment Type</Label>
                            <Input
                                id="equipment_type"
                                type="text"
                                placeholder="Enter equipment type"
                                value={data.equipment_type}
                                onChange={(e) => setData('equipment_type', e.target.value)}
                                required
                            />
                            {errors.equipment_type && (
                                <p className="text-sm text-red-600 mt-1">{errors.equipment_type}</p>
                            )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Adding...' : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Equipment
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Schedule Maintenance Modal */}
            <Dialog open={isMaintenanceModalOpen} onOpenChange={(open) => !open && setIsMaintenanceModalOpen(false)}>
                <DialogContent className="sm:max-w-lg equipment-modal">
                    <DialogHeader>
                        <DialogTitle>Schedule Maintenance</DialogTitle>
                    </DialogHeader>
                    
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
                                    style={{ 
                                        color: '#111827', 
                                        backgroundColor: 'white',
                                        fontSize: '0.875rem'
                                    }}
                                    required
                                >
                                    <option value="" style={{ color: '#111827', backgroundColor: 'white' }}>Select Equipment</option>
                                    {equipment.filter(item => item.status !== 'under_maintenance').map((item) => (
                                        <option key={item.id} value={item.id} style={{ color: '#111827', backgroundColor: 'white' }}>
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
                                    style={{ 
                                        color: '#111827', 
                                        backgroundColor: 'white',
                                        fontSize: '0.875rem'
                                    }}
                                    required
                                >
                                    <option value="" style={{ color: '#111827', backgroundColor: 'white' }}>Select Maintenance Type</option>
                                    <option value="preventive" style={{ color: '#111827', backgroundColor: 'white' }}>Preventive</option>
                                    <option value="corrective" style={{ color: '#111827', backgroundColor: 'white' }}>Corrective</option>
                                    <option value="emergency" style={{ color: '#111827', backgroundColor: 'white' }}>Emergency</option>
                                </select>
                                {maintenanceErrors.maintenance_type && (
                                    <p className="text-red-500 text-sm mt-1">{maintenanceErrors.maintenance_type}</p>
                                )}
                            </div>
                            
                            {/* Recurring Schedule (Only for Preventive Maintenance) */}
                            {maintenanceData.maintenance_type === 'preventive' && (
                                <>
                                    <div>
                                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={maintenanceData.is_recurring}
                                                onChange={(e) => setMaintenanceData('is_recurring', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Set up recurring maintenance schedule</span>
                                        </label>
                                    </div>
                                    
                                    {maintenanceData.is_recurring && (
                                        <div className="bg-blue-50 p-4 rounded-md space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Frequency
                                                    </label>
                                                    <select
                                                        value={maintenanceData.recurring_frequency}
                                                        onChange={(e) => setMaintenanceData('recurring_frequency', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ 
                                                            color: '#111827', 
                                                            backgroundColor: 'white',
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        <option value="daily" style={{ color: '#111827', backgroundColor: 'white' }}>Daily</option>
                                                        <option value="weekly" style={{ color: '#111827', backgroundColor: 'white' }}>Weekly</option>
                                                        <option value="monthly" style={{ color: '#111827', backgroundColor: 'white' }}>Monthly</option>
                                                        <option value="quarterly" style={{ color: '#111827', backgroundColor: 'white' }}>Quarterly</option>
                                                        <option value="yearly" style={{ color: '#111827', backgroundColor: 'white' }}>Yearly</option>
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Every
                                                    </label>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="12"
                                                            value={maintenanceData.recurring_interval}
                                                            onChange={(e) => setMaintenanceData('recurring_interval', e.target.value)}
                                                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            style={{ 
                                                                color: '#111827', 
                                                                backgroundColor: 'white',
                                                                fontSize: '0.875rem'
                                                            }}
                                                        />
                                                        <span className="text-sm text-gray-600">
                                                            {maintenanceData.recurring_frequency === 'daily' ? 'day(s)' :
                                                             maintenanceData.recurring_frequency === 'weekly' ? 'week(s)' :
                                                             maintenanceData.recurring_frequency === 'monthly' ? 'month(s)' :
                                                             maintenanceData.recurring_frequency === 'quarterly' ? 'quarter(s)' :
                                                             'year(s)'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    End Date (Optional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={maintenanceData.recurring_end_date}
                                                    onChange={(e) => setMaintenanceData('recurring_end_date', e.target.value)}
                                                    min={maintenanceData.maintenance_date || getTodayDate()}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{ 
                                                        color: '#111827', 
                                                        backgroundColor: 'white',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Leave empty for ongoing recurring schedule
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            
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
                                    style={{ 
                                        color: '#111827', 
                                        backgroundColor: 'white',
                                        fontSize: '0.875rem'
                                    }}
                                    rows={3}
                                />
                                {maintenanceErrors.description && (
                                    <p className="text-red-500 text-sm mt-1">{maintenanceErrors.description}</p>
                                )}
                            </div>
                            
                            {/* Row with Maintenance Date and Cost */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maintenance Date
                                    </label>
                                    <input
                                        type="date"
                                        value={maintenanceData.maintenance_date}
                                        onChange={(e) => setMaintenanceData('maintenance_date', e.target.value)}
                                        onClick={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.type === 'date') {
                                                target.showPicker?.();
                                            }
                                        }}
                                        min={getTodayDate()}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        style={{ 
                                            color: '#111827', 
                                            backgroundColor: 'white',
                                            fontSize: '0.875rem'
                                        }}
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
                                        style={{ 
                                            color: '#111827', 
                                            backgroundColor: 'white',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                    {maintenanceErrors.cost && (
                                        <p className="text-red-500 text-sm mt-1">{maintenanceErrors.cost}</p>
                                    )}
                                </div>
                            </div>
                        
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsMaintenanceModalOpen(false)}
                                    className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={maintenanceProcessing}
                                    className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center w-full sm:w-auto"
                                >
                                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    {maintenanceProcessing ? 'Scheduling...' : 'Schedule Maintenance'}
                                </button>
                            </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={isViewDetailsModalOpen} onOpenChange={(open) => !open && setIsViewDetailsModalOpen(false)}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto equipment-details-modal">
                    <DialogHeader>
                        <DialogTitle>Equipment Details</DialogTitle>
                    </DialogHeader>
                    
                    {selectedEquipment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Equipment ID
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {selectedEquipment.formatted_equipment_id || `EQ-${String(selectedEquipment.id).padStart(4, '0')}`}
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
                            
                            {/* Show broken reason if equipment is broken */}
                            {selectedEquipment.status === 'broken' && selectedEquipment.broken_reason && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Broken Status
                                    </label>
                                    <div className="text-sm text-gray-900 bg-red-50 border border-red-200 rounded-md p-3">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-red-800">{selectedEquipment.broken_reason}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
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
                                                {/* Show operational reason when maintenance is completed */}
                                                {maintenance.status === 'completed' && maintenance.operational_reason && (
                                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                        <div className="text-xs font-medium text-green-800">Completion Reason:</div>
                                                        <div className="text-xs text-green-600 mt-1">
                                                            {maintenance.operational_reason}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Show broken reason when maintenance is marked as broken */}
                                                {maintenance.status === 'broken' && maintenance.broken_reason && (
                                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                                        <div className="text-xs font-medium text-red-800">Broken Reason:</div>
                                                        <div className="text-xs text-red-600 mt-1">
                                                            {maintenance.broken_reason}
                                                        </div>
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
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsViewDetailsModalOpen(false)}
                            className="bg-gray-600 text-white hover:bg-gray-700"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Modal */}
            <DateFilterModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Equipment Report"
                description="Select date range to export equipment maintenance records and status history."
            />

            {/* Mark as Broken Reason Modal */}
            <Dialog open={isBrokenModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsBrokenModalOpen(false);
                    setBrokenReason('');
                    setEquipmentToBroken(null);
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Mark Equipment as Broken
                        </DialogTitle>
                        <DialogDescription>
                            {equipmentToBroken && (
                                <>Please provide a reason for marking "<span className="font-medium">{equipmentToBroken.equipment_name}</span>" as broken.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for marking as broken:
                            </label>
                            <textarea
                                value={brokenReason}
                                onChange={(e) => setBrokenReason(e.target.value)}
                                placeholder="Please describe why this equipment is being marked as broken..."
                                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsBrokenModalOpen(false);
                                setBrokenReason('');
                                setEquipmentToBroken(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleMarkAsBroken}
                            disabled={!brokenReason.trim()}
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark as Broken
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark as Operational Reason Modal */}
            <Dialog open={isOperationalModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsOperationalModalOpen(false);
                    setOperationalReason('');
                    setEquipmentToOperational(null);
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Mark Equipment as Operational
                        </DialogTitle>
                        <DialogDescription>
                            {equipmentToOperational && (
                                <>Please provide a reason for marking "<span className="font-medium">{equipmentToOperational.equipment_name}</span>" as operational.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for marking as operational:
                            </label>
                            <textarea
                                value={operationalReason}
                                onChange={(e) => setOperationalReason(e.target.value)}
                                placeholder="Please describe what has been fixed or completed..."
                                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsOperationalModalOpen(false);
                                setOperationalReason('');
                                setEquipmentToOperational(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="default" 
                            onClick={handleMarkAsOperational}
                            disabled={!operationalReason.trim()}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Operational
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