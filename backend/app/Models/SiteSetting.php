<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'label', 'group'];

    protected $casts = ['value' => 'json'];

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }
}
