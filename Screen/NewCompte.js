import { StatusBar } from "expo-status-bar";
import {
  Image,
  ImageBackground,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import firebase from "../Config";

// Logo nouveau compte
import Logo from "../assets/nouveaucompte.png";

const auth = firebase.auth();
const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");

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
          const ref_uncompte = ref_listcompte.child(iduser);
          ref_uncompte.set({ id: iduser, connected: true });
          navigation.replace("Home", { iduser });
          alert("Compte créé avec succès !");
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
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <StatusBar style="light" />

        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logo} />
          <Text style={styles.welcome}>Créer un compte</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Adresse Email"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={Email}
          />

          <TextInput
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mot de passe"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={Password}
          />

          <TextInput
            onChangeText={setConfirmePassword}
            secureTextEntry
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={ConfirmePassword}
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.cancelButton, { marginRight: 10 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
            >
              <Text style={styles.buttonText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  welcome: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: "rgb(234, 42, 42)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
