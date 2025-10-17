<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'description',
        'model_type',
        'model_id',
        'properties',
        'ip_address',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related model (polymorphic relationship).
     */
    public function model()
    {
        if ($this->model_type && $this->model_id) {
            return $this->model_type::find($this->model_id);
        }
        return null;
    }

    /**
     * Log an activity.
     */
    public static function log(string $action, string $description, ?Model $model = null, array $properties = [], ?int $userId = null): void
    {
        // Get the user ID, ensure it's a valid integer
        $currentUserId = $userId ?? auth()->id();
        
        // If auth()->id() is not a valid integer or is null, skip logging
        if (!is_numeric($currentUserId) || $currentUserId === null) {
            \Log::warning('ActivityLog: Invalid user_id, skipping log entry', [
                'user_id' => $currentUserId,
                'action' => $action,
                'auth_check' => auth()->check(),
                'user_object' => auth()->user()
            ]);
            return;
        }

        $log = new self([
            'user_id' => (int)$currentUserId,
            'action' => $action,
            'description' => $description,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->id,
            'properties' => $properties,
            'ip_address' => request()->ip(),
        ]);

        $log->save();
    }
}
