/** A clear Arabic message for a phone-verification failure. */
const MESSAGES: Record<string, string> = {
  'auth/invalid-verification-code': 'رمز التحقق غير صحيح. تأكد من إدخال آخر رمز وصلك.',
  'auth/session-expired':           'انتهت صلاحية الرمز. اضغط "إعادة الإرسال" للحصول على رمز جديد.',
  'auth/code-expired':              'انتهت صلاحية الرمز. اضغط "إعادة الإرسال" للحصول على رمز جديد.',
  'auth/invalid-phone-number':      'رقم الهاتف غير صحيح. يرجى التأكد منه والمحاولة مرة أخرى.',
  'auth/too-many-requests':         'تم تنفيذ محاولات كثيرة من هذا الجهاز. يرجى المحاولة لاحقاً.',
  'auth/quota-exceeded':            'تعذّر إرسال الرمز حالياً. يرجى المحاولة لاحقاً.',
  'auth/network-request-failed':    'تعذّر الاتصال بالإنترنت. يرجى التحقق من الشبكة والمحاولة مرة أخرى.',
};

export function otpErrorMessage(err: any): string {
  // Our own API already answers in Arabic.
  const apiMessage = err?.response?.data?.message;
  if (apiMessage) return apiMessage;

  const code: string | undefined = err?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];

  // Keep the code visible so an unexpected failure can be reported and traced.
  return code
    ? `تعذّر إتمام عملية التحقق. يرجى المحاولة مرة أخرى. (${code.replace('auth/', '')})`
    : 'تعذّر إتمام عملية التحقق. يرجى المحاولة مرة أخرى.';
}
