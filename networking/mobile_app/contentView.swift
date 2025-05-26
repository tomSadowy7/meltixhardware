import SwiftUI

extension UIApplication {
    func endEditing() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

struct ContentView: View {
    @StateObject private var bleManager = BleManager()
    @State private var ssid = ""
    @State private var password = ""

    var body: some View {
        ZStack {
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture {
                    UIApplication.shared.endEditing()
                }

            VStack(spacing: 20) {
                Text("Meltix Wi-Fi Provisioning")
                    .font(.title2)
                    .bold()

                Text("Status: \(bleManager.status)")
                    .foregroundColor(.blue)

                TextField("Wi-Fi SSID", text: $ssid)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)

                SecureField("Wi-Fi Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)

                Button(action: {
                    bleManager.sendWifiCredentials(ssid: ssid, password: password)
                }) {
                    Text("Send Credentials")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .disabled(ssid.isEmpty || password.isEmpty)
                .padding(.horizontal)

                Spacer()
            }
            .padding()
        }
    }
}
