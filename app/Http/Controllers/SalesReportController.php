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
     * Export sales report data with size filtering and analytics options
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

        // Filter by sizes if provided
        if ($request->has('sizes') && $request->input('sizes') !== '') {
            $selectedSizes = explode(',', $request->input('sizes'));
            $orders = $orders->filter(function ($order) use ($selectedSizes) {
                return in_array($order->size, $selectedSizes);
            });
        }

        // Get analytics options
        $includeSeasonalAnalytics = $request->boolean('seasonal_analytics');
        $includeTrends = $request->boolean('trends');
        $format = $request->input('format', 'pdf');

        if ($format === 'excel') {
            return $this->generateExcelReport($orders, $request, $includeSeasonalAnalytics, $includeTrends);
        } else {
            return $this->generatePdfReport($orders, $request, $includeSeasonalAnalytics, $includeTrends);
        }
    }



    private function generatePdfReport($orders, $request, $includeSeasonalAnalytics = false, $includeTrends = false)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $selectedSizes = $request->get('sizes') ? explode(',', $request->get('sizes')) : [];
        
        // Calculate analytics data
        $analyticsData = $this->calculateAnalyticsData($orders, $includeSeasonalAnalytics, $includeTrends);
        
        // Generate PDF using DomPDF
        $pdf = Pdf::loadView('exports.sales-report-pdf', [
            'orders' => $orders,
            'analyticsData' => $analyticsData,
            'selectedSizes' => $selectedSizes,
            'includeSeasonalAnalytics' => $includeSeasonalAnalytics,
            'includeTrends' => $includeTrends,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => now()->format('Y-m-d H:i:s'),
            // Add individual variables for backward compatibility with PDF template
            'totalRevenue' => $analyticsData['summary']['totalRevenue'],
            'totalOrders' => $analyticsData['summary']['totalOrders'],
            'completedOrders' => $analyticsData['summary']['totalOrders'], // All filtered orders are completed
        ]);

        $filename = 'sales-analytics-report-' . date('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    private function generateExcelReport($orders, $request, $includeSeasonalAnalytics = false, $includeTrends = false)
    {
        $analyticsData = $this->calculateAnalyticsData($orders, $includeSeasonalAnalytics, $includeTrends);
        
        // Create Excel-compatible CSV with multiple sheets simulation
        $csvData = [];
        
        // Header
        $csvData[] = ['Sales Analytics Report - Generated on ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = ['Date Range: ' . $request->get('start_date') . ' to ' . $request->get('end_date')];
        $csvData[] = [];
        
        // Summary
        $csvData[] = ['=== SALES SUMMARY ==='];
        $csvData[] = ['Total Revenue', 'PHP ' . number_format($analyticsData['summary']['totalRevenue'], 2)];
        $csvData[] = ['Total Orders', number_format($analyticsData['summary']['totalOrders'])];
        $csvData[] = ['Average Order Value', 'PHP ' . number_format($analyticsData['summary']['averageOrderValue'], 2)];
        $csvData[] = [];
        
        // Size Analysis
        $csvData[] = ['=== SIZE ANALYSIS ==='];
        $csvData[] = ['Size', 'Orders', 'Revenue', 'Percentage'];
        foreach ($analyticsData['sizeBreakdown'] as $size => $data) {
            $csvData[] = [$size, number_format($data['orders']), 'PHP ' . number_format($data['revenue'], 2), number_format($data['percentage'], 1) . '%'];
        }
        $csvData[] = [];
        
        // Seasonal Analytics
        if ($includeSeasonalAnalytics && !empty($analyticsData['seasonalData'])) {
            $csvData[] = ['=== SEASONAL ANALYTICS ==='];
            $csvData[] = ['Month', 'Orders', 'Revenue'];
            foreach ($analyticsData['seasonalData'] as $month => $data) {
                $csvData[] = [$month, number_format($data['orders']), 'PHP ' . number_format($data['revenue'], 2)];
            }
            $csvData[] = [];
        }
        
        // Trends
        if ($includeTrends && !empty($analyticsData['trends'])) {
            $csvData[] = ['=== TREND ANALYSIS ==='];
            $csvData[] = ['Metric', 'Value'];
            foreach ($analyticsData['trends'] as $metric => $value) {
                $csvData[] = [$metric, $value];
            }
            $csvData[] = [];
        }
        
        // Orders Data
        $csvData[] = ['=== DETAILED ORDERS ==='];
        $csvData[] = ['Order ID', 'Customer', 'Size', 'Quantity', 'Total', 'Order Date'];
        foreach ($orders as $order) {
            $csvData[] = [
                $order->order_id,
                $order->customer_name,
                $order->size,
                $order->quantity,
                'PHP ' . number_format($order->total, 2),
                date('Y-m-d', strtotime($order->order_date))
            ];
        }
        
        // Return Excel file
        $filename = 'sales-analytics-data-' . date('Y-m-d') . '.csv';
        $headers = [
            'Content-Type' => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        
        return response()->stream(function() use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        }, 200, $headers);
    }

    private function calculateAnalyticsData($orders, $includeSeasonalAnalytics = false, $includeTrends = false)
    {
        $data = [];
        
        // Summary statistics - ensure proper numeric conversion
        $totalRevenue = $orders->sum(function($order) {
            return floatval($order->total ?? 0);
        });
        $totalOrders = $orders->count();
        $data['summary'] = [
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'averageOrderValue' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
        ];
        
        // Size breakdown
        $sizeGroups = $orders->groupBy('size');
        $data['sizeBreakdown'] = [];
        foreach ($sizeGroups as $size => $sizeOrders) {
            $sizeRevenue = $sizeOrders->sum(function($order) {
                return floatval($order->total ?? 0);
            });
            $data['sizeBreakdown'][$size] = [
                'orders' => $sizeOrders->count(),
                'revenue' => $sizeRevenue,
                'percentage' => $totalRevenue > 0 ? round(($sizeRevenue / $totalRevenue) * 100, 1) : 0,
            ];
        }
        
        // Seasonal analytics
        if ($includeSeasonalAnalytics) {
            $monthlyGroups = $orders->groupBy(function($order) {
                return date('F Y', strtotime($order->order_date));
            });
            
            $data['seasonalData'] = [];
            foreach ($monthlyGroups as $month => $monthOrders) {
                $monthRevenue = $monthOrders->sum(function($order) {
                    return floatval($order->total ?? 0);
                });
                $data['seasonalData'][$month] = [
                    'orders' => $monthOrders->count(),
                    'revenue' => $monthRevenue,
                ];
            }
        }
        
        // Trends analysis
        if ($includeTrends) {
            $data['trends'] = [
                'Growth Rate' => $this->calculateGrowthRate($orders),
                'Best Performing Size' => $this->getBestPerformingSize($orders),
                'Peak Sales Month' => $this->getPeakSalesMonth($orders),
            ];
        }
        
        return $data;
    }

    private function calculateGrowthRate($orders)
    {
        // Simple month-over-month calculation
        $currentMonth = $orders->filter(function($order) {
            return date('Y-m', strtotime($order->order_date)) === date('Y-m');
        })->sum(function($order) {
            return floatval($order->total ?? 0);
        });
        
        $lastMonth = $orders->filter(function($order) {
            return date('Y-m', strtotime($order->order_date)) === date('Y-m', strtotime('-1 month'));
        })->sum(function($order) {
            return floatval($order->total ?? 0);
        });
        
        if ($lastMonth > 0) {
            return round((($currentMonth - $lastMonth) / $lastMonth) * 100, 1) . '%';
        }
        
        return 'N/A';
    }

    private function getBestPerformingSize($orders)
    {
        $sizeRevenue = $orders->groupBy('size')->map(function($sizeOrders) {
            return $sizeOrders->sum(function($order) {
                return floatval($order->total ?? 0);
            });
        });
        return $sizeRevenue->sortDesc()->keys()->first() ?? 'N/A';
    }

    private function getPeakSalesMonth($orders)
    {
        $monthlyRevenue = $orders->groupBy(function($order) {
            return date('F Y', strtotime($order->order_date));
        })->map(function($monthOrders) {
            return $monthOrders->sum(function($order) {
                return floatval($order->total ?? 0);
            });
        });
        
        return $monthlyRevenue->sortDesc()->keys()->first() ?? 'N/A';
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