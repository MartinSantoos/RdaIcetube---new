// Test the updateStock functionality in tinker
use App\Models\Inventory;
use App\Models\User;
use App\Http\Controllers\InventoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Authenticate as admin
$user = User::where('username', 'mavs')->first();
Auth::login($user);
echo "Authenticated as: " . $user->username . "\n";

// Get first inventory item
$item = Inventory::first();
echo "Testing with item: " . $item->product_name . " (ID: " . $item->inventory_id . ")\n";
echo "Current quantity: " . $item->quantity . "\n";

// Create a mock request
$request = new Request();
$request->merge(['operation' => 'Add', 'quantity' => 3]);

// Test the controller
$controller = new InventoryController();
$response = $controller->updateStock($request, $item->inventory_id);

// Check the result
$updatedItem = Inventory::where('inventory_id', $item->inventory_id)->first();
echo "New quantity: " . $updatedItem->quantity . "\n";
echo "Status: " . $updatedItem->status . "\n";
