package com.missioncontrol.app.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.missioncontrol.app.CockpitScreen
import com.missioncontrol.app.Module

private val MochaBase = Color(0xFF1E1E2E)
private val MochaText = Color(0xFFCDD6F4)
private val BrandSky = Color(0xFF89DCEB)
private val BrandFlamingo = Color(0xFFF2CDCD)
private val Surface = Color(0xFF313244)

/**
 * Auth gate: signed-out shell → Agency cockpit or Client portal (ADR-0015/0026).
 * Replace [SignInShell] body with Clerk Android AuthView when Gradle dep is added.
 */
@Composable
fun AuthGate(
  viewModel: AuthViewModel,
  modifier: Modifier = Modifier,
) {
  when (val state = viewModel.uiState) {
    AuthUiState.Loading -> {
      Column(
        modifier
          .fillMaxSize()
          .background(MochaBase)
          .padding(24.dp),
      ) {
        Text("Signing in…", color = BrandSky, style = MaterialTheme.typography.titleMedium)
      }
    }
    AuthUiState.SignedOut -> SignInShell(viewModel = viewModel, modifier = modifier)
    is AuthUiState.SignedIn -> when (state.user.surface) {
      AuthSurface.AgencyStaff -> CockpitScreen(
        user = state.user,
        onSignOut = { viewModel.signOut() },
        modifier = modifier,
      )
      AuthSurface.ClientPortal -> PortalScreen(
        user = state.user,
        onSignOut = { viewModel.signOut() },
        modifier = modifier,
      )
    }
  }
}

@Composable
fun SignInShell(
  viewModel: AuthViewModel,
  modifier: Modifier = Modifier,
) {
  Column(
    modifier
      .fillMaxSize()
      .background(MochaBase)
      .padding(24.dp),
    verticalArrangement = Arrangement.Center,
  ) {
    Text("Mission Control", color = BrandSky, style = MaterialTheme.typography.headlineMedium)
    Text("Agency ops · Client portal", color = MochaText.copy(alpha = 0.7f))
    Spacer(Modifier.height(24.dp))

    // Clerk AuthView slot
    Column(
      Modifier
        .fillMaxWidth()
        .background(Surface)
        .padding(16.dp),
    ) {
      Text("Clerk AuthView", color = BrandFlamingo, style = MaterialTheme.typography.labelLarge)
      Text(
        "Wire clerk-android AuthView / UserButton here. Set CLERK_PUBLISHABLE_KEY.",
        color = MochaText.copy(alpha = 0.65f),
        style = MaterialTheme.typography.bodySmall,
      )
    }

    Spacer(Modifier.height(16.dp))
    // Mock identity only in debug builds (PRE-GTM R44a)
    if (isDebugBuild()) {
      Button(
        onClick = { viewModel.mockSignIn(AuthSurface.AgencyStaff) },
        modifier = Modifier.fillMaxWidth(),
      ) {
        Text("Continue as Agency staff (mock)")
      }
      Spacer(Modifier.height(8.dp))
      OutlinedButton(
        onClick = { viewModel.mockSignIn(AuthSurface.ClientPortal) },
        modifier = Modifier.fillMaxWidth(),
      ) {
        Text("Continue as Client portal (mock)")
      }
    } else {
      Text(
        "Wire Clerk AuthView for production sign-in.",
        color = MochaText.copy(alpha = 0.65f),
        style = MaterialTheme.typography.bodySmall,
      )
    }
  }
}

/** True unless release minify / non-debug package. Scaffold without BuildConfig. */
private fun isDebugBuild(): Boolean =
  try {
    Class.forName("com.missioncontrol.app.BuildConfig")
      .getField("DEBUG")
      .getBoolean(null)
  } catch (_: Throwable) {
    // No BuildConfig in pure scaffold — treat as debug for local Compose previews only
    true
  }

@Composable
fun PortalScreen(
  user: McAuthUser,
  onSignOut: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val modules = listOf(
    "Shared findings",
    "Metrics graphs",
    "Client CRM",
    "Approval calendar",
  )
  Column(
    modifier
      .fillMaxSize()
      .background(MochaBase)
      .padding(16.dp),
  ) {
    Text("Client portal", color = BrandSky, style = MaterialTheme.typography.headlineSmall)
    Text(user.email ?: user.userId, color = MochaText)
    Text(
      "No Agency org membership — Convex ACL grants (ADR-0026)",
      color = MochaText.copy(alpha = 0.6f),
      style = MaterialTheme.typography.bodySmall,
    )
    Spacer(Modifier.height(12.dp))
    TextButton(onClick = onSignOut) { Text("Sign out", color = BrandFlamingo) }
    Spacer(Modifier.height(8.dp))
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      items(modules) { name ->
        Text(
          text = name,
          color = MochaText,
          modifier = Modifier
            .fillMaxWidth()
            .background(Surface)
            .padding(12.dp),
        )
      }
    }
  }
}
