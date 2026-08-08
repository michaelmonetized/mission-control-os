package com.missioncontrol.app.auth

/**
 * Auth surface for multi-tenant mobile (ADR-0015 Agency org vs ADR-0026 Client portal).
 */
enum class AuthSurface {
  AgencyStaff,
  ClientPortal,
}

data class McAuthUser(
  val userId: String,
  val email: String? = null,
  val displayName: String? = null,
  /** Clerk Organization id for Agency staff; null for Client Users. */
  val organizationId: String? = null,
  val organizationRole: String? = null,
  val surface: AuthSurface,
) {
  val isAgencyAdmin: Boolean
    get() = organizationRole == "org:admin" || organizationRole == "admin"
}

sealed class AuthUiState {
  data object Loading : AuthUiState()
  data object SignedOut : AuthUiState()
  data class SignedIn(val user: McAuthUser) : AuthUiState()
}

/**
 * Bridge interface for Clerk Android SDK.
 * Production: implement with `clerk-android` AuthView / session APIs.
 */
interface ClerkAuthBridge {
  fun configure(publishableKey: String)
  fun currentUser(): McAuthUser?
  suspend fun signOut()
  /** Dev path until Clerk SDK is on the classpath. */
  suspend fun mockSignIn(surface: AuthSurface)
}
