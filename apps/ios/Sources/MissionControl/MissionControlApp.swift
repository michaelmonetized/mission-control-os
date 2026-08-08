import SwiftUI

/// Mission Control iOS app entry shape (ADR-0005 multi-surface).
/// Host in an Xcode App target with `@main` — library target stays free of @main.
///
/// ```swift
/// @main
/// struct MissionControlApp: App {
///   @StateObject private var session = MCAuthSession(
///     publishableKey: Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as? String ?? ""
///   )
///   var body: some Scene {
///     WindowGroup { MissionControlRoot(session: session) }
///   }
/// }
/// ```
public struct MissionControlRoot: View {
  @ObservedObject var session: MCAuthSession

  /// Pass a session from the `@main` App (create it on the main actor).
  public init(session: MCAuthSession) {
    self.session = session
  }

  public var body: some View {
    AuthGateView(session: session)
  }
}
