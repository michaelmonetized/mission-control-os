import SwiftUI

/// Sparse cockpit shell — mirrors web modules (ADR-0006 equal surfaces).
/// Next: ClerkKit AuthView + Convex client (see apps/ios/README.md).
public struct ContentView: View {
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
    ("Portal", "Client graphs + grants"),
  ]

  public init() {}

  public var body: some View {
    NavigationStack {
      List(modules, id: \.name) { mod in
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
      .navigationTitle("Mission Control")
      .toolbar {
        ToolbarItem(placement: .primaryAction) {
          // Clerk UserButton / AuthView — ClerkKit when wired
          Image(systemName: "person.crop.circle")
            .foregroundStyle(Color(red: 0.537, green: 0.863, blue: 0.922)) // Sky
            .accessibilityLabel("Account")
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
  ContentView()
}
