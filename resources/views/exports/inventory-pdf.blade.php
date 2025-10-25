<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        
        .report-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .date-range {
            font-size: 14px;
            color: #666;
        }
        
        .summary {
            display: table;
            width: 100%;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        
        .summary-item {
            display: table-cell;
            text-align: center;
            width: 33.333%;
        }
        
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 14px;
            color: #666;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #007bff;
            color: white;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-available {
            background-color: #d4edda;
            color: #155724;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .status-low-stock {
            background-color: #f8d7da;
            color: #721c24;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .low-stock {
            color: #dc3545;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">RDA Ice System</div>
        <div class="report-title">Inventory Report</div>
        @if($startDate && $endDate)
            <div class="date-range">
                Period: {{ \Carbon\Carbon::parse($startDate)->format('F j, Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('F j, Y') }}
            </div>
        @else
            <div class="date-range">All Time Inventory Report</div>
        @endif
        <div class="date-range">Generated on: {{ $generatedAt }}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-value">{{ number_format($totalItems) }}</div>
            <div class="summary-label">Total Items</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">PHP{{ number_format($totalValue, 2) }}</div>
            <div class="summary-label">Total Inventory Value</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">{{ $lowStockItems }}</div>
            <div class="summary-label">Low Stock Items</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Size</th>
                <th class="text-right">Price</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Value</th>
                <th class="text-center">Status</th>
                <th>Date Added</th>
            </tr>
        </thead>
        <tbody>
            @foreach($inventory as $item)
                <tr>
                    <td>{{ $item->inventory_id }}</td>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->size }}</td>
                    <td class="text-right">PHP{{ $item->price ? number_format((float)$item->price, 2) : '0.00' }}</td>
                    <td class="text-center {{ $item->quantity < 10 ? 'low-stock' : '' }}">
                        {{ $item->quantity }}
                    </td>
                    <td class="text-right">PHP{{ ($item->price && $item->quantity) ? number_format((float)$item->price * (int)$item->quantity, 2) : '0.00' }}</td>
                    <td class="text-center">
                        @if($item->quantity < 10)
                            <span class="status status-low-stock">
                                Low on stocks
                            </span>
                        @else
                            <span class="status status-available">
                                Available
                            </span>
                        @endif
                    </td>
                    <td>{{ $item->date_created ? \Carbon\Carbon::parse($item->date_created)->format('M j, Y') : 'N/A' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($inventory->count() === 0)
        <div style="text-align: center; padding: 40px; color: #666;">
            No inventory items found for the selected date range.
        </div>
    @endif

    <div class="footer">
        <p>This report contains {{ $inventory->count() }} inventory item(s).</p>
        <p>Report generated by RDA Ice System on {{ now()->format('F j, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>