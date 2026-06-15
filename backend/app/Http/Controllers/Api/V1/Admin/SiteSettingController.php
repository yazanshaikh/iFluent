<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Landing Page CMS — Admin manages all public-facing content.
 *
 * Settings are key-value pairs grouped by section:
 *   hero    → hero_title, hero_subtitle, hero_image
 *   about   → about_text, about_image
 *   contact → contact_phone, contact_email, contact_whatsapp
 *   footer  → footer_text, social_links (JSON)
 *   general → platform_name, logo, favicon
 */
class SiteSettingController extends Controller
{
    // ─── List All Settings (grouped) ─────────────────────────────────────────

    public function index(): JsonResponse
    {
        $settings = SiteSetting::orderBy('group')->orderBy('key')->get();

        $grouped = $settings->groupBy('group')->map(fn($group) =>
            $group->mapWithKeys(fn($s) => [$s->key => [
                'value' => $s->value,
                'type'  => $s->type,
                'label' => $s->label,
            ]])
        );

        return response()->json(['settings' => $grouped]);
    }

    // ─── Update a Text/JSON Setting ───────────────────────────────────────────

    public function update(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => ['required'],
            'label' => ['sometimes', 'nullable', 'string', 'max:100'],
            'group' => ['sometimes', 'string', 'max:50'],
            'type'  => ['sometimes', 'in:text,html,json,boolean'],
        ]);

        $setting = SiteSetting::updateOrCreate(
            ['key' => $key],
            [
                'value' => $validated['value'],
                'label' => $validated['label'] ?? null,
                'group' => $validated['group'] ?? 'general',
                'type'  => $validated['type'] ?? 'text',
            ]
        );

        return response()->json([
            'message' => 'Setting updated.',
            'setting' => ['key' => $setting->key, 'value' => $setting->value],
        ]);
    }

    // ─── Upload Image Setting ─────────────────────────────────────────────────

    /**
     * POST /admin/settings/{key}/image
     * Uploads an image and stores the public URL as the setting value.
     * Replaces old image if it exists.
     */
    public function uploadImage(Request $request, string $key): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'], // 5MB
        ]);

        // Delete old image if it was a stored file
        $existing = SiteSetting::where('key', $key)->first();
        if ($existing && is_string($existing->value) && str_starts_with($existing->value, 'site/')) {
            Storage::disk('public')->delete($existing->value);
        }

        $path = $request->file('image')->store("site/{$key}", 'public');
        $url  = Storage::disk('public')->url($path);

        $setting = SiteSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $path, 'type' => 'image', 'group' => $request->input('group', 'general')]
        );

        return response()->json([
            'message' => 'Image uploaded.',
            'url'     => $url,
            'path'    => $path,
        ]);
    }

    // ─── Bulk Update ──────────────────────────────────────────────────────────

    /**
     * PATCH /admin/settings
     * { "settings": { "hero_title": "Learn English...", "hero_subtitle": "..." } }
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings'   => ['required', 'array'],
            'settings.*' => ['nullable'],
        ]);

        foreach ($validated['settings'] as $key => $value) {
            SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => count($validated['settings']) . ' settings updated.']);
    }

    // ─── Maintenance Mode (mobile apps) ───────────────────────────────────────

    public function getMaintenance(): JsonResponse
    {
        return response()->json([
            'maintenance' => (bool) SiteSetting::get('maintenance_mode', false),
            'message'     => SiteSetting::get('maintenance_message'),
        ]);
    }

    public function setMaintenance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'message' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        SiteSetting::set('maintenance_mode', $data['enabled']);
        if (!empty($data['message'])) {
            SiteSetting::set('maintenance_message', $data['message']);
        }

        return response()->json([
            'maintenance' => $data['enabled'],
            'message'     => SiteSetting::get('maintenance_message'),
        ]);
    }

    // ─── Delete Setting ───────────────────────────────────────────────────────

    public function destroy(string $key): JsonResponse
    {
        $setting = SiteSetting::where('key', $key)->firstOrFail();

        if ($setting->type === 'image' && is_string($setting->value)) {
            Storage::disk('public')->delete($setting->value);
        }

        $setting->delete();

        return response()->json(['message' => 'Setting deleted.']);
    }
}
