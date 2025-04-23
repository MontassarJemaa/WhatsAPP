import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import firebase from "../Config";

const auth = firebase.auth();
const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("123456");

  const handleLogin = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        const iduser = auth.currentUser.uid;
        const ref_uncompte = ref_listcompte.child(iduser);
        ref_uncompte.update({ id: iduser, connected: true });
        navigation.navigate("Home", { iduser });
      })
      .catch((error) => {
        alert(error.message);
      });
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
        <StatusBar barStyle="light-content" />
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo1.png")} style={styles.logo} />
          <Text style={styles.welcome}>Connexion</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Adresse Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("NewCompte")}>
            <Text style={styles.link}>
              Pas encore inscrit ? Créer un compte
            </Text>
          </TouchableOpacity>
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
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    color: "#fff",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#5fb39d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    color: "#eee",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
