import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import GoogleMaps

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    
      FirebaseApp.configure()
      application.registerForRemoteNotifications()  // REQUIRED

      GMSServices.provideAPIKey("AIzaSyBdBvnankCo84RWZUzD-xegUJzi9Mwk9zQ")
      print("Google Maps SDK version: \(GMSServices.sdkVersion())")

      let delegate = ReactNativeDelegate()
      let factory = RCTReactNativeFactory(delegate: delegate)
      delegate.dependencyProvider = RCTAppDependencyProvider()

      reactNativeDelegate = delegate
      reactNativeFactory = factory

      window = UIWindow(frame: UIScreen.main.bounds)

      factory.startReactNative(
        withModuleName: "CoinBase",
        in: window,
        launchOptions: launchOptions
      )

      return true
  }

  // Handle URL schemes
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    print("🔗 iOS: Opening URL scheme: \(url.absoluteString)")
    return RCTLinkingManager.application(app, open: url, options: options)
  }
  
  // Handle Universal Links
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb {
      if let url = userActivity.webpageURL {
        print("🔗 iOS: Opening universal link: \(url.absoluteString)")
        return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
      }
    }
    return false
  }

  // MARK: - Push Notification Handlers

  func application(_ application: UIApplication,
                   didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      print("📲 APNS Token received: \(deviceToken)")
      Messaging.messaging().apnsToken = deviceToken
  }

  func application(_ application: UIApplication,
                   didFailToRegisterForRemoteNotificationsWithError error: Error) {
      print("❌ Failed to register for remote notifications: \(error)")
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
