package com.missioncontrol.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Mission Control Android entry (ADR-0005 multi-surface).
 * Scaffold — wire Clerk + Convex next.
 */
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        CockpitScreen()
      }
    }
  }
}

private val MochaBase = Color(0xFF1E1E2E)
private val MochaText = Color(0xFFCDD6F4)
private val BrandSky = Color(0xFF89DCEB)

private data class Module(val name: String, val hint: String)

@Composable
fun CockpitScreen() {
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
    Module("Portal", "Client graphs + grants"),
  )
  Column(
    Modifier
      .fillMaxSize()
      .background(MochaBase)
      .padding(16.dp),
  ) {
    Text("Mission Control", color = BrandSky, style = MaterialTheme.typography.headlineMedium)
    Text(
      "Android surface scaffold · Clerk + Convex TBD · modules match web (ADR-0005/0006)",
      color = MochaText.copy(alpha = 0.7f),
    )
    Spacer(Modifier.height(16.dp))
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      items(modules) { mod ->
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF313244))
            .padding(12.dp),
        ) {
          Text(text = mod.name, color = MochaText)
          Text(text = mod.hint, color = MochaText.copy(alpha = 0.55f), style = MaterialTheme.typography.bodySmall)
        }
      }
    }
  }
}
