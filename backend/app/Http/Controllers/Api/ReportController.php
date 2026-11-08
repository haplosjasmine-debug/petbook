<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reports)
    {
    }

    public function business(Request $request): JsonResponse
    {
        $business = $this->businessFor($request->user());

        abort_if($business === null, 403, 'No business is linked to this account.');

        [$from, $to] = $this->period($request);

        return response()->json([
            'data' => $this->reports->businessSummary($business, $from, $to),
        ]);
    }

    public function platform(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Only platform admins can view this report.');

        [$from, $to] = $this->period($request);

        return response()->json([
            'data' => $this->reports->platformSummary($from, $to),
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function period(Request $request): array
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->string('from'))->startOfDay()
            : now()->startOfMonth();

        $to = $request->filled('to')
            ? Carbon::parse($request->string('to'))->endOfDay()
            : now()->endOfMonth();

        abort_if($from->greaterThan($to), 422, 'The start date must be before the end date.');

        return [$from, $to];
    }
}
