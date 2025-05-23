import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import React, { useState } from "react";
import firebase from "../Config";
import { Ionicons } from "@expo/vector-icons";

// Logo nouveau compte
import Logo from "../assets/nouveaucompte.png";

const auth = firebase.auth();
const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");

// Composant d'image de profil statique
function ProfileImage({ image }) {
  return (
    <View style={styles.imagePickerContainer}>
      <Image
        source={image}
        style={[styles.profileImage, { tintColor: 'white' }]}
      />
    </View>
  );
}

export default function NewCompte({ navigation }) {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmePassword, setConfirmePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCreate = async () => {
    if (Password === ConfirmePassword) {
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(Email, Password);
        const iduser = userCredential.user.uid;
        const ref_uncompte = ref_listcompte.child(iduser);

        // Préparer les données à enregistrer
        const userData = {
          id: iduser,
          connected: true,
          pseudo: "",
          numero: "",
          urlimage: null
        };

        await ref_uncompte.set(userData);

        // Déconnecter l'utilisateur après création du compte
        await auth.signOut();

        // Naviguer vers la page de connexion
        navigation.navigate("Authentification");
        Alert.alert("Succès", "Compte créé ! Veuillez vous connecter.");
      } catch (error) {
        Alert.alert("Erreur", error.message);
      }
    } else {
      Alert.alert("Erreur", "Mots de passe différents");
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
          <ProfileImage image={Logo} />
          <Text style={styles.welcome}>Créer un compte</Text>
          <Text style={styles.subtitle}>Vous pourrez ajouter une photo de profil plus tard</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Adresse Email"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={Email}
            textContentType="oneTimeCode"
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
            inputAccessoryViewID="no_suggestions"
            spellCheck={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Mot de passe"
              placeholderTextColor="#ccc"
              style={styles.passwordInput}
              value={Password}
              textContentType="oneTimeCode" // Utiliser oneTimeCode au lieu de none
              autoComplete="off" // Désactive l'autocomplétion
              autoCorrect={false}
              passwordRules="none" // Désactive les règles de mot de passe sur iOS
              importantForAutofill="no" // Indique que le champ ne doit pas être considéré pour l'autofill
              inputAccessoryViewID="no_suggestions" // Identifiant pour désactiver les suggestions
              spellCheck={false} // Désactive la vérification orthographique
              keyboardType="default" // Utiliser le clavier par défaut au lieu du clavier spécifique aux mots de passe
              returnKeyType="next" // Définir le bouton de retour comme "suivant"
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

          <View style={styles.passwordContainer}>
            <TextInput
              onChangeText={setConfirmePassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#ccc"
              style={styles.passwordInput}
              value={ConfirmePassword}
              textContentType="oneTimeCode" // Utiliser oneTimeCode au lieu de none
              autoComplete="off" // Désactive l'autocomplétion
              autoCorrect={false}
              passwordRules="none" // Désactive les règles de mot de passe sur iOS
              importantForAutofill="no" // Indique que le champ ne doit pas être considéré pour l'autofill
              inputAccessoryViewID="no_suggestions" // Identifiant pour désactiver les suggestions
              spellCheck={false} // Désactive la vérification orthographique
              keyboardType="default" // Utiliser le clavier par défaut au lieu du clavier spécifique aux mots de passe
              returnKeyType="done" // Définir le bouton de retour comme "terminé"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={18}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>

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
  imagePickerContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  welcome: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: "#fff",
    fontSize: 14,
    marginTop: 5,
    opacity: 0.8,
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
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  createButton: {
    backgroundColor: "rgb(88, 190, 85)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: "rgb(93, 99, 115)",
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
