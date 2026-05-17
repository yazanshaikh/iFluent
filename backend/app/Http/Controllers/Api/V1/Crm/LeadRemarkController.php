<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Crm\AddRemarkRequest;
use App\Http\Resources\Api\V1\LeadRemarkResource;
use App\Models\Lead;

class LeadRemarkController extends Controller
{
    /**
     * Store a new immutable remark on a lead.
     * Auto-stamps: staff name + date + time (Jordan timezone) — PRD 5.4.2
     */
    public function store(AddRemarkRequest $request, Lead $lead): LeadRemarkResource
    {
        $this->authorize('addRemark', $lead);

        // Move lead to in_progress when staff first adds a remark (was still 'new')
        if ($lead->status === Lead::STATUS_NEW) {
            $lead->update(['status' => Lead::STATUS_IN_PROGRESS]);
        }

        $remark = $lead->remarks()->create([
            'staff_id' => $request->user()->id,
            'content'  => $request->content,
        ]);

        return new LeadRemarkResource($remark->load('staff'));
    }
}
