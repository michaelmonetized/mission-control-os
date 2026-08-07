import SwiftUI

/**
 Auth gate for Mission Control iOS (ADR-0005/0015/0026).

 - Signed out → SignInShellView (Clerk AuthView slot + mock)
 - Agency staff (org present) → ContentView cockpit
 - Client portal (no org) → PortalShellView
 */
public struct AuthGateView: View {
  @ObservedObject var session: MCAuthSession

  public init(session: MCAuthSession) {
    self.session = session
  }

  public var body: some View {
    Group {
      if session.isLoading {
        ProgressView("Signing in…")
          .tint(Color(red: 0.537, green: 0.863, blue: 0.922))
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(Color(red: 0.118, green: 0.118, blue: 0.180))
      } else if let user = session.user {
        switch user.surface {
        case .agencyStaff:
          ContentView(session: session)
        case .clientPortal:
          PortalShellView(session: session)
        }
      } else {
        SignInShellView(session: session)
      }
    }
    .preferredColorScheme(.dark)
  }
}

/// Sign-in shell — replace body with ClerkKitUI `AuthView` when SPM linked.
public struct SignInShellView: View {
  @ObservedObject var session: MCAuthSession

  public var body: some View {
    VStack(spacing: 24) {
      VStack(spacing: 8) {
        Text("Mission Control")
          .font(.largeTitle.weight(.bold))
          .foregroundStyle(Color(red: 0.537, green: 0.863, blue: 0.922))
        Text("Agency ops · Client portal")
          .font(.subheadline)
          .foregroundStyle(.secondary)
      }

      // MARK: ClerkKit slot
      // When Package.swift / Xcode app adds ClerkKit + ClerkKitUI:
      //   AuthView()
      //   OrganizationSwitcher() // Agency staff only
      VStack(alignment: .leading, spacing: 12) {
        Text("Clerk AuthView")
          .font(.caption.weight(.semibold))
          .foregroundStyle(Color(red: 0.949, green: 0.804, blue: 0.804))
        Text(
          "Wire ClerkKitUI.AuthView here. Publishable key from Info.plist / CLERK_PUBLISHABLE_KEY."
        )
        .font(.caption2)
        .foregroundStyle(.secondary)

        if session.publishableKey.isEmpty {
          Text("No CLERK_PUBLISHABLE_KEY — mock sign-in only")
            .font(.caption2)
            .foregroundStyle(.orange)
        } else {
          Text("Key configured · \(session.publishableKey.prefix(12))…")
            .font(.caption2.monospaced())
            .foregroundStyle(.secondary)
        }
      }
      .padding()
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(Color(red: 0.192, green: 0.196, blue: 0.267))
      .clipShape(RoundedRectangle(cornerRadius: 12))

      VStack(spacing: 10) {
        Button {
          Task { await session.mockSignIn(as: .agencyStaff) }
        } label: {
          Text("Continue as Agency staff (mock)")
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(Color(red: 0.537, green: 0.863, blue: 0.922))

        Button {
          Task { await session.mockSignIn(as: .clientPortal) }
        } label: {
          Text("Continue as Client portal (mock)")
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.bordered)
      }
    }
    .padding(24)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(red: 0.118, green: 0.118, blue: 0.180))
  }
}

/// Client portal shell without Agency org membership (ADR-0026).
public struct PortalShellView: View {
  @ObservedObject var session: MCAuthSession

  public var body: some View {
    NavigationStack {
      List {
        Section("Client portal") {
          Text(session.user?.email ?? "signed in")
          Text("No Clerk Organization — grants via Convex ACL")
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        Section("Modules") {
          Text("Shared findings")
          Text("Metrics graphs")
          Text("Client CRM")
          Text("Approval calendar")
        }
      }
      .navigationTitle("Portal")
      .toolbar {
        ToolbarItem(placement: .primaryAction) {
          Button("Sign out") {
            Task { await session.signOut() }
          }
        }
      }
    }
  }
}
