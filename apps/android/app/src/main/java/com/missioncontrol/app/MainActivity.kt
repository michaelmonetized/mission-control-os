package com.missioncontrol.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.missioncontrol.app.auth.AuthGate
import com.missioncontrol.app.auth.AuthViewModel
import com.missioncontrol.app.auth.McAuthUser

/**
 * Mission Control Android entry (ADR-0005 multi-surface).
 * AuthGate → Agency cockpit or Client portal (Clerk mock / SDK slot).
 */
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        val vm = remember {
          AuthViewModel(
            publishableKey = BuildConfigKeys.clerkPublishableKey(),
          )
        }
        AuthGate(viewModel = vm)
      }
    }
  }
}

/** Avoid hard BuildConfig dependency in scaffold — override via env. */
object BuildConfigKeys {
  fun clerkPublishableKey(): String =
    System.getenv("CLERK_PUBLISHABLE_KEY")
      ?: System.getProperty("clerk.publishableKey")
      ?: ""
}

private val MochaBase = Color(0xFF1E1E2E)
private val MochaText = Color(0xFFCDD6F4)
private val BrandSky = Color(0xFF89DCEB)
private val BrandFlamingo = Color(0xFFF2CDCD)
private val Surface = Color(0xFF313244)

data class Module(val name: String, val hint: String)

@Composable
fun CockpitScreen(
  user: McAuthUser? = null,
  onSignOut: (() -> Unit)? = null,
  modifier: Modifier = Modifier,
) {
  val modules = listOf(
    Module("Cockpit", "Dashboard + activity"),
    Module("Clients", "Hierarchy Agency→Site"),
    Module("CRM", "Dual workspace conversations"),
    Module("Pipeline", "Opportunity stages"),
    Module("Tasks", "CRM nurture + delivery"),
    Module("Audit", "Agent findings + metrics"),
    Module("Social", "Default-approved calendar"),
    Module("Email", "Resend ESP domains"),
    Module("Automations", "Inline then Trigger"),
    Module("Activity", "Agency event trail"),
    Module("Billing", "Stripe subscription"),
    Module("Portal", "Client graphs + grants"),
  )
  Column(
    modifier
      .fillMaxSize()
      .background(MochaBase)
      .padding(16.dp),
  ) {
    Text("Mission Control", color = BrandSky, style = MaterialTheme.typography.headlineMedium)
    if (user != null) {
      Text(
        user.displayName ?: user.email ?: user.userId,
        color = MochaText,
      )
      Text(
        user.organizationId?.let { "Org ${it.take(12)}…" } ?: "Agency staff",
        color = MochaText.copy(alpha = 0.55f),
        style = MaterialTheme.typography.bodySmall,
      )
    } else {
      Text(
        "Android surface · Clerk + Convex TBD",
        color = MochaText.copy(alpha = 0.7f),
      )
    }
    if (onSignOut != null) {
      TextButton(onClick = onSignOut) {
        Text("Sign out", color = BrandFlamingo)
      }
    }
    Spacer(Modifier.height(16.dp))
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      items(modules) { mod ->
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .background(Surface)
            .padding(12.dp),
        ) {
          Text(text = mod.name, color = MochaText)
          Text(
            text = mod.hint,
            color = MochaText.copy(alpha = 0.55f),
            style = MaterialTheme.typography.bodySmall,
          )
        }
      }
    }
  }
}
