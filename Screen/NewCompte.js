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
          ref_uncompte.set({id:iduser,connected:true});
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
      style={styles.bg}
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
