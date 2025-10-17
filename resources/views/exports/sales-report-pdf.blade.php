<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Report - RDA Tube Ice System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .report-title {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .date-range {
            font-size: 12px;
            color: #666;
        }
        .summary-stats {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .stat-card {
            display: table-cell;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
            width: 33.333%;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 11px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
        }
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .status-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
        .status-out_for_delivery { background: #dbeafe; color: #1d4ed8; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }
        .amount {
            text-align: right;
            font-weight: bold;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">RDA Tube Ice System</div>
        <div class="report-title">Sales Report</div>
        @if($startDate && $endDate)
            <div class="date-range">Period: {{ date('F j, Y', strtotime($startDate)) }} - {{ date('F j, Y', strtotime($endDate)) }}</div>
        @else
            <div class="date-range">All Time Report</div>
        @endif
        <div class="date-range">Generated on: {{ $generatedAt }}</div>
    </div>

    <div class="summary-stats">
        <div class="stat-card">
            <div class="stat-value">{{ number_format($totalOrders ?? 0) }}</div>
            <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{{ number_format($completedOrders ?? 0) }}</div>
            <div class="stat-label">Completed Orders</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">PHP {{ number_format($totalRevenue ?? 0, 2) }}</div>
            <div class="stat-label">Total Revenue</div>
        </div>
    </div>

    @if($orders->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Quantity</th>
                    <th>Delivery Mode</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($orders as $order)
                <tr>
                    <td>{{ $order->order_id ?? 'N/A' }}</td>
                    <td>{{ $order->order_date ? date('M j, Y', strtotime($order->order_date)) : 'N/A' }}</td>
                    <td>{{ $order->customer_name ?? 'N/A' }}</td>
                    <td>
                        <span class="status-badge status-{{ $order->status ?? 'unknown' }}">
                            {{ $order->status ? ucfirst(str_replace('_', ' ', $order->status)) : 'Unknown' }}
                        </span>
                    </td>
                    <td>{{ $order->size ? ucfirst($order->size) : 'N/A' }}</td>
                    <td>{{ $order->quantity ?? 0 }}</td>
                    <td>{{ $order->delivery_mode ? ucfirst(str_replace('_', ' ', $order->delivery_mode)) : 'N/A' }}</td>
                    <td class="amount">PHP {{ $order->price ? number_format((float)$order->price, 2) : '0.00' }}</td>
                    <td class="amount">PHP {{ $order->total ? number_format((float)$order->total, 2) : '0.00' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3>No orders found for the selected date range</h3>
        </div>
    @endif

    <div class="footer">
        <p>This report was generated automatically by RDA Tube Ice System</p>
        <p>For questions or support, please contact your system administrator</p>
    </div>
</body>
</html>