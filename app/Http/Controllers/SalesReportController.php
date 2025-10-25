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
        
        // Debug: Log the data being passed
        \Log::info('Sales Report Data', [
            'orders_count' => $orders->count(),
            'user' => Auth::user() ? Auth::user()->name : 'No user',
        ]);
        
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
    
    /**
     * Get dashboard sales statistics based on period
     */
    public function dashboardStats(Request $request)
    {
        $period = $request->input('period', 'today');
        
        try {
            $salesStats = $this->calculateSalesStats($period);
            
            return response()->json([
                'success' => true,
                'salesStats' => $salesStats
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching dashboard sales stats: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sales data',
                'salesStats' => null
            ], 500);
        }
    }
    
    /**
     * Calculate sales statistics based on period
     */
    private function calculateSalesStats($period)
    {
        $now = now();
        $query = Order::where('status', 'completed');
        
        switch ($period) {
            case 'today':
                $query->whereDate('order_date', $now->toDateString());
                break;
            case 'week':
                $query->whereBetween('order_date', [
                    $now->startOfWeek()->toDateString(),
                    $now->endOfWeek()->toDateString()
                ]);
                break;
            case 'month':
                $query->whereYear('order_date', $now->year)
                      ->whereMonth('order_date', $now->month);
                break;
            case 'year':
                $query->whereYear('order_date', $now->year);
                break;
        }
        
        $orders = $query->get();
        
        // Calculate total sales
        $totalSales = $orders->sum('total') ?? 0;
        
        // Calculate hourly sales for chart (for today and week, show hourly; for month/year show daily/monthly)
        $hourlySales = $this->calculateHourlySales($orders, $period);
        
        return [
            'totalSales' => $totalSales,
            'hourlySales' => $hourlySales,
            'orderCount' => $orders->count(),
            'period' => $period
        ];
    }
    
    /**
     * Calculate hourly/daily sales data for charts
     */
    private function calculateHourlySales($orders, $period)
    {
        if ($period === 'today') {
            // For today, show hourly data
            $hourlySales = array_fill(0, 24, 0);
            
            foreach ($orders as $order) {
                $hour = (int) date('H', strtotime($order->created_at));
                $hourlySales[$hour] += $order->total ?? 0;
            }
            
            return $hourlySales;
        } elseif ($period === 'week') {
            // For week, show daily data (7 days)
            $dailySales = array_fill(0, 7, 0);
            $startOfWeek = now()->startOfWeek();
            
            foreach ($orders as $order) {
                $dayOfWeek = $startOfWeek->diffInDays(date('Y-m-d', strtotime($order->order_date)));
                if ($dayOfWeek >= 0 && $dayOfWeek < 7) {
                    $dailySales[$dayOfWeek] += $order->total ?? 0;
                }
            }
            
            return $dailySales;
        } elseif ($period === 'month') {
            // For month, show daily data (up to 31 days)
            $daysInMonth = now()->daysInMonth;
            $dailySales = array_fill(0, $daysInMonth, 0);
            
            foreach ($orders as $order) {
                $dayOfMonth = (int) date('j', strtotime($order->order_date)) - 1; // 0-based index
                if ($dayOfMonth >= 0 && $dayOfMonth < $daysInMonth) {
                    $dailySales[$dayOfMonth] += $order->total ?? 0;
                }
            }
            
            return $dailySales;
        } else { // year
            // For year, show monthly data (12 months)
            $monthlySales = array_fill(0, 12, 0);
            
            foreach ($orders as $order) {
                $month = (int) date('n', strtotime($order->order_date)) - 1; // 0-based index
                if ($month >= 0 && $month < 12) {
                    $monthlySales[$month] += $order->total ?? 0;
                }
            }
            
            return $monthlySales;
        }
    }
}