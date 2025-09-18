import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../Config";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");

export default function Details(props) {
  const contactId = props.route.params.contactId;
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      const ref_contact = ref_listcompte.child(contactId);

      ref_contact.on("value", async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setContactData(data);

          if (data.urlimage) {
            await loadContactImage(data.urlimage);
          }
        }
        setLoading(false);
      });

      return () => {
        ref_contact.off();
      };
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setLoading(false);
    }
  };

  const loadContactImage = async (imageUrl) => {
    try {
      setImageLoading(true);

      // Vérifier si l'image est déjà en cache local
      const localImagePath = await AsyncStorage.getItem(`contact_image_${contactId}`);
      if (localImagePath) {
        const fileInfo = await FileSystem.getInfoAsync(localImagePath);
        if (fileInfo.exists) {
          setImageUri(localImagePath);
          setImageLoading(false);
          return;
        }
      }

      // Si l'URL est un chemin local, l'utiliser directement
      if (imageUrl.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(imageUrl);
        if (fileInfo.exists) {
          setImageUri(imageUrl);
          setImageLoading(false);
          return;
        }
      }

      // Sinon, utiliser l'URL directement
      setImageUri(imageUrl);
      setImageLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement de l'image:", error);
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("../assets/background.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5fb39d" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />


      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Contact</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.imageContainer}>
          {imageLoading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color="#5fb39d" />
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="person" size={60} color="rgba(255, 255, 255, 0.5)" />
            </View>
          )}
        </View>


        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#5fb39d" />
            <Text style={styles.infoLabel}>Pseudo :</Text>
            <Text style={styles.infoValue}>{contactData?.pseudo || "Non renseigné"}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#5fb39d" />
            <Text style={styles.infoLabel}>Numéro :</Text>
            <Text style={styles.infoValue}>{contactData?.numero || "Non renseigné"}</Text>
          </View>

          {(contactData?.nom || contactData?.prenom) && (
            <>
              {contactData?.nom && (
                <View style={styles.infoItem}>
                  <Ionicons name="person-circle-outline" size={20} color="#5fb39d" />
                  <Text style={styles.infoLabel}>Nom :</Text>
                  <Text style={styles.infoValue}>{contactData.nom}</Text>
                </View>
              )}

              {contactData?.prenom && (
                <View style={styles.infoItem}>
                  <Ionicons name="person-circle-outline" size={20} color="#5fb39d" />
                  <Text style={styles.infoLabel}>Prénom :</Text>
                  <Text style={styles.infoValue}>{contactData.prenom}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.infoItem}>
            <Ionicons
              name={contactData?.connected ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={contactData?.connected ? "green" : "red"}
            />
            <Text style={styles.infoLabel}>Statut :</Text>
            <Text style={[styles.infoValue, { color: contactData?.connected ? "green" : "red" }]}>
              {contactData?.connected ? "En ligne" : "Hors ligne"}
            </Text>
          </View>
        </View>


        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => {
            props.navigation.navigate("Chat", {
              currentid: props.route.params.currentUserId,
              secondid: contactId,
            });
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text style={styles.messageButtonText}>Envoyer un message</Text>
        </TouchableOpacity>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  content: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 30,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#5fb39d",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  infoLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginLeft: 10,
    minWidth: 80,
  },
  infoValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5fb39d",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  messageButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
