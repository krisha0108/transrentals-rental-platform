# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# slf4j is an optional logging facade some dependencies reference reflectively
# at runtime (falling back gracefully if absent) — no concrete binding is on
# the classpath here, so R8 can't resolve it. Safe to silence.
-dontwarn org.slf4j.impl.StaticLoggerBinder
