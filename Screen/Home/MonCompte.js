import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../../Config";

const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");

export default function MonCompte(props) {
  const iduser = props.route.params.iduser;
  const [pseudo, setPseudo] = useState("");
  const [numero, setNumero] = useState("");

  return (
    <ImageBackground
      source={require("../../assets/background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar
        backgroundColor="rgba(0, 0, 0, 0.7)"
        barStyle="light-content"
      />

      {/* En-tête personnalisé */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètre compte</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Image
              source={require("../../assets/parametre_compte1.png")}
              style={styles.image}
            />

            <TextInput
              style={[styles.input, { fontWeight: "bold" }]}
              placeholder="Ecrire votre pseudo"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={pseudo}
              onChangeText={setPseudo}
            />

            <TextInput
              style={[styles.input, { fontWeight: "bold" }]}
              placeholder="Ecrire votre numéro"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={numero}
              onChangeText={setNumero}
              keyboardType="numeric"
            />

            {/* Bouton SAVE */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                try {
                  const snapshot = await ref_listcompte.get();
                  let exist = false;

                  snapshot.forEach((child) => {
                    const data = child.val();
                    if (data.pseudo === pseudo && data.numero === numero) {
                      exist = true;
                    }
                  });

                  if (exist) {
                    alert("⚠️ Ce compte existe déjà !");
                  } else {
                    const ref_uncompte = ref_listcompte.child(iduser);
                    await ref_uncompte.set({ id: iduser, pseudo, numero });
                    alert("✅ Compte enregistré !");
                  }
                } catch (err) {
                  console.error(err);
                  alert("❌ Erreur lors de l'enregistrement.");
                }
              }}
            >
              <Text style={styles.buttonText}>SAVE</Text>
            </TouchableOpacity>

            {/* Bouton DÉCONNECT */}
            <TouchableOpacity
              style={styles.deconnectButton}
              onPress={() => {
                const ref_uncompte = ref_listcompte.child(iduser);
                ref_uncompte.update({ id: iduser, connected: false });
                props.navigation.replace("Authentification");
              }}
            >
              <Text style={styles.buttonText}>DÉCONNECT</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 25,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginTop: StatusBar.currentHeight || 0,
    height: 90,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: -5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
    width: "100%",
  },
  scroll: {
    alignItems: "center",
    paddingTop: 110,
    paddingBottom: 40,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 40,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    color: "#fff",
    marginBottom: 15,
    width: "80%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "80%",
  },
  deconnectButton: {
    backgroundColor: "rgb(234, 42, 42)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    width: "80%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
