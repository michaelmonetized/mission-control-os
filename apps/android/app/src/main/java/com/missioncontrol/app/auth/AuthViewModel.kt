package com.missioncontrol.app.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Auth state holder for Compose AuthGate (ADR-0005).
 * Lightweight (no AndroidX ViewModel) so scaffold builds before full Gradle wiring.
 */
class AuthViewModel(
  private val bridge: ClerkAuthBridge = MockClerkAuthBridge(),
  publishableKey: String = System.getenv("CLERK_PUBLISHABLE_KEY") ?: "",
  private val scope: CoroutineScope = CoroutineScope(Dispatchers.Main.immediate),
) {
  var uiState by mutableStateOf<AuthUiState>(AuthUiState.SignedOut)
    private set

  init {
    if (publishableKey.isNotBlank()) {
      bridge.configure(publishableKey)
    }
    bridge.currentUser()?.let { uiState = AuthUiState.SignedIn(it) }
  }

  fun mockSignIn(surface: AuthSurface) {
    scope.launch {
      uiState = AuthUiState.Loading
      bridge.mockSignIn(surface)
      uiState = bridge.currentUser()?.let { AuthUiState.SignedIn(it) } ?: AuthUiState.SignedOut
    }
  }

  fun signOut() {
    scope.launch {
      uiState = AuthUiState.Loading
      bridge.signOut()
      uiState = AuthUiState.SignedOut
    }
  }
}
