<?php

use App\Http\Controllers\Api\V1\Admin\AdminMessageController;
use App\Http\Controllers\Api\V1\Admin\EarningsController as AdminEarningsController;
use App\Http\Controllers\Api\V1\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\QuizController as AdminQuizController;
use App\Http\Controllers\Api\V1\Admin\RatingController as AdminRatingController;
use App\Http\Controllers\Api\V1\Admin\SiteSettingController as AdminSiteSettingController;
use App\Http\Controllers\Api\V1\Admin\StaffController;
use App\Http\Controllers\Api\V1\Admin\StudentEnrollmentController;
use App\Http\Controllers\Api\V1\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Api\V1\Auth\CrmAuthController;
use App\Http\Controllers\Api\V1\Auth\StudentAuthController;
use App\Http\Controllers\Api\V1\Crm\CheckoutController;
use App\Http\Controllers\Api\V1\Crm\DashboardController;
use App\Http\Controllers\Api\V1\Crm\PaidStudentController;
use App\Http\Controllers\Api\V1\Crm\ProcessOrderController;
use App\Http\Controllers\Api\V1\Crm\DemoBookingController;
use App\Http\Controllers\Api\V1\Crm\LeadController;
use App\Http\Controllers\Api\V1\Crm\LeadRemarkController;
use App\Http\Controllers\Api\V1\Public\BookingController as PublicBookingController;
use App\Http\Controllers\Api\V1\Public\EvalBookingController as PublicEvalBookingController;
use App\Http\Controllers\Api\V1\Public\InvoiceController as PublicInvoiceController;
use App\Http\Controllers\Api\V1\Public\LeadController as PublicLeadController;
use App\Http\Controllers\Api\V1\Public\SiteSettingController as PublicSiteSettingController;
use App\Http\Controllers\Api\V1\Student\BookingController as StudentBookingController;
use App\Http\Controllers\Api\V1\Student\MessageController as StudentMessageController;
use App\Http\Controllers\Api\V1\Student\GroupClassController as StudentGroupClassController;
use App\Http\Controllers\Api\V1\Student\LessonController as StudentLessonController;
use App\Http\Controllers\Api\V1\Student\NotebookController;
use App\Http\Controllers\Api\V1\Student\ProfileController as StudentProfileController;
use App\Http\Controllers\Api\V1\Student\QuizController as StudentQuizController;
use App\Http\Controllers\Api\V1\Student\SessionController as StudentSessionController;
use App\Http\Controllers\Api\V1\Student\SessionRatingController;
use App\Http\Controllers\Api\V1\Student\TeacherProfileController as StudentTeacherProfileController;
use App\Http\Controllers\Api\V1\Teacher\AvailabilityController as TeacherAvailabilityController;
use App\Http\Controllers\Api\V1\Teacher\EarningsController as TeacherEarningsController;
use App\Http\Controllers\Api\V1\Teacher\GroupClassController as TeacherGroupClassController;
use App\Http\Controllers\Api\V1\Teacher\ProfileController as TeacherOwnProfileController;
use App\Http\Controllers\Api\V1\Teacher\RequestController as TeacherRequestController;
use App\Http\Controllers\Api\V1\Teacher\SessionController as TeacherSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| iFluent API — v1
| All routes are prefixed with /api/v1  (set in bootstrap/app.php)
|--------------------------------------------------------------------------
*/

// ─── Public (no auth) ─────────────────────────────────────────────────────────
Route::get ('settings',                            [PublicSiteSettingController::class, 'index']);
Route::post('public/booking',                      [PublicBookingController::class,     'store']);
Route::get ('public/invoice/{uuid}',               [PublicInvoiceController::class,     'show']);
Route::post('public/invoice/{uuid}/receipt',       [PublicInvoiceController::class,     'uploadReceipt']);
Route::post('public/leads',                        [PublicLeadController::class,        'store']);    // simple lead form (name+phone only)
Route::post('public/eval-booking',                 [PublicEvalBookingController::class,  'store']);    // timed eval booking → Trial Bookings in CRM
Route::get ('public/eval-booking/status',          [PublicEvalBookingController::class,  'status']);   // check active booking by phone

