<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DEBUG - Sales Report Data</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .debug { background-color: #ffeb3b; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>DEBUG: Sales Report Data</h1>
    
    <div class="debug">
        <h3>Summary:</h3>
        <p>Total Orders: {{ $totalOrders ?? 'NULL' }}</p>
        <p>Total Revenue: {{ $totalRevenue ?? 'NULL' }}</p>
        <p>Orders Count: {{ $orders->count() }}</p>
    </div>
    
    <h2>Order Details:</h2>
    <table>
        <tr>
            <th>Order ID</th>
            <th>Size</th>
            <th>Quantity</th>
            <th>Price (Raw)</th>
            <th>Price (Formatted)</th>
            <th>Total (Raw)</th>
            <th>Total (Formatted)</th>
        </tr>
        @foreach($orders as $order)
        <tr>
            <td>{{ $order->order_id }}</td>
            <td>{{ $order->size }}</td>
            <td>{{ $order->quantity }}</td>
            <td class="debug">{{ $order->price ?? 'NULL' }}</td>
            <td>₱{{ $order->price ? number_format((float)$order->price, 2) : '0.00' }}</td>
            <td class="debug">{{ $order->total ?? 'NULL' }}</td>
            <td>₱{{ $order->total ? number_format((float)$order->total, 2) : '0.00' }}</td>
        </tr>
        @endforeach
    </table>
</body>
</html>