import SwiftUI

struct SprinklerControlView: View {
    private let baseURL = "http://192.168.68.60:80"
    private let authKey = "123456"
    @State private var sprinklerStates = Array(repeating: false, count: 4)

    var body: some View {
        VStack(spacing: 30) {
            Text("Sprinkler Controls")
                .font(.largeTitle)
                .bold()
                .padding(.top)

            ForEach(0..<4, id: \.self) { index in
                HStack {
                    VStack(alignment: .leading) {
                        Text("Zone \(index + 1)")
                            .font(.title3)
                            .bold()
                        Text(sprinklerStates[index] ? "Status: ON" : "Status: OFF")
                            .foregroundColor(sprinklerStates[index] ? .green : .red)
                            .font(.subheadline)
                    }

                    Spacer()

                    Toggle("", isOn: $sprinklerStates[index])
                        .labelsHidden()
                        .scaleEffect(1.5)
                        .onChange(of: sprinklerStates[index]) {
                            let isOn = sprinklerStates[index]
                            let endpoint = isOn ? "/turnOn" : "/turnOff"
                            sendCommand(endpoint: endpoint, number: index + 1)
                        }
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
                .shadow(color: .gray.opacity(0.3), radius: 5, x: 0, y: 2)
            }

            Spacer()
        }
        .padding()
    }

    private func sendCommand(endpoint: String, number: Int) {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = ["key": authKey, "number": number]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                print("❌ Error: \(error.localizedDescription)")
            } else {
                print("✅ Command sent to sprinkler \(number)")
            }
        }.resume()
    }
}