// ─── CRM Auth ─────────────────────────────────────────────────────────────────
Route::prefix('crm/auth')->group(function () {
    Route::post('login', [CrmAuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [CrmAuthController::class, 'logout']);
        Route::get('me',      [CrmAuthController::class, 'me']);
    });
});

// ─── Student Auth ─────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    // Legacy OTP (kept for local dev / fallback)
    Route::post('send-otp',   [StudentAuthController::class, 'sendOtp']);
    Route::post('verify-otp', [StudentAuthController::class, 'verifyOtp']);

    // Firebase Phone Auth flow
    Route::post('check-phone',      [StudentAuthController::class, 'checkPhone']);
    Route::post('register',         [StudentAuthController::class, 'register']);
    Route::post('firebase-verify',  [StudentAuthController::class, 'firebaseVerify']);
    Route::post('secret-login',     [StudentAuthController::class, 'secretLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [StudentAuthController::class, 'logout']);
    });
});

// ─── CRM — Admin + CC + SS ────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:super_admin,cc,ss'])
    ->prefix('crm')
    ->group(function () {

        // ── Dashboard ──────────────────────────────────────────────────────────
        Route::get('dashboard', [DashboardController::class, 'index']);

        // ── Leads ──────────────────────────────────────────────────────────────
        Route::get   ('leads',             [LeadController::class, 'index']);
        Route::post  ('leads',             [LeadController::class, 'store']);
        Route::get   ('leads/open-sea',    [LeadController::class, 'openSea']);
        Route::get   ('leads/{lead}',      [LeadController::class, 'show']);
        Route::put   ('leads/{lead}',      [LeadController::class, 'update']);
        Route::delete('leads/{lead}',      [LeadController::class, 'destroy']);

        Route::post('leads/{lead}/assign',         [LeadController::class, 'assign']);
        Route::post('leads/{lead}/recall',         [LeadController::class, 'recall']);
        Route::post('leads/{lead}/small-treasure', [LeadController::class, 'toggleSmallTreasure']);
        Route::post('leads/{lead}/pull-from-sea',  [LeadController::class, 'pullFromSea']);

        // ── Remarks ────────────────────────────────────────────────────────────
        Route::post('leads/{lead}/remarks', [LeadRemarkController::class, 'store']);

        // ── Demo Booking (CC books assessment session for lead) ────────────────
        Route::get ('demo-bookings',                                    [DemoBookingController::class, 'all']);
        Route::get ('leads/{lead}/demo-requests',                      [DemoBookingController::class, 'index']);
        Route::post('leads/{lead}/demo-requests',                      [DemoBookingController::class, 'store']);
        Route::post ('demo-requests/{sessionRequest}/cancel',           [DemoBookingController::class, 'cancel']);
        Route::patch('demo-requests/{sessionRequest}/change-lesson',    [DemoBookingController::class, 'changeLesson']);

        // ── Checkout — generate invoice ────────────────────────────────────────
        Route::post('leads/{lead}/checkout', [CheckoutController::class, 'store']);

        // ── Process Orders — upload receipt on behalf of customer ──────────────
        Route::get ('process-orders',                               [ProcessOrderController::class,  'index']);
        Route::post('process-orders/{subscription}/upload-receipt', [ProcessOrderController::class,  'uploadReceipt']);
        Route::post('process-orders/{subscription}/cancel',         [CheckoutController::class,       'cancel']);

        // ── Paid Students ──────────────────────────────────────────────────────
        Route::get('paid-students', [PaidStudentController::class, 'index']);

        // ── Assessment Lessons (view only for CC/SS) ───────────────────────────
        // CC/SS need to see them to pick one for demo bookings.
        // Editing nearpod content is ADMIN ONLY (moved to /admin group below).
        Route::get('assessment-lessons', [AdminLessonController::class, 'assessments']);
        Route::get('lessons',            [AdminLessonController::class, 'index']);        // lesson-range picker
    });

