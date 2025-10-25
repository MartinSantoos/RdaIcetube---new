import { Head, Link, useForm, router } from '@inertiajs/react';
import { BarChart3, Package, Cog, Settings, ShoppingCart, Users, Plus, Download, X, CheckCircle, Edit, Trash2, UserX, UserCheck, AlertTriangle, Search, LogOut, MoreHorizontal, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import DateFilterModal from '@/components/DateFilterModal';
import { StatusBadge } from '@/components/enhanced/status-badge';
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

interface User {
    id: number;
    name: string;
    username: string;
    user_type: number;
}

interface Employee {
    id: number;
    name: string;
    position: string;
    status: string;
    contact: string;
    user_type: number;
    archived?: boolean;
}

interface EmployeesProps {
    user: User;
    employees: Employee[];
    archivedEmployees?: Employee[];
}

export default function Employees({ user, employees = [], archivedEmployees = [] }: EmployeesProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{open: boolean, type: 'archive' | 'disable' | 'enable' | 'delete' | 'restore' | null, employee: Employee | null}>({
        open: false,
        type: null,
        employee: null
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
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
        window.open(`/admin/employees/export?${params.toString()}`, '_blank');
    };

    // Form for adding/editing employees
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        position: 'Delivery Rider',
        contact: '',
        password: '123',
        status: 'active'
    });

    // Form for archive operations
    const archiveForm = useForm();

    // Form for toggle status
    const toggleForm = useForm();

    // CSS overrides for select component visibility in employee modal
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            /* Employee Modal Select Element Visibility */
            .employee-modal select,
            .employee-modal option {
                color: #111827 !important;
                background-color: white !important;
            }
            
            .employee-modal select:hover {
                background-color: #f9fafb !important;
            }
            
            .employee-modal select:focus {
                color: #111827 !important;
                background-color: white !important;
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

    // Contact number validation
    const validateContactNumber = (contact: string) => {
        if (!contact) return 'Contact number is required';
        if (contact.length !== 11) return 'Contact number must be exactly 11 digits';
        if (!contact.startsWith('09')) return 'Contact number must start with 09';
        if (!/^\d+$/.test(contact)) return 'Contact number must contain only digits';
        return '';
    };

    const [contactError, setContactError] = useState('');

    const handleContactChange = (value: string) => {
        // Only allow numeric input and limit to 11 digits
        const numericValue = value.replace(/\D/g, '').slice(0, 11);
        setData('contact', numericValue);
        
        // Validate in real-time
        const error = validateContactNumber(numericValue);
        setContactError(error);
    };

    // Filter employees based on search term
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toString().includes(searchTerm)
    );

    // Filter archived employees based on search term
    const filteredArchivedEmployees = archivedEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toString().includes(searchTerm)
    );

    // Add new employee
    const handleAddEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure password is always "123" for new employees
        setData('password', '123');
        
        post('/admin/employees', {
            onSuccess: () => {
                resetForm();
            }
        });
    };

    // Edit existing employee
    const handleEditEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmployee) {
            put(`/admin/employees/${editingEmployee.id}`, {
                onSuccess: () => {
                    resetForm();
                }
            });
        }
    };

    // Archive employee
    const handleArchiveEmployee = (employee: Employee) => {
        archiveForm.patch(`/admin/employees/${employee.id}/archive`, {
            onSuccess: () => {
                setConfirmDialog({ open: false, type: null, employee: null });
            }
        });
    };

    // Restore employee from archive
    const handleRestoreEmployee = (employee: Employee) => {
        archiveForm.patch(`/admin/employees/${employee.id}/restore`, {
            onSuccess: () => {
                setConfirmDialog({ open: false, type: null, employee: null });
                // Optionally show success message
            }
        });
    };

    // Permanently delete employee
    const handlePermanentDeleteEmployee = (employee: Employee) => {
        archiveForm.delete(`/admin/employees/${employee.id}/force-delete`, {
            onSuccess: () => {
                setConfirmDialog({ open: false, type: null, employee: null });
            }
        });
    };

    // Toggle employee status (disable/enable)
    const handleToggleEmployeeStatus = (employee: Employee) => {
        toggleForm.patch(`/admin/employees/${employee.id}/toggle-status`, {
            onSuccess: () => {
                setConfirmDialog({ open: false, type: null, employee: null });
            }
        });
    };

    // Open edit modal
    const openEditModal = (employee: Employee) => {
        setData({
            name: employee.name,
            position: employee.position,
            contact: employee.contact,
            password: '',
            status: employee.status
        });
        setContactError(''); // Clear any previous contact validation errors
        setEditingEmployee(employee);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Reset form and close modal
    const resetForm = () => {
        reset();
        setContactError('');
        setSuccessMessage(''); // Clear success message
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingEmployee(null);
    };

    // Reset employee password to default
    const resetEmployeePassword = () => {
        if (isEditMode && editingEmployee) {
            router.patch(`/admin/employees/${editingEmployee.id}/reset-password`, {}, {
                onSuccess: () => {
                    setData('password', '123'); // Update form to show default password
                    setSuccessMessage('Employee password has been reset to default (123).');
                    // Clear success message after 5 seconds
                    setTimeout(() => setSuccessMessage(''), 5000);
                },
                onError: (errors) => {
                    console.error('Failed to reset password:', errors);
                }
            });
        }
    };

    // Open confirmation dialog
    const openConfirmDialog = (type: 'archive' | 'disable' | 'enable', employee: Employee) => {
        setConfirmDialog({ open: true, type, employee });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Employees - RDA Tube Ice" />
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
                            <div className="flex items-center space-x-2">
                                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                    {user.name?.charAt(0) || 'A'}
                                </div>
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
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Inventory</span>
                                </Link>
                                <Link 
                                    href="/admin/employees" 
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">Employees</h1>
                                <p className="text-blue-100 text-sm md:text-base">Manage and track Employees</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <Button onClick={() => {
                                    reset();
                                    setIsEditMode(false);
                                    setEditingEmployee(null);
                                    setIsModalOpen(true);
                                }} variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base">
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Employee</span>
                                    <span className="sm:hidden">Add Employee</span>
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

                    {/* Content Area */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Employees</h3>
                            {/* Tabs */}
                            <Tabs defaultValue="employees" className="mb-6">
                                <TabsList className="grid w-fit grid-cols-2 bg-gray-200 p-1 rounded-xl h-12">
                                    <TabsTrigger 
                                        value="employees" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Employees
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="archives" 
                                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-600 px-4 py-2 rounded-md font-medium"
                                    >
                                        Archives
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="employees" className="mt-6">
                                    {/* Search */}
                                    <div className="flex justify-between items-center mb-4 gap-4">
                                        <div className="flex-1 md:flex-none">
                                            <div className="relative w-full md:w-64">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search employees..."
                                                    className="pl-10 text-sm"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employees Table/Cards */}
                                    <div>
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="font-semibold">Status</TableHead>
                                                        <TableHead className="font-semibold">Employee ID</TableHead>
                                                        <TableHead className="font-semibold">Name</TableHead>
                                                        <TableHead className="font-semibold">Position</TableHead>
                                                        <TableHead className="font-semibold">Contact</TableHead>
                                                        <TableHead className="font-semibold">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredEmployees.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                                {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        filteredEmployees.map(emp => (
                                                            <TableRow key={emp.id} className="hover:bg-gray-50">
                                                                <TableCell>
                                                                    <StatusBadge status={emp.status} size="sm" />
                                                                </TableCell>
                                                                <TableCell className="font-medium">{emp.id}</TableCell>
                                                            <TableCell className="font-medium">{emp.name}</TableCell>
                                                            <TableCell>{emp.position}</TableCell>
                                                            <TableCell>{emp.contact}</TableCell>
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
                                                                        <DropdownMenuItem onClick={() => openEditModal(emp)}>
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            Edit Employee
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => openConfirmDialog(emp.status === 'active' ? 'disable' : 'enable', emp)}
                                                                            className={emp.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                                                                        >
                                                                            {emp.status === 'active' ? (
                                                                                <>
                                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                                    Disable Employee
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                                    Enable Employee
                                                                                </>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => openConfirmDialog('archive', emp)}
                                                                            className="text-red-600"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Archive Employee
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                        ))
                                                )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    
                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-4">
                                        {filteredEmployees.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
                                            </div>
                                        ) : (
                                            filteredEmployees.map(emp => (
                                                <div key={emp.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{emp.name}</h4>
                                                            <p className="text-sm text-gray-700">ID: {emp.id}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <StatusBadge status={emp.status} size="sm" />
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
                                                                    <DropdownMenuItem onClick={() => openEditModal(emp)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit Employee
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => openConfirmDialog(emp.status === 'active' ? 'disable' : 'enable', emp)}
                                                                        className={emp.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                                                                    >
                                                                        {emp.status === 'active' ? (
                                                                            <>
                                                                                <UserX className="mr-2 h-4 w-4" />
                                                                                Disable Employee
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                                Enable Employee
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => openConfirmDialog('archive', emp)}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Archive Employee
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-gray-700">Position:</span>
                                                            <p className="font-medium text-gray-900">{emp.position}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-700">Contact:</span>
                                                            <p className="font-medium text-gray-900">{emp.contact}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                </TabsContent>
                                
                                <TabsContent value="archives">
                                    {/* Search */}
                                    <div className="flex justify-between items-center mb-4 gap-4">
                                        <div className="flex-1 md:flex-none">
                                            <div className="relative w-full md:w-64">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search archived employees..."
                                                    className="pl-10 text-sm"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {archivedEmployees.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No archived employees found.
                                        </div>
                                    ) : filteredArchivedEmployees.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No archived employees match your search.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Archived Employees Table/Cards */}
                                            <div>
                                                {/* Desktop Archives Table */}
                                                <div className="hidden md:block overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="font-semibold">Employee ID</TableHead>
                                                                <TableHead className="font-semibold">Name</TableHead>
                                                                <TableHead className="font-semibold">Position</TableHead>
                                                                <TableHead className="font-semibold">Contact</TableHead>
                                                                <TableHead className="font-semibold">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {filteredArchivedEmployees.map(emp => (
                                                            <TableRow key={emp.id} className="hover:bg-gray-50 bg-gray-50">
                                                                <TableCell className="font-medium text-gray-600">{emp.id}</TableCell>
                                                                <TableCell className="font-medium text-gray-600">{emp.name}</TableCell>
                                                                <TableCell className="text-gray-600">{emp.position}</TableCell>
                                                                <TableCell className="text-gray-600">{emp.contact}</TableCell>
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
                                                                                onClick={() => setConfirmDialog({ open: true, type: 'restore', employee: emp })}
                                                                                className="text-green-600"
                                                                            >
                                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                                Restore Employee
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem 
                                                                                onClick={() => setConfirmDialog({ open: true, type: 'delete', employee: emp })}
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
                                                {filteredArchivedEmployees.map(emp => (
                                                    <div key={emp.id} className="bg-gray-100 rounded-lg p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-700">{emp.name}</h4>
                                                                <p className="text-sm text-gray-600">ID: {emp.id}</p>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge variant="destructive">Archived</Badge>
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
                                                                            onClick={() => setConfirmDialog({ open: true, type: 'restore', employee: emp })}
                                                                            className="text-green-600"
                                                                        >
                                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                                            Restore Employee
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => setConfirmDialog({ open: true, type: 'delete', employee: emp })}
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
                                                                <span className="text-gray-600">Position:</span>
                                                                <p className="font-medium text-gray-800">{emp.position}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Contact:</span>
                                                                <p className="font-medium text-gray-800">{emp.contact}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Employee Modal */}
                    <Dialog open={isModalOpen} onOpenChange={(open) => !open && resetForm()}>
                        <DialogContent className="sm:max-w-lg employee-modal">
                            <DialogHeader>
                                <DialogTitle>
                                    {isEditMode ? 'Update employee information' : 'Add employee account'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={isEditMode ? handleEditEmployee : handleAddEmployee} className="space-y-4">
                                        {/* Success Message */}
                                        {successMessage && (
                                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-green-800">{successMessage}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* General Error Message */}
                                        {(errors as any).general && (
                                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <X className="h-5 w-5 text-red-400" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-red-800">{(errors as any).general}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
                                            <Input 
                                                id="name" 
                                                type="text" 
                                                placeholder="Employee Name" 
                                                value={data.name} 
                                                onChange={e => setData('name', e.target.value)} 
                                                className={errors.name ? 'border-red-300' : ''}
                                                required 
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position *</label>
                                            <select 
                                                id="position" 
                                                value={data.position} 
                                                onChange={e => setData('position', e.target.value)} 
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.position ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                style={{ 
                                                    color: '#111827', 
                                                    backgroundColor: 'white',
                                                    fontSize: '0.875rem'
                                                }}
                                                required
                                            >
                                                <option value="Delivery Rider" style={{ color: '#111827', backgroundColor: 'white' }}>Delivery Rider</option>
                                                <option value="Admin" style={{ color: '#111827', backgroundColor: 'white' }}>Admin</option>
                                            </select>   
                                            {errors.position && (
                                                <p className="text-sm text-red-600 mt-1">{errors.position}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact * <span className="text-sm text-gray-500">(11 digits starting with 09)</span></label>
                                            <Input 
                                                id="contact" 
                                                type="tel" 
                                                placeholder="09123456789" 
                                                value={data.contact} 
                                                onChange={(e) => handleContactChange(e.target.value)} 
                                                className={`${errors.contact || contactError ? 'border-red-300' : ''} font-mono`}
                                                maxLength={11}
                                                required 
                                            />
                                            {(errors.contact || contactError) && (
                                                <p className="text-sm text-red-600 mt-1">{errors.contact || contactError}</p>
                                            )}
                                        </div>
                                        {!isEditMode && (
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                                    Password <span className="text-sm text-gray-500">(Default: 123)</span>
                                                </label>
                                                <Input 
                                                    id="password" 
                                                    type="text" 
                                                    value="123"
                                                    className="bg-gray-100 cursor-not-allowed"
                                                    readOnly
                                                    disabled
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Default password will be assigned to new employees</p>
                                            </div>
                                        )}
                                        {isEditMode && (
                                            <div>
                                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                                <select 
                                                    id="status" 
                                                    value={data.status} 
                                                    onChange={e => setData('status', e.target.value)} 
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex justify-end space-x-2 pt-4">
                                            <Button type="button" variant="outline" onClick={resetForm} disabled={processing}>
                                                Cancel
                                            </Button>
                                            {isEditMode && (
                                                <Button type="button" variant="secondary" onClick={resetEmployeePassword} disabled={processing}>
                                                    Reset Password
                                                </Button>
                                            )}
                                            <Button type="submit" variant="default" disabled={processing}>
                                                {processing ? 'Saving...' : (isEditMode ? 'Update Employee' : 'Add Employee')}
                                            </Button>
                                        </div>
                                    </form>
                        </DialogContent>
                    </Dialog>
                    
                    {/* Confirmation Dialog */}
                    <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, employee: null })}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center">
                                    <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                                    {confirmDialog.type === 'archive' && 'Archive Employee'}
                                    {confirmDialog.type === 'disable' && 'Disable Employee'}
                                    {confirmDialog.type === 'enable' && 'Enable Employee'}
                                    {confirmDialog.type === 'delete' && 'Delete Employee Permanently'}
                                    {confirmDialog.type === 'restore' && 'Restore Employee'}
                                </DialogTitle>
                                <DialogDescription>
                                    {confirmDialog.employee && (
                                        <>
                                            {confirmDialog.type === 'archive' && 
                                                `Are you sure you want to archive "${confirmDialog.employee.name}"? They will be moved to the archives and can be restored later.`
                                            }
                                            {confirmDialog.type === 'disable' && 
                                                `Are you sure you want to disable "${confirmDialog.employee.name}"? They will no longer be able to access the system.`
                                            }
                                            {confirmDialog.type === 'enable' && 
                                                `Are you sure you want to enable "${confirmDialog.employee.name}"? They will regain access to the system.`
                                            }
                                            {confirmDialog.type === 'delete' && 
                                                `Are you sure you want to permanently delete "${confirmDialog.employee.name}"? This action cannot be undone and all data will be lost forever.`
                                            }
                                            {confirmDialog.type === 'restore' && 
                                                `Are you sure you want to restore "${confirmDialog.employee.name}"? They will be moved back to active employees and regain access to the system.`
                                            }
                                        </>
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setConfirmDialog({ open: false, type: null, employee: null })}
                                    disabled={archiveForm.processing || toggleForm.processing}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="button" 
                                    className={
                                        confirmDialog.type === 'archive' 
                                            ? "bg-orange-600 hover:bg-orange-700" 
                                            : confirmDialog.type === 'disable'
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : confirmDialog.type === 'delete'
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-green-600 hover:bg-green-700"
                                    }
                                    disabled={archiveForm.processing || toggleForm.processing}
                                    onClick={() => {
                                        if (confirmDialog.type === 'archive' && confirmDialog.employee) {
                                            handleArchiveEmployee(confirmDialog.employee);
                                        } else if (confirmDialog.type === 'delete' && confirmDialog.employee) {
                                            handlePermanentDeleteEmployee(confirmDialog.employee);
                                        } else if (confirmDialog.type === 'restore' && confirmDialog.employee) {
                                            handleRestoreEmployee(confirmDialog.employee);
                                        } else if (confirmDialog.employee) {
                                            handleToggleEmployeeStatus(confirmDialog.employee);
                                        }
                                    }}
                                >
                                    {(archiveForm.processing || toggleForm.processing) ? 'Processing...' : (
                                        confirmDialog.type === 'archive' ? 'Archive' : 
                                        confirmDialog.type === 'disable' ? 'Disable' : 
                                        confirmDialog.type === 'delete' ? 'Delete Permanently' : 
                                        confirmDialog.type === 'restore' ? 'Restore' : 'Enable'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>

            {/* Export Modal */}
            <DateFilterModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Employee Report"
                description="Select date range to export employee records and activity history."
            />

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