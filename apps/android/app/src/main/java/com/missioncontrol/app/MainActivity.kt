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

@Composable
fun CockpitScreen() {
  val modules = listOf(
    "Cockpit", "Clients", "CRM", "Tasks", "Audit",
    "Social", "Email", "Automations", "Portal",
  )
  Column(
    Modifier
      .fillMaxSize()
      .background(MochaBase)
      .padding(16.dp),
  ) {
    Text("Mission Control", color = BrandSky, style = MaterialTheme.typography.headlineMedium)
    Text("Android surface scaffold · Clerk + Convex TBD", color = MochaText.copy(alpha = 0.7f))
    Spacer(Modifier.height(16.dp))
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      items(modules) { name ->
        Text(
          text = name,
          color = MochaText,
          modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF313244))
            .padding(12.dp),
        )
      }
    }
  }
}