// ─── Admin Only ───────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->prefix('admin')
    ->group(function () {

        // ── Staff Management ───────────────────────────────────────────────────
        Route::get ('staff',                       [StaffController::class, 'index']);
        Route::get ('staff/performance',           [StaffController::class, 'performance']);
        Route::get ('staff/{id}',                  [StaffController::class, 'show']);
        Route::post('staff/crm',                   [StaffController::class, 'createCrmStaff']);
        Route::post('staff/teachers',              [StaffController::class, 'createTeacher']);
        Route::put ('staff/{id}',                  [StaffController::class, 'update']);
        Route::post('staff/{id}/toggle-status',    [StaffController::class, 'toggleStatus']);
        Route::post('staff/{id}/reset-sessions',   [StaffController::class, 'resetSessionsCount']);
        Route::get ('staff/{id}/demo-bookings',    [StaffController::class, 'teacherDemoBookings']);

        // ── Subscription Approvals ─────────────────────────────────────────────
        Route::get ('subscriptions',                             [AdminSubscriptionController::class, 'index']);
        Route::get ('subscriptions/pending',                     [AdminSubscriptionController::class, 'pending']);
        Route::post('subscriptions/{subscription}/approve',             [AdminSubscriptionController::class, 'approve']);
        Route::post('subscriptions/{subscription}/reject',              [AdminSubscriptionController::class, 'reject']);
        Route::post('subscriptions/{subscription}/cancel-subscription', [AdminSubscriptionController::class, 'cancelSubscription']);
        Route::get ('subscriptions/{subscription}/screenshot',          [AdminSubscriptionController::class, 'screenshot'])
            ->name('admin.subscription.screenshot');

        // ── Student Unit Enrollment ────────────────────────────────────────────
        Route::get ('students/{student}/units',         [StudentEnrollmentController::class, 'index']);
        Route::post('students/{student}/units/enroll',  [StudentEnrollmentController::class, 'enroll']);
        Route::post('students/{student}/units/revoke',  [StudentEnrollmentController::class, 'revoke']);

        // ── Lesson Content Management (Admin Only) ─────────────────────────────
        // Editing nearpod_url / nearpod_lesson_id for ANY lesson type.
        // CC/SS have NO access to these endpoints.
        Route::put('lessons/{lesson}/content',              [AdminLessonController::class, 'updateContent']);

        // Assessment lessons: admin can also change level_id, is_active, title
        Route::put('assessment-lessons/{lesson}',           [AdminLessonController::class, 'updateAssessment']);

        // View all assessment lessons (admin also needs this for content management)
        Route::get('assessment-lessons',                    [AdminLessonController::class, 'assessments']);

        // ── Quiz / Question Bank Management (Admin Only) ───────────────────────
        Route::get   ('lessons/{lesson}/quiz',              [AdminQuizController::class, 'show']);
        Route::post  ('lessons/{lesson}/quiz',              [AdminQuizController::class, 'store']);
        Route::post  ('lessons/{lesson}/quiz/toggle',       [AdminQuizController::class, 'toggleActive']);
        Route::post  ('lessons/{lesson}/quiz/questions',    [AdminQuizController::class, 'addQuestion']);
        Route::put   ('quiz-questions/{question}',          [AdminQuizController::class, 'updateQuestion']);
        Route::delete('quiz-questions/{question}',          [AdminQuizController::class, 'deleteQuestion']);

        // ── Teacher Earnings & Commission ──────────────────────────────────────
        Route::get('teacher-balances',                        [AdminEarningsController::class, 'balances']);
        Route::get('teacher-earnings/{id}',                   [AdminEarningsController::class, 'history']);
        Route::put('teachers/{id}/commission-rate',           [AdminEarningsController::class, 'updateRate']);

        // ── Teacher Ratings ────────────────────────────────────────────────────
        Route::get('teacher-ratings',                         [AdminRatingController::class, 'teacherSummary']);
        Route::get('teacher-ratings/{id}',                    [AdminRatingController::class, 'teacherRatings']);

        // ── Admin Messages ─────────────────────────────────────────────────────
        Route::get ('messages',       [AdminMessageController::class, 'index']);
        Route::post('messages',       [AdminMessageController::class, 'store']);

        // ── Landing Page CMS ───────────────────────────────────────────────────
        Route::get  ('settings',                  [AdminSiteSettingController::class, 'index']);
        Route::patch('settings',                  [AdminSiteSettingController::class, 'bulkUpdate']);
        Route::put  ('settings/{key}',            [AdminSiteSettingController::class, 'update']);
        Route::post ('settings/{key}/image',      [AdminSiteSettingController::class, 'uploadImage']);
        Route::delete('settings/{key}',           [AdminSiteSettingController::class, 'destroy']);

    });

