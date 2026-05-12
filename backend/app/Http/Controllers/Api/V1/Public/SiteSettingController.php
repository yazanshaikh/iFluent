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
}
