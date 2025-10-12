<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employees Report</title>
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
        
        .status-active {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-inactive {
            background-color: #f8d7da;
            color: #721c24;
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
        <div class="report-title">Employees Report</div>
        @if($startDate && $endDate)
            <div class="date-range">
                Period: {{ \Carbon\Carbon::parse($startDate)->format('F j, Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('F j, Y') }}
            </div>
        @else
            <div class="date-range">All Time Employees Report</div>
        @endif
        <div class="date-range">Generated on: {{ $generatedAt }}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-value">{{ number_format($totalEmployees) }}</div>
            <div class="summary-label">Total Employees</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">{{ number_format($activeEmployees) }}</div>
            <div class="summary-label">Active Employees</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">{{ number_format($inactiveEmployees) }}</div>
            <div class="summary-label">Inactive Employees</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Position</th>
                <th>Contact</th>
                <th class="text-center">Status</th>
                <th>Hire Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $employee)
                <tr>
                    <td>{{ $employee->id }}</td>
                    <td>{{ $employee->name }}</td>
                    <td>{{ $employee->username }}</td>
                    <td>{{ $employee->position }}</td>
                    <td>{{ $employee->contact }}</td>
                    <td class="text-center">
                        <span class="status {{ $employee->status === 'active' ? 'status-active' : 'status-inactive' }}">
                            {{ ucfirst($employee->status) }}
                        </span>
                    </td>
                    <td>{{ $employee->created_at ? $employee->created_at->format('M j, Y') : 'N/A' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($employees->count() === 0)
        <div style="text-align: center; padding: 40px; color: #666;">
            No employees found for the selected date range.
        </div>
    @endif

    <div class="footer">
        <p>This report contains {{ $employees->count() }} employee record(s).</p>
        <p>Report generated by RDA Ice System on {{ now()->format('F j, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>