// ─── Student ──────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:student'])
    ->prefix('student')
    ->group(function () {

        // ── Profile ────────────────────────────────────────────────────────────
        Route::get  ('profile',           [StudentProfileController::class, 'show']);
        Route::patch('profile',           [StudentProfileController::class, 'update']);
        Route::post ('device-token',      [StudentProfileController::class, 'updateFcmToken']);

        // ── Curriculum ─────────────────────────────────────────────────────────
        Route::get('levels',   [StudentLessonController::class, 'levels']);        // full roadmap
        Route::get('my-units', [StudentLessonController::class, 'enrolledUnits']); // purchased units

        // ── Quiz Engine ────────────────────────────────────────────────────────
        Route::get ('lessons/{lesson}/quiz',        [StudentQuizController::class, 'show']);
        Route::post('lessons/{lesson}/quiz/submit', [StudentQuizController::class, 'submit']);
        Route::get ('progress',                     [StudentQuizController::class, 'progress']);

        // ── Assessment lessons list (for non-subscribed students) ────────────
        Route::get('assessment-lessons', [StudentLessonController::class, 'assessmentLessons']);

        // ── Session Booking ────────────────────────────────────────────────────
        Route::get   ('bookings',                          [StudentBookingController::class, 'index']);
        Route::post  ('bookings',                          [StudentBookingController::class, 'store']);
        Route::get   ('bookings/{sessionRequest}/profile', [StudentBookingController::class, 'profile']);
        Route::post  ('bookings/{sessionRequest}/cancel',  [StudentBookingController::class, 'cancel']);

        // ── Sessions ───────────────────────────────────────────────────────────
        Route::get ('sessions',                       [StudentSessionController::class, 'index']);
        Route::get ('sessions/{session}/profile',     [StudentSessionController::class, 'profile']);
        Route::get ('sessions/{session}/join',        [StudentSessionController::class, 'join']);
        Route::post('sessions/{session}/rate',        [SessionRatingController::class, 'store']);
        Route::get ('sessions/{session}/rate/check',  [SessionRatingController::class, 'check']);

        // ── Teacher Public Profile ─────────────────────────────────────────────
        Route::get('teachers/{teacherCode}', [StudentTeacherProfileController::class, 'show']);

        // ── Group Classes ──────────────────────────────────────────────────────
        Route::get ('group-classes',                        [StudentGroupClassController::class, 'index']);
        Route::get ('group-classes/mine',                   [StudentGroupClassController::class, 'mine']);
        Route::post('group-classes/{groupClass}/register',  [StudentGroupClassController::class, 'register']);
        Route::post('group-classes/{groupClass}/leave',     [StudentGroupClassController::class, 'leave']);
        Route::get ('group-classes/{groupClass}/join',      [StudentGroupClassController::class, 'join']);

        // ── Messages (from admin) ──────────────────────────────────────────────
        Route::get ('messages',                  [StudentMessageController::class, 'index']);
        Route::get ('messages/unread-count',     [StudentMessageController::class, 'unreadCount']);
        Route::post('messages/{id}/read',        [StudentMessageController::class, 'markRead']);

        // ── Notebook ───────────────────────────────────────────────────────────
        Route::get   ('notebook',                     [NotebookController::class, 'index']);
        Route::post  ('notebook',                     [NotebookController::class, 'store']);
        Route::get   ('notebook/{notebookEntry}',     [NotebookController::class, 'show']);
        Route::patch ('notebook/{notebookEntry}',     [NotebookController::class, 'update']);
        Route::delete('notebook/{notebookEntry}',     [NotebookController::class, 'destroy']);
        Route::post  ('notebook/{notebookEntry}/pin', [NotebookController::class, 'togglePin']);
    });

