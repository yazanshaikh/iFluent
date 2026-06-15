<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * Public endpoint — Landing page reads settings (no auth required).
 */
class SiteSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = SiteSetting::orderBy('group')->orderBy('key')->get();

        $result = $settings->mapWithKeys(function ($s) {
            $value = $s->value;
            // Convert stored image path to full URL
            if ($s->type === 'image' && is_string($value)) {
                $value = Storage::disk('public')->url($value);
            }
            return [$s->key => $value];
        });

        return response()->json(['settings' => $result]);
    }

    /**
     * Lightweight maintenance check — polled by the mobile apps on launch so they
     * can show a friendly "under maintenance" screen instead of network errors.
     */
    public function maintenance(): JsonResponse
    {
        return response()->json([
            'maintenance' => (bool) SiteSetting::get('maintenance_mode', false),
            'message'     => SiteSetting::get('maintenance_message')
                ?: 'التطبيق في صيانة دورية لتحسين التجربة. سنعود قريباً 🙏',
        ]);
    }
}
