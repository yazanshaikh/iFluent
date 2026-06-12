<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Services\StudentProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student progress summary — powers the "التقدم" screen.
 * Computation lives in StudentProgressService so the CRM student profile
 * shows the exact same numbers.
 */
class ProgressController extends Controller
{
    public function summary(Request $request, StudentProgressService $progress): JsonResponse
    {
        return response()->json($progress->summary($request->user()));
    }
}