// ─── Teacher Auth (public) ───────────────────────────────────────────────────
Route::prefix('teacher/auth')->group(function () {
    Route::post('login',  [\App\Http\Controllers\Api\V1\Auth\TeacherAuthController::class, 'login']);
    Route::post('logout', [\App\Http\Controllers\Api\V1\Auth\TeacherAuthController::class, 'logout'])
        ->middleware('auth:sanctum');
    Route::get('me',      [\App\Http\Controllers\Api\V1\Auth\TeacherAuthController::class, 'me'])
        ->middleware('auth:sanctum');
});

// ─── Teacher ──────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:teacher'])
    ->prefix('teacher')
    ->group(function () {

        // ── Lesson Browsing ────────────────────────────────────────────────────
        Route::get('lessons',            [TeacherSessionController::class, 'lessons']);           // regular
        Route::get('assessment-lessons', [TeacherSessionController::class, 'assessmentLessons']); // evaluation

        // ── Requests Center ────────────────────────────────────────────────────
        Route::get ('requests',                          [TeacherRequestController::class, 'index']);          // all visible
        Route::get ('requests/pool',                     [TeacherRequestController::class, 'pool']);           // unassigned pool
        Route::get ('requests/private',                  [TeacherRequestController::class, 'privateRequests']); // directed
        Route::post('requests/{sessionRequest}/accept',  [TeacherRequestController::class, 'accept']);
        Route::post('requests/{sessionRequest}/reject',  [TeacherRequestController::class, 'reject']);

        // ── Profile ────────────────────────────────────────────────────────────
        Route::get  ('profile',        [TeacherOwnProfileController::class, 'show']);
        Route::patch('profile',        [TeacherOwnProfileController::class, 'update']);
        Route::post ('profile/photo',  [TeacherOwnProfileController::class, 'uploadPhoto']);
        Route::post ('device-token',   [TeacherOwnProfileController::class, 'updateFcmToken']);

        // ── Earnings ───────────────────────────────────────────────────────────
        Route::get('earnings', [TeacherEarningsController::class, 'index']);

        // ── Availability Schedule ──────────────────────────────────────────────
        Route::get   ('availability',          [TeacherAvailabilityController::class, 'index']);
        Route::post  ('availability',          [TeacherAvailabilityController::class, 'store']);
        Route::put   ('availability/{availability}', [TeacherAvailabilityController::class, 'update']);
        Route::delete('availability/{availability}', [TeacherAvailabilityController::class, 'destroy']);
        Route::post  ('availability/bulk',     [TeacherAvailabilityController::class, 'bulkReplace']);

        // ── Group Classes ──────────────────────────────────────────────────────
        Route::get  ('group-classes',                    [TeacherGroupClassController::class, 'index']);
        Route::post ('group-classes',                    [TeacherGroupClassController::class, 'store']);
        Route::get  ('group-classes/{groupClass}',       [TeacherGroupClassController::class, 'show']);
        Route::patch('group-classes/{groupClass}',       [TeacherGroupClassController::class, 'update']);
        Route::post ('group-classes/{groupClass}/start', [TeacherGroupClassController::class, 'start']);
        Route::post ('group-classes/{groupClass}/end',   [TeacherGroupClassController::class, 'end']);
        Route::post ('group-classes/{groupClass}/cancel',[TeacherGroupClassController::class, 'cancel']);

        // ── Sessions ───────────────────────────────────────────────────────────
        Route::get  ('sessions',                  [TeacherSessionController::class, 'index']);
        Route::post ('sessions',                  [TeacherSessionController::class, 'store']);
        Route::get  ('sessions/{session}',        [TeacherSessionController::class, 'show']);
        Route::post ('sessions/{session}/start',  [TeacherSessionController::class, 'start']);
        Route::patch('sessions/{session}/pin',    [TeacherSessionController::class, 'updatePin']);
        Route::post ('sessions/{session}/end',    [TeacherSessionController::class, 'end']);
        Route::post ('sessions/{session}/cancel', [TeacherSessionController::class, 'cancel']);
    });

