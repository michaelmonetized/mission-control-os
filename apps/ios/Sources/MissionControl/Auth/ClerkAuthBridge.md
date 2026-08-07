# ClerkKit bridge (iOS)

When ready to link real Clerk:

1. In Xcode app target (or Package.swift):
   - `https://github.com/clerk/clerk-ios` → `ClerkKit`, `ClerkKitUI`
2. Implement `ClerkAuthBridge: MCAuthProviding`:

```swift
import ClerkKit
import ClerkKitUI

@MainActor
final class ClerkAuthBridge: MCAuthProviding {
  var user: MCAuthUser? { /* map Clerk.shared.user + org */ }
  var isLoading: Bool = false

  func configure(publishableKey: String) {
    Clerk.configure(publishableKey: publishableKey)
  }

  func signOut() async {
    try? await Clerk.shared.signOut()
  }

  func mockSignIn(as surface: MCAuthSurface) async {
    // unused when live AuthView drives session
  }
}
```

3. `AuthGateView` / `SignInShellView`: embed `AuthView()` from ClerkKitUI.
4. Agency: require active Organization; Client portal: **no** org membership.
5. Convex: JWT template `convex` same as web.
