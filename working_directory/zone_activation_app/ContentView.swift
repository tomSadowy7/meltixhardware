import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            SprinklerControlView()
                .tabItem {
                    Label("Sprinklers", systemImage: "drop.fill")
                }
        }
    }
}
