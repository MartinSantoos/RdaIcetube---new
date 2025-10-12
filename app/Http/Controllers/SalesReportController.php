<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesReportController extends Controller
{
    /**
     * Display the sales report page
     */
    public function index()
    {
        // Get all orders (including archived ones for comprehensive sales data)
        $orders = Order::orderBy('order_date', 'desc')->get();
        
        return Inertia::render('admin/sales-report', [
            'user' => Auth::user(),
            'orders' => $orders,
        ]);
    }

    /**
     * Export sales report data to CSV or PDF
     */
    public function export(Request $request)
    {
        // Get only completed orders for sales reporting
        $orders = Order::where('status', 'completed')->orderBy('order_date', 'desc')->get();
        
        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            $orders = $orders->filter(function ($order) use ($startDate, $endDate) {
                $orderDate = date('Y-m-d', strtotime($order->order_date));
                return $orderDate >= $startDate && $orderDate <= $endDate;
            });
        }

        // Generate PDF report directly
        return $this->generatePdfReport($orders, $request);
    }



    private function generatePdfReport($orders, $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        // Calculate summary statistics (orders are already filtered to completed status)
        $totalRevenue = $orders->sum('total');
        $totalOrders = $orders->count();
        $completedOrdersCount = $orders->count(); // All orders are completed now
        
        // Generate PDF using DomPDF
        $pdf = Pdf::loadView('exports.sales-report-pdf', [
            'orders' => $orders,
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'completedOrders' => $completedOrdersCount,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => now()->format('Y-m-d H:i:s'),
        ]);

        $filename = 'sales-report-' . date('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }
}