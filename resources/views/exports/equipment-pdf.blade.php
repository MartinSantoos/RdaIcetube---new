<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Report</title>
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
            width: 25%;
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
        
        .status-operational {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-maintenance {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .status-out-of-service {
            background-color: #f8d7da;
            color: #721c24;
        }

        .status-scheduled {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-completed {
            background-color: #d4edda;
            color: #155724;
        }

        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }

        .maintenance-type-badge {
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
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
        
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">RDA Ice System</div>
        <div class="report-title">Maintenance Report</div>
        @if($startDate && $endDate)
            <div class="date-range">
                Period: {{ \Carbon\Carbon::parse($startDate)->format('F j, Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('F j, Y') }}
            </div>
        @else
            <div class="date-range">All Time Maintenance Report</div>
        @endif
        <div class="date-range">Generated on: {{ $generatedAt }}</div>
    </div>

    @php
        $allMaintenances = $equipment->flatMap(function($item) {
            return $item->maintenances ?? collect();
        });
        $totalMaintenanceRecords = $allMaintenances->count();
        $scheduledMaintenance = $allMaintenances->where('status', 'scheduled')->count();
        $completedMaintenance = $allMaintenances->where('status', 'completed')->count();
        $totalMaintenanceCost = $allMaintenances->sum('cost');
    @endphp

    <div class="summary">
        <div class="summary-item">
            <div class="summary-value">{{ number_format($totalMaintenanceRecords) }}</div>
            <div class="summary-label">Total Records</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">{{ number_format($scheduledMaintenance) }}</div>
            <div class="summary-label">Scheduled</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">{{ number_format($completedMaintenance) }}</div>
            <div class="summary-label">Completed</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">PHP{{ number_format($totalMaintenanceCost, 2) }}</div>
            <div class="summary-label">Total Cost</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Equipment</th>
                <th>Maintenance Type</th>
                <th class="text-center">Status</th>
                <th>Scheduled Date</th>
                <th>Cost</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            @foreach($equipment as $item)
                @if($item->maintenances && $item->maintenances->count() > 0)
                    @foreach($item->maintenances->sortByDesc('maintenance_date') as $maintenance)
                        <tr>
                            <td>
                                <strong>{{ $item->equipment_name }}</strong><br>
                                <small style="color: #666;">{{ $item->equipment_type }}</small>
                            </td>
                            <td>
                                <span class="maintenance-type-badge">{{ $maintenance->maintenance_type }}</span>
                            </td>
                            <td class="text-center">
                                <span class="status status-{{ strtolower($maintenance->status) }}">
                                    {{ ucfirst($maintenance->status) }}
                                </span>
                            </td>
                            <td>
                                {{ $maintenance->maintenance_date ? \Carbon\Carbon::parse($maintenance->maintenance_date)->format('M j, Y') : 'N/A' }}<br>
                                <small style="color: #666;">
                                    Scheduled: {{ $maintenance->created_at ? $maintenance->created_at->format('M j, Y') : 'N/A' }}
                                </small>
                            </td>
                            <td>
                                @if($maintenance->cost)
                                    <strong style="color: #4caf50;">PHP{{ number_format($maintenance->cost, 2) }}</strong>
                                @else
                                    <span style="color: #999;">Not specified</span>
                                @endif
                            </td>
                            <td>
                                {{ $maintenance->description ?: 'No description' }}
                            </td>
                        </tr>
                    @endforeach
                @endif
            @endforeach
        </tbody>
    </table>

    @if($totalMaintenanceRecords === 0)
        <div style="text-align: center; padding: 40px; color: #666;">
            No maintenance records found for the selected date range.
        </div>
    @endif

    <div class="footer">
        <p>This report contains {{ $totalMaintenanceRecords }} maintenance record(s).</p>
        <p>Report generated by RDA Ice System on {{ now()->format('F j, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>