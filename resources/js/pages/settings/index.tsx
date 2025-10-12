import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { BarChart3, Package, Settings, ShoppingCart, Users, LogOut, User, Lock, Phone, MapPin, UserCircle, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
    id: number;
    name: string;
    username: string;
    email?: string;
    user_type: number;
    contact_number?: string;
    address?: string;
    position?: string;
}

interface SettingsProps {
    user: User;
}

export default function SettingsPage({ user }: SettingsProps) {
    const [activeTab, setActiveTab] = useState('account');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();

    // Password change form
    const { data: passwordData, setData: setPasswordData, patch: patchPassword, processing: passwordProcessing, errors: passwordErrors, reset: resetPassword, wasSuccessful: passwordSuccess } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Profile update form
    const { data: profileData, setData: setProfileData, patch: patchProfile, processing: profileProcessing, errors: profileErrors, reset: resetProfile, wasSuccessful: profileSuccess } = useForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
    });

    const handleLogout = () => {
        router.post('/logout');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const routePath = user.user_type === 1 ? '/admin/settings/password' : '/employee/settings/password';
        patchPassword(routePath, {
            onSuccess: () => {
                resetPassword();
            }
        });
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const routePath = user.user_type === 1 ? '/admin/settings/profile' : '/employee/settings/profile';
        patchProfile(routePath);
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    const getDashboardRoute = () => {
        return user.user_type === 1 ? '/admin/dashboard' : '/employee/dashboard';
    };

    const getNavigationItems = () => {
        if (user.user_type === 1) {
            return [
                { href: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
                { href: '/admin/point-of-sales', icon: ShoppingCart, label: 'Order' },
                { href: '/admin/inventory', icon: Package, label: 'Inventory' },
                { href: '/admin/employees', icon: Users, label: 'Employees' },
                { href: '/admin/equipment', icon: Settings, label: 'Equipment' },
                { href: '/admin/sales-report', icon: BarChart3, label: 'Sales Report' },
            ];
        } else {
            return [
                { href: '/employee/dashboard', icon: BarChart3, label: 'Dashboard' },
                { href: '/employee/orders', icon: ShoppingCart, label: 'Orders' },
            ];
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Settings - RDA Tube Ice" />
            
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
                                {getInitials(user.name)}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{user.name}</div>
                                <div className="text-xs text-blue-200">{user.username}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {isMobile && (
                            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {getInitials(user.name)}
                            </div>
                        )}
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
                
                {/* Sidebar */}
                <aside className={`
                    ${isMobile 
                        ? 'fixed inset-y-0 left-0 z-50 w-64 bg-blue-600 text-white transform transition-transform duration-300 ease-in-out' + 
                          (sidebarOpen ? ' translate-x-0' : ' -translate-x-full')
                        : 'w-64 bg-blue-600 min-h-screen text-white'
                    }
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
                                {getNavigationItems().map((item, index) => (
                                    <Link 
                                        key={index}
                                        href={item.href} 
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => isMobile && setSidebarOpen(false)}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="border-t border-blue-500 pt-6">
                            <h3 className="text-sm font-semibold mb-4">Settings</h3>
                            <nav className="space-y-2">
                                <Link 
                                    href={user.user_type === 1 ? '/admin/settings' : '/employee/settings'}
                                    className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-lg"
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
                <main className={`flex-1 p-4 md:p-8 ${isMobile ? 'w-full' : ''}`}>
                    {/* Page Header */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
                            <p className="text-blue-100 text-sm md:text-base">Configure Inventory and Account Settings</p>
                        </div>
                    </div>

                    {/* Settings Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
                        {/* Profile Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="text-center">
                                    <div className="bg-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl font-bold text-gray-600">
                                            {getInitials(user.name)}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
                                    <p className="text-gray-600 mb-4">{user.user_type === 1 ? 'Admin' : 'Employee'}</p>
                                    
                                    <div className="text-left space-y-3 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{user.contact_number || 'No contact number'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Forms */}
                        <div className="lg:col-span-3">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="account">Account</TabsTrigger>
                                    <TabsTrigger value="settings">Settings</TabsTrigger>
                                </TabsList>

                                {/* Password Tab */}
                                <TabsContent value="account" className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 shadow-sm">
                                        <h3 className="text-xl font-semibold mb-1">Password</h3>
                                        <p className="text-gray-600 mb-6">Change your Password</p>

                                        {passwordSuccess && (
                                            <Alert className="mb-6 border-green-200 bg-green-50">
                                                <AlertDescription className="text-green-700">
                                                    Password updated successfully!
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                            <div>
                                                <Label htmlFor="current_password">Current Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="current_password"
                                                        type="password"
                                                        value={passwordData.current_password}
                                                        onChange={(e) => setPasswordData('current_password', e.target.value)}
                                                        className="pl-10"
                                                        placeholder="••••••••"
                                                    />
                                                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                                </div>
                                                {passwordErrors.current_password && (
                                                    <p className="text-sm text-red-600 mt-1">{passwordErrors.current_password}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="password">New Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={passwordData.password}
                                                        onChange={(e) => setPasswordData('password', e.target.value)}
                                                        className="pl-10"
                                                        placeholder="••••••••"
                                                    />
                                                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                                </div>
                                                {passwordErrors.password && (
                                                    <p className="text-sm text-red-600 mt-1">{passwordErrors.password}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password_confirmation"
                                                        type="password"
                                                        value={passwordData.password_confirmation}
                                                        onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                                        className="pl-10"
                                                        placeholder="••••••••"
                                                    />
                                                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                                </div>
                                                {passwordErrors.password_confirmation && (
                                                    <p className="text-sm text-red-600 mt-1">{passwordErrors.password_confirmation}</p>
                                                )}
                                            </div>

                                            <Button 
                                                type="submit" 
                                                disabled={passwordProcessing}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {passwordProcessing ? 'Saving Changes...' : 'Save Changes'}
                                            </Button>
                                        </form>
                                    </div>
                                </TabsContent>

                                {/* Settings Tab - Future use */}
                                <TabsContent value="settings" className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 shadow-sm">
                                        <h3 className="text-xl font-semibold mb-1">General Settings</h3>
                                        <p className="text-gray-600 mb-6">Configure application preferences</p>
                                        
                                        <div className="text-center py-12">
                                            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">Additional settings will be available here in future updates.</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}