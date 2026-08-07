import SwiftUI

/// Sparse cockpit shell — mirrors web modules (ADR-0006 equal surfaces).
/// Hosted behind AuthGateView after Agency staff sign-in (ADR-0015).
public struct ContentView: View {
  @ObservedObject var session: MCAuthSession

  private let modules: [(name: String, hint: String)] = [
    ("Cockpit", "Dashboard + activity"),
    ("Clients", "Hierarchy Agency→Site"),
    ("CRM", "Dual workspace conversations"),
    ("Pipeline", "Opportunity stages"),
    ("Tasks", "CRM nurture + delivery"),
    ("Audit", "Agent findings + metrics"),
    ("Social", "Default-approved calendar"),
    ("Email", "Resend ESP domains"),
    ("Automations", "Inline then Trigger"),
    ("Activity", "Agency event trail"),
    ("Billing", "Stripe subscription"),
    ("Portal", "Client graphs + grants"),
  ]

  public init(session: MCAuthSession = MCAuthSession()) {
    self.session = session
  }

  public var body: some View {
    NavigationStack {
      List {
        if let user = session.user {
          Section {
            VStack(alignment: .leading, spacing: 2) {
              Text(user.displayName ?? user.email ?? user.userId)
                .font(.headline)
              Text(user.organizationId.map { "Org \($0.prefix(12))…" } ?? "No org")
                .font(.caption.monospaced())
                .foregroundStyle(.secondary)
              if user.isAgencyAdmin {
                Text("Admin")
                  .font(.caption2)
                  .foregroundStyle(Color(red: 0.537, green: 0.863, blue: 0.922))
              }
            }
          }
        }
        Section("Modules") {
          ForEach(modules, id: \.name) { mod in
            NavigationLink {
              ModulePlaceholder(name: mod.name, hint: mod.hint)
            } label: {
              VStack(alignment: .leading, spacing: 2) {
                Text(mod.name)
                Text(mod.hint)
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
            }
          }
        }
      }
      .navigationTitle("Mission Control")
      .toolbar {
        ToolbarItem(placement: .primaryAction) {
          // ClerkKitUI UserButton when linked
          Menu {
            Button("Sign out", role: .destructive) {
              Task { await session.signOut() }
            }
          } label: {
            Image(systemName: "person.crop.circle")
              .foregroundStyle(Color(red: 0.537, green: 0.863, blue: 0.922))
              .accessibilityLabel("Account")
          }
        }
      }
    }
    .preferredColorScheme(.dark)
  }
}

private struct ModulePlaceholder: View {
  let name: String
  let hint: String

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text(name)
        .font(.title2.weight(.semibold))
      Text(hint)
        .foregroundStyle(.secondary)
      Text("Wire Convex query + Clerk org session for live data.")
        .font(.footnote)
        .foregroundStyle(.tertiary)
      Text("Parity modules match web cockpit (ADR-0005/0006). Billing + schedules next on Convex.")
        .font(.caption2)
        .foregroundStyle(.tertiary)
      Spacer()
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding()
  }
}

#Preview {
  AuthGateView(session: MCAuthSession())
}
