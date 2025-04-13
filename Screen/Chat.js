import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useState } from "react";

export default function Chat(props) {
  const [message, setMessage] = useState("");

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.container}
    >
      {/* Overlay semi-transparent foncé */}
      <View style={styles.overlay} />

      {/* Bouton de retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => props.navigation.goBack()}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Chat</Text>

      <View style={styles.chatBox}>
        <Text style={styles.placeholderText}>
          📩 Interface de chat en cours de développement...
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Écris ton message ici..."
          placeholderTextColor="#ccc"
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            alert("Message envoyé : " + message);
            setMessage("");
          }}
        >
          <Text style={styles.buttonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)", 
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 10,
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  chatBox: {
    backgroundColor: "#ffffffcc",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  placeholderText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  sendButton: {
    backgroundColor: "#5fb39d",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
