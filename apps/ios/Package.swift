// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "MissionControl",
  platforms: [.iOS(.v17), .macOS(.v14)],
  products: [
    .library(name: "MissionControl", targets: ["MissionControl"]),
  ],
  targets: [
    .target(
      name: "MissionControl",
      path: "Sources/MissionControl"
    ),
  ]
)
