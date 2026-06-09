# 🚀 بناء التطبيق الجديد — Build Instructions

## ⚠️ IMPORTANT
**التعديلات تحتاج APK جديد!** بدون rebuild، الـ code القديم سيستمر في التشغيل.

---

## 🛠️ الطريقة الأولى: Expo Go (الأسرع للاختبار)

استخدم هذه إذا كنت تبغي اختبار سريع:

### الخطوات:

```bash
# 1. Navigate to project
cd /Users/yazan/Documents/crm_iFluent/apps/frontend-student

# 2. Clear cache وstart
npx expo start --clear

# 3. في terminal ستظهر options:
# Press 'a' للـ Android Emulator
# أو 'i' للـ iOS Simulator
# أو scan QR code على الهاتف
```

### متطلبات:
- ✅ Expo Go app على الهاتف (download من App Store)
- ✅ Same WiFi network

### الفوائد:
- ⚡ سريع جداً (ثوانٍ)
- 📝 Hot reload (live updates)
- ❌ بدون push notifications (Reverb محدود)

---

## 🎁 الطريقة الثانية: EAS Build (موصى به)

بناء APK حقيقي عبر Expo servers:

### قبل ما تبدأ:
```bash
# 1. Login to Expo (if not already)
eas login
# (or npx eas login)

# 2. Verify you're logged in
eas whoami
```

### الخطوات:

```bash
# 1. Navigate
cd /Users/yazan/Documents/crm_iFluent/apps/frontend-student

# 2. Build APK
eas build --platform android --local

# أو (بدون local flag)
eas build --platform android
```

### What happens:
```
1. Uploads code to Expo servers
2. Builds APK on their machines
3. Takes 5-10 minutes
4. Downloads APK link
```

### بعد الـ Build:
```
✅ You get a download link
✅ Download APK
✅ Install on phone: adb install path/to/app.apk
✅ Open app
✅ Test
```

---

## 🏗️ الطريقة الثالثة: Local Build (Advanced)

بناء APK محلي على جهازك:

### متطلبات:
- ✅ Android SDK installed
- ✅ Android NDK installed
- ✅ Java 11+ installed

### الخطوات:

```bash
# 1. Navigate
cd /Users/yazan/Documents/crm_iFluent/apps/frontend-student

# 2. Create local build
eas build --platform android --local

# 3. سيسأل:
# "Do you have Android SDK installed?" → yes
# "Where is your Android SDK?" → (usually auto-detected)

# 4. Builds locally
# 5. APK appears in output folder
```

### الفوائد:
- ⚡ No server needed
- 🔐 Private (no upload)
- ⏱️ Takes 10-15 min

---

## 📱 بعد الـ Build (All Methods)

### خطوات التثبيت:

```bash
# 1. اطلع على APK file path (usually in a downloads folder)

# 2. Install على phone:
adb install -r /path/to/app.apk

# أو drag & drop على phone أحياناً

# 3. Open app on phone
# 4. Grant permissions when asked
# 5. Test!
```

### Permission issues?
```bash
# إذا قال "device offline" أو "permission denied"
adb devices  # Check connected devices
adb kill-server && adb start-server  # Restart ADB
adb install -r /path/to/app.apk  # Try again
```

---

## ✅ اختبر الـ Fix

بعد Install، اختبر:

### الخطوة 1: فتح التطبيق
```
✓ App opens without crash
✓ No error dialogs
```

### الخطوة 2: Navigate to Sessions
```
[SESSIONS-TAB] Sessions: X items  ✓
✓ Session list appears
```

### الخطوة 3: Tap a Session
```
[SESSION-PROFILE] Mounted: sessionId=123  ✓
[SESSION-PROFILE] ⏳ Reverb: waiting... (if still hydrating)
[SESSION-PROFILE] 🔌 Connecting to Reverb...  ✓
[ECHO] 🚀 Initializing Pusher...  ✓
[ECHO] ✅ Pusher initialized successfully  ✓
✓ No crash
✓ Screen loads normally
```

### الخطوة 4: Wait for Teacher
```
Teacher starts session
↓
[SESSION-PROFILE] 📨 Event: activated  ✓
[SESSION-PROFILE] ✓ Event matched
↓
Join button appears
✓ Real-time update works
```

---

## 🚨 Troubleshooting Build Issues

### Issue 1: "eas not found"
```bash
# Solution: Install globally
npm install -g eas-cli
eas login
eas build --platform android
```

### Issue 2: "Permission denied" on adb
```bash
# Solution: Restart ADB
adb kill-server
adb start-server
adb install -r app.apk
```

### Issue 3: "Device offline"
```bash
# Solution: Reconnect phone
adb devices
# Should show: List of attached devices
# If not, reconnect USB cable + enable USB Debug
```

### Issue 4: Build takes too long
```
Normal: 5-15 minutes
Too long: Check internet, try again
Failed: Check logs for errors
```

---

## 🔄 Build Comparison

| Aspect | Expo Go | EAS Build | Local Build |
|--------|---------|-----------|-------------|
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡ Medium | ⚡ Slow |
| **Real APK** | ❌ No | ✅ Yes | ✅ Yes |
| **Internet** | ✅ Needed | ✅ Needed | ❌ Not needed |
| **For Testing** | ✅ Best | ✅ Good | ❌ Slow |
| **For Release** | ❌ No | ✅ Best | ✅ Yes |
| **Offline** | ❌ No | ❌ No | ✅ Yes |

---

## 🎯 التوصية

### للاختبار السريع:
```bash
npx expo start --clear
# Scan QR on phone
```

### للـ APK النهائي:
```bash
eas build --platform android --local
# (or without --local if on Expo account)
```

### للـ Production:
```bash
eas build --platform android --local
# Test thoroughly
# Upload to Google Play
```

---

## 📋 Checklist قبل Build

- [ ] Code changes saved
- [ ] No uncommitted changes (git status clean)
- [ ] .env file configured correctly
- [ ] EXPO_PUBLIC_* variables set
- [ ] API_URL pointing to correct backend
- [ ] REVERB_HOST pointing to correct Reverb server

---

## 🔍 Verify Before Testing

```bash
# Check .env is correct
cat .env

# Expected:
EXPO_PUBLIC_API_URL=http://192.168.0.104:8000/api/v1
EXPO_PUBLIC_REVERB_HOST=192.168.0.106
EXPO_PUBLIC_REVERB_PORT=8080
```

---

## 🎬 Next Steps

1. **Choose build method** (recommend EAS or Expo Go)
2. **Run build command**
3. **Wait for completion**
4. **Install APK** (if EAS)
5. **Test thoroughly**
6. **Check console logs**
7. **Verify Reverb connects**

---

**Status:** ✅ Ready to Build

**Time Estimate:**
- Expo Go: 30 seconds
- EAS Build: 10 minutes
- Local Build: 15 minutes

**Try it now!** 🚀
