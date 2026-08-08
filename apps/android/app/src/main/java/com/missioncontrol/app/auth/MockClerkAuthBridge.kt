package com.missioncontrol.app.auth

/**
 * In-process mock Clerk bridge (ADR-0005) until clerk-android is linked in Gradle.
 */
class MockClerkAuthBridge : ClerkAuthBridge {
  private var user: McAuthUser? = null
  private var key: String = ""

  override fun configure(publishableKey: String) {
    key = publishableKey
    // Clerk.initialize(publishableKey) when SDK present
  }

  override fun currentUser(): McAuthUser? = user

  override suspend fun signOut() {
    user = null
  }

  override suspend fun mockSignIn(surface: AuthSurface) {
    user = when (surface) {
      AuthSurface.AgencyStaff -> McAuthUser(
        userId = "user_mock_agency",
        email = "admin@agency.example",
        displayName = "Agency Admin",
        organizationId = "org_mock_agency",
        organizationRole = "org:admin",
        surface = AuthSurface.AgencyStaff,
      )
      AuthSurface.ClientPortal -> McAuthUser(
        userId = "user_mock_client",
        email = "client@example.com",
        displayName = "Client User",
        organizationId = null,
        organizationRole = null,
        surface = AuthSurface.ClientPortal,
      )
    }
  }

  fun publishableKeyConfigured(): Boolean = key.isNotBlank()
}
