import { StatusBar } from "expo-status-bar";
import {
  BackHandler,
  ImageBackground,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import firebase from "../Config";

const auth = firebase.auth();

export default function NewCompte({ navigation }) {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmePassword, setConfirmePassword] = useState("");

  const handleCreate = () => {
    if (Password === ConfirmePassword) {
      auth
        .createUserWithEmailAndPassword(Email, Password)
        .then(() => {
          const iduser = auth.currentUser.uid;
          navigation.replace("Home", { iduser });
        })
        .catch((err) => {
          alert(err.message);
        });
    } else {
      alert("Vérifiez les mots de passe");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <StatusBar style="light" />
        <View style={styles.container}>
          <Text style={styles.title}>Nouveau Compte</Text>

          <TextInput
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Adresse Email"
            placeholderTextColor="#ccc"
            style={styles.input}
          />

          <TextInput
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mot de passe"
            placeholderTextColor="#ccc"
            style={styles.input}
          />

          <TextInput
            onChangeText={setConfirmePassword}
            secureTextEntry
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#ccc"
            style={styles.input}
          />

          <View style={styles.buttons}>
            <Button title="Créer" onPress={handleCreate} color="#4e8cff" />
            <Button title="Annuler" onPress={() => navigation.goBack()} color="#888" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(34, 33, 33, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#000",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
