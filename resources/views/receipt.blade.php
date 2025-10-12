<!DOCTYPE html>
<html>
<head>
    <title>Receipt - Order #{{ $order->order_id }}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white; 
            color: #333;
        }
        .receipt { 
            max-width: 400px; 
            margin: 0 auto; 
            border: 1px solid #ddd;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
        }
        .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .company-info {
            font-size: 14px;
            color: #666;
            margin-bottom: 3px;
        }
        .receipt-details { 
            margin-bottom: 20px; 
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 2px 0;
        }
        .detail-row strong {
            font-weight: bold;
        }
        .items-section { 
            border-top: 2px solid #333; 
            border-bottom: 2px solid #333; 
            padding: 15px 0; 
            margin: 20px 0; 
        }
        .items-header { 
            display: flex; 
            justify-content: space-between; 
            font-weight: bold; 
            margin-bottom: 10px; 
            padding-bottom: 5px;
            border-bottom: 1px solid #ccc;
        }
        .items-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px; 
        }
        .customer-section { 
            margin: 20px 0; 
            padding: 15px 0;
            border-top: 1px solid #ccc;
        }
        .customer-section h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: bold;
        }
        .customer-details div { 
            margin-bottom: 5px; 
            font-size: 14px;
        }
        .total-section { 
            border-top: 2px solid #333; 
            padding-top: 15px; 
            margin-top: 20px; 
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            font-size: 20px; 
            font-weight: bold; 
        }
        .footer { 
            text-align: center; 
            margin-top: 25px; 
            border-top: 1px solid #ccc; 
            padding-top: 15px; 
        }
        .footer p { 
            font-size: 12px; 
            color: #666; 
            margin: 5px 0; 
        }
        .print-section { 
            margin: 20px 0; 
            text-align: center; 
        }
        .print-button { 
            padding: 12px 24px; 
            background: #007cba; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-size: 16px;
        }
        .print-button:hover {
            background: #005a8c;
        }
        @media print { 
            body { margin: 0; } 
            .print-section { display: none; } 
            .receipt { 
                border: none; 
                max-width: none; 
                margin: 0; 
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="company-name text-blue-500">RDA Tube Ice</div>
            <div class="company-info">Mecauyan, Bulacan</div>
            <div class="company-info">Phone: 1111 - 111 - 1111</div>
        </div>
        
        <div class="receipt-details">
            <div class="detail-row">
                <span><strong>Receipt#:</strong></span>
                <span>{{ $order->order_id }}</span>
            </div>
            <div class="detail-row">
                <span><strong>Order Date:</strong></span>
                <span>{{ $order->order_date->format('m/d/y') }}</span>
            </div>
            <div class="detail-row">
                <span><strong>Delivery Date:</strong></span>
                <span>{{ $order->delivery_date->format('m/d/y') }}</span>
            </div>
            <div class="detail-row">
                <span><strong>Status:</strong></span>
                <span style="text-transform: capitalize;">{{ $order->status }}</span>
            </div>
        </div>
        
        <div class="items-section">
            <div class="items-header">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Amount</span>
            </div>
            <div class="items-row">
                <span>Tube Ice ({{ ucfirst($order->size) }})</span>
                <span>{{ $order->quantity }}</span>
                <span>₱{{ number_format($order->price, 2) }}</span>
                <span>₱{{ number_format($order->total, 2) }}</span>
            </div>
        </div>
        
        <div class="customer-section">
            <h3>Customer Information</h3>
            <div class="customer-details">
                <div><strong>Name:</strong> {{ $order->customer_name }}</div>
                <div><strong>Address:</strong> {{ $order->address }}</div>
                <div><strong>Contact:</strong> {{ $order->contact_number }}</div>
                <div><strong>Delivery Mode:</strong> {{ ucwords(str_replace('_', ' ', $order->delivery_mode)) }}</div>
                <div><strong>Size:</strong> {{ ucfirst($order->size) }}</div>
                <div><strong>Quantity:</strong> {{ $order->quantity }} pcs</div>
            </div>
        </div>
        
        <div class="total-section">
            <div class="total-row">
                <span>Total Amount:</span>
                <span>₱{{ number_format($order->total, 2) }}</span>
            </div>
        </div>
        
        <div class="footer">
            @if($order->created_at)
                <p>Order created on {{ $order->created_at->format('m/d/Y g:i A') }}</p>
            @else
                <p>Order date: {{ $order->order_date->format('m/d/Y') }}</p>
            @endif
            <p>Thank you for your business!</p>
        </div>
        
        <div class="print-section">
            <button class="print-button" onclick="window.print()">Print Receipt</button>
        </div>
    </div>
</body>
</html>