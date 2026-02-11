# Java JDK Configuration Fix

## Issue
```
Invalid Gradle JDK configuration found
```

## ✅ Fix Applied

Updated `android/gradle.properties` with:
```properties
org.gradle.java.home=/opt/homebrew/Cellar/openjdk@17/17.0.12/libexec/openjdk.jdk/Contents/Home
```

## Environment Setup (Recommended)

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
# Java Home for Android development
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.12/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

## Verify Setup

```bash
# Check Java version
java -version
# Should show: openjdk version "17.0.12"

# Check JAVA_HOME
echo $JAVA_HOME
# Should show: /opt/homebrew/Cellar/openjdk@17/17.0.12/libexec/openjdk.jdk/Contents/Home
```

## Rebuild

After fixing JDK configuration:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Alternative: Use Android Studio Embedded JDK

If you prefer to use Android Studio's embedded JDK, change `gradle.properties` to:

```properties
org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home
```

## Troubleshooting

### Issue: JDK path not found
Check if the path exists:
```bash
ls -la /opt/homebrew/Cellar/openjdk@17/17.0.12/libexec/openjdk.jdk/Contents/Home
```

If not found, find the correct path:
```bash
/opt/homebrew/bin/java -version
which java
readlink -f $(which java)
```

### Issue: Still getting JDK errors
1. **Clean Gradle daemon:**
   ```bash
   cd android
   ./gradlew --stop
   ./gradlew clean
   cd ..
   ```

2. **Clean all caches:**
   ```bash
   cd android
   rm -rf .gradle build app/build
   cd ..
   rm -rf ~/.gradle/caches/
   ```

3. **Rebuild:**
   ```bash
   npx react-native run-android
   ```

## JDK Requirements

For React Native 0.80:
- ✅ **JDK 17** (Recommended)
- ⚠️ JDK 11 (Minimum)
- ❌ JDK 8 (Too old)
- ❌ JDK 21+ (Not yet supported)

Your current setup:
- ✅ OpenJDK 17.0.12 via Homebrew
- ✅ Compatible with React Native 0.80

## Status

- ✅ JDK 17 installed
- ✅ gradle.properties updated
- ✅ Ready to rebuild

---

*Last Updated: December 2, 2025*

