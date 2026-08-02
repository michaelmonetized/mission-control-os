import SwiftUI

/// Mission Control iOS app entry shape (ADR-0005 multi-surface).
/// Host in an Xcode App target with `@main` — library target stays free of @main.
public struct MissionControlRoot: View {
  public init() {}
  public var body: some View {
    ContentView()
  }
}
