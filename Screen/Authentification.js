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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import firebase from "../Config";
import { Ionicons } from "@expo/vector-icons";

const auth = firebase.auth();
const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  // Fonction pour fermer le clavier lorsqu'on clique en dehors
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
        <StatusBar barStyle="light-content" />
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo1.png")} style={[styles.logo, { tintColor: 'white' }]} />
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
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              spellCheck={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>
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
      </TouchableWithoutFeedback>
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
    padding: 15,
    borderRadius: 10,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    color: "#fff",
    padding: 15,
  },
  eyeIcon: {
    padding: 10,
    marginRight: 5,
  },
  button: {
    backgroundColor: "rgb(88, 190, 85)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(201, 184, 195, 0.64)",
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
