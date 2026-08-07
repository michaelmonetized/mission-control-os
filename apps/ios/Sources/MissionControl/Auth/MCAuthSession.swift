import Foundation
import Combine

/// Auth surface kind (ADR-0015 Agency org vs ADR-0026 Client portal).
public enum MCAuthSurface: String, Sendable {
  case agencyStaff
  case clientPortal
}

/// Snapshot of signed-in identity for cockpit / portal shells.
public struct MCAuthUser: Equatable, Sendable {
  public var userId: String
  public var email: String?
  public var displayName: String?
  /// Clerk Organization id when Agency staff (ADR-0015). Nil for Client Users (ADR-0026).
  public var organizationId: String?
  public var organizationRole: String?
  public var surface: MCAuthSurface

  public init(
    userId: String,
    email: String? = nil,
    displayName: String? = nil,
    organizationId: String? = nil,
    organizationRole: String? = nil,
    surface: MCAuthSurface
  ) {
    self.userId = userId
    self.email = email
    self.displayName = displayName
    self.organizationId = organizationId
    self.organizationRole = organizationRole
    self.surface = surface
  }

  public var isAgencyAdmin: Bool {
    organizationRole == "org:admin" || organizationRole == "admin"
  }
}

/// Protocol for ClerkKit (or mock) session bridge (ADR-0005/0010 mobile).
public protocol MCAuthProviding: AnyObject {
  var user: MCAuthUser? { get }
  var isLoading: Bool { get }
  func configure(publishableKey: String)
  func signOut() async
  /// Dev/mock sign-in until ClerkKit is linked.
  func mockSignIn(as surface: MCAuthSurface) async
}

/// Observable session store — inject real ClerkAuthBridge in app target.
/// Not class-isolated so SPM library inits work outside Xcode Previews.
public final class MCAuthSession: ObservableObject {
  @Published public private(set) var user: MCAuthUser?
  @Published public private(set) var isLoading: Bool = false
  @Published public var publishableKey: String

  private var provider: MCAuthProviding

  public init(
    publishableKey: String = ProcessInfo.processInfo.environment["CLERK_PUBLISHABLE_KEY"] ?? "",
    provider: MCAuthProviding? = nil
  ) {
    self.publishableKey = publishableKey
    self.provider = provider ?? MockClerkAuthBridge()
    if !publishableKey.isEmpty {
      self.provider.configure(publishableKey: publishableKey)
    }
  }

  public func setProvider(_ provider: MCAuthProviding) {
    self.provider = provider
    if !publishableKey.isEmpty {
      provider.configure(publishableKey: publishableKey)
    }
    syncFromProvider()
  }

  public func syncFromProvider() {
    user = provider.user
    isLoading = provider.isLoading
  }

  @MainActor
  public func mockSignIn(as surface: MCAuthSurface) async {
    isLoading = true
    await provider.mockSignIn(as: surface)
    syncFromProvider()
    isLoading = false
  }

  @MainActor
  public func signOut() async {
    isLoading = true
    await provider.signOut()
    syncFromProvider()
    isLoading = false
  }
}

/// In-process mock until ClerkKit SPM is linked in the Xcode app target.
public final class MockClerkAuthBridge: MCAuthProviding {
  public private(set) var user: MCAuthUser?
  public private(set) var isLoading: Bool = false

  public init() {}

  public func configure(publishableKey: String) {
    // Clerk.configure(publishableKey:) when ClerkKit is added
    _ = publishableKey
  }

  public func signOut() async {
    user = nil
  }

  public func mockSignIn(as surface: MCAuthSurface) async {
    switch surface {
    case .agencyStaff:
      user = MCAuthUser(
        userId: "user_mock_agency",
        email: "admin@agency.example",
        displayName: "Agency Admin",
        organizationId: "org_mock_agency",
        organizationRole: "org:admin",
        surface: .agencyStaff
      )
    case .clientPortal:
      user = MCAuthUser(
        userId: "user_mock_client",
        email: "client@example.com",
        displayName: "Client User",
        organizationId: nil,
        organizationRole: nil,
        surface: .clientPortal
      )
    }
  }
}
