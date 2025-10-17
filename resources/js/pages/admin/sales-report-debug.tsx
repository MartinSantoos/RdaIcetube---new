import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { BarChart3, Package, Settings, ShoppingCart, Users, LogOut, Search, Download, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

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
}

interface SalesReportProps {
    user: User;
    orders: Order[];
}

export default function SalesReport({ user, orders }: SalesReportProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Sales Report - RDA Tube Ice" />
            
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-lg relative z-50">
                <div className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-lg md:text-xl font-bold">RDA Tube Ice - Sales Report</h1>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <span>{user?.name || 'Admin'}</span>
                    </div>
                </div>
            </header>

            <div className="p-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Sales Report Debug</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">User Information:</h3>
                            <pre className="bg-gray-100 p-4 rounded">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold">Orders Count: {orders?.length || 0}</h3>
                            {orders && orders.length > 0 ? (
                                <div>
                                    <p>First order:</p>
                                    <pre className="bg-gray-100 p-4 rounded">
                                        {JSON.stringify(orders[0], null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <p>No orders found</p>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold">Completed Orders:</h3>
                            {orders ? (
                                <p>{orders.filter(order => order.status === 'completed').length} completed orders</p>
                            ) : (
                                <p>Orders data is null</p>
                            )}
                        </div>
                        
                        <div>
                            <Link href="/admin/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}