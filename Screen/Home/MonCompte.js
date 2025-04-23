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
} from "react-native";
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
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Image
              source={require("../../assets/parametre_compte1.png")}
              style={styles.image}
            />
            <Text style={styles.title}>Paramètre compte</Text>
            <TextInput
              style={[styles.input, { textAlign: "center" }]}
              placeholder="ECRIRE VOTRE PSEUDO"
              placeholderTextColor="white"
              value={pseudo}
              onChangeText={setPseudo}
            />
            <TextInput
              style={[styles.input, { textAlign: "center" }]}
              placeholder="ECRIRE VOTRE NUMERO"
              placeholderTextColor="white"
              value={numero}
              onChangeText={setNumero}
              keyboardType="numeric"
            />
            {/* Bouton SAVE */}/
            <View style={styles.singleButtonContainer}>
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
            </View>
            {/* Bouton DÉCONNECT */}
            <View style={styles.singleButtonContainer}>
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
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scroll: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  image: {
    width: 220,
    height: 220,
    backgroundColor: "",
    borderRadius: 40,
    marginBottom: 50,
  },
  input: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    color: "#fff",
    marginBottom: 15,
    width: 300,
  },
  singleButtonContainer: {
    marginTop: 18,
    width: 180,
  },
  saveButton: {
    backgroundColor: "#5fb39d", // Bleu clair pour le bouton "Save"
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  deconnectButton: {
    backgroundColor: "#ff6f61", // Bleu clair pour le bouton "Déconnecter"
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff", // Texte blanc
    fontSize: 18,
    fontWeight: "bold",
  },
});
