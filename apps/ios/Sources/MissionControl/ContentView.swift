import SwiftUI

/// Sparse cockpit shell — mirrors web modules (ADR-0006 equal surfaces).
public struct ContentView: View {
  private let modules = [
    "Cockpit", "Clients", "CRM", "Tasks", "Audit",
    "Social", "Email", "Automations", "Portal",
  ]

  public init() {}

  public var body: some View {
    NavigationStack {
      List(modules, id: \.self) { name in
        NavigationLink(name) {
          Text("\(name) — wire Convex + Clerk")
            .foregroundStyle(.secondary)
            .padding()
        }
      }
      .navigationTitle("Mission Control")
      .toolbar {
        ToolbarItem(placement: .primaryAction) {
          // Clerk UserButton equivalent later
          Image(systemName: "person.crop.circle")
            .foregroundStyle(Color(red: 0.537, green: 0.863, blue: 0.922)) // Sky
        }
      }
    }
    // Mocha-ish background
    .preferredColorScheme(.dark)
  }
}

#Preview {
  ContentView()
}
