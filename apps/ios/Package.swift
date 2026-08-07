// swift-tools-version: 5.9
import PackageDescription

// Auth shell uses MockClerkAuthBridge by default (ADR-0005).
// To link real Clerk: uncomment dependencies + target.deps and implement ClerkAuthBridge
// (see Sources/MissionControl/Auth/ClerkAuthBridge.md).
let package = Package(
  name: "MissionControl",
  platforms: [.iOS(.v17), .macOS(.v14)],
  products: [
    .library(name: "MissionControl", targets: ["MissionControl"]),
  ],
  // dependencies: [
  //   .package(url: "https://github.com/clerk/clerk-ios", from: "0.55.0"),
  // ],
  targets: [
    .target(
      name: "MissionControl",
      // dependencies: [
      //   .product(name: "ClerkKit", package: "clerk-ios"),
      //   .product(name: "ClerkKitUI", package: "clerk-ios"),
      // ],
      path: "Sources/MissionControl",
      exclude: ["Auth/ClerkAuthBridge.md"]
    ),
  ]
)
