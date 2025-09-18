import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  // ScrollView n'est plus utilisé
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../Config";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export default function CreateGroup({ route, navigation }) {
  const { iduser } = route.params;

  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState({});
  const [selectedCount, setSelectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Référence à la base de données Firebase
  const groupsRef = firebase.database().ref("groups");
  const contactsRef = firebase.database().ref("List_comptes");

  useEffect(() => {
    loadContacts();

    return () => {
      contactsRef.off();
    };
  }, []);

  // Mettre à jour le compteur de contacts sélectionnés lorsque selectedContacts change
  useEffect(() => {
    const count = Object.values(selectedContacts).filter(Boolean).length;
    setSelectedCount(count);
  }, [selectedContacts]);

  // Fonction pour charger les contacts
  const loadContacts = async () => {
    try {
      contactsRef.on("value", (snapshot) => {
        const contactsData = snapshot.val();
        if (contactsData) {
          const contactsList = Object.values(contactsData).filter(
            (contact) => contact.id !== iduser
          );
          setContacts(contactsList);
        } else {
          setContacts([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Erreur lors du chargement des contacts:", error);
      setLoading(false);
      Alert.alert(
        "Erreur",
        "Impossible de charger les contacts. Veuillez réessayer."
      );
    }
  };

  const toggleContact = (contactId) => {
    setSelectedContacts(prev => {
      const newState = {
        ...prev,
        [contactId]: !prev[contactId]
      };

      const count = Object.values(newState).filter(Boolean).length;
      setSelectedCount(count);

      return newState;
    });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission nécessaire",
          "Nous avons besoin de votre permission pour accéder à vos photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setGroupImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  // Fonction pour télécharger l'image du groupe vers le stockage local
  const uploadGroupImage = async (uri) => {
    try {
      setUploading(true);

      const timestamp = Date.now();
      const fileName = FileSystem.documentDirectory + `group_${timestamp}.jpg`;

      await FileSystem.copyAsync({
        from: uri,
        to: fileName
      });

      console.log("Image copiée localement:", fileName);
      setUploading(false);
      return fileName;
    } catch (error) {
      console.error("Erreur lors de la copie locale de l'image:", error);
      setUploading(false);
      return null;
    }
  };

  // Fonction pour créer un nouveau groupe
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour le groupe");
      return;
    }

    // Vérifier qu'au moins 3 participants sont sélectionnés (2 contacts + l'utilisateur actuel)
    const selectedContactIds = Object.keys(selectedContacts).filter(id => selectedContacts[id]);
    if (selectedContactIds.length < 2) {
      Alert.alert("Erreur", "Veuillez sélectionner au moins 2 contacts (minimum 3 participants au total, incluant vous-même)");
      return;
    }

    setCreating(true);

    try {
      // Télécharger l'image du groupe si elle existe
      let groupImageUrl = null;
      if (groupImage) {
        groupImageUrl = await uploadGroupImage(groupImage);
      }

      // Créer un nouvel ID de groupe
      const newGroupRef = groupsRef.push();
      const groupId = newGroupRef.key;

      // Préparer les membres du groupe (inclure l'utilisateur actuel)
      const members = {
        [iduser]: true
      };

      selectedContactIds.forEach(contactId => {
        members[contactId] = true;
      });

      // Créer le groupe
      const groupData = {
        id: groupId,
        name: groupName.trim(),
        image: groupImageUrl,
        createdBy: iduser,
        createdAt: Date.now(),
        members: members
      };

      await newGroupRef.set(groupData);

      const messagesRef = firebase.database().ref(`group_messages/${groupId}`);

      const systemMessageRef = messagesRef.push();
      await systemMessageRef.set({
        id: systemMessageRef.key,
        text: `Groupe "${groupName.trim()}" créé`,
        isSystem: true,
        timestamp: Date.now()
      });

      setCreating(false);

      navigation.replace("GroupChat", {
        iduser,
        groupId,
        groupName: groupName.trim()
      });
    } catch (error) {
      console.error("Erreur lors de la création du groupe:", error);
      setCreating(false);
      Alert.alert(
        "Erreur",
        "Impossible de créer le groupe. Veuillez réessayer."
      );
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.container}
      resizeMode="cover"
    >
        <StatusBar
          backgroundColor="rgba(0, 0, 0, 0.7)"
          barStyle="light-content"
        />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Nouveau Groupe</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.groupImagePicker}
              onPress={pickImage}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : groupImage ? (
                <Image
                  source={{ uri: groupImage }}
                  style={styles.groupImage}
                />
              ) : (
                <View style={styles.groupImagePlaceholder}>
                  <Ionicons name="camera" size={40} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.groupImageText}>Ajouter une photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Nom du groupe"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={groupName}
              onChangeText={setGroupName}
            />

            <View style={styles.contactsTitleContainer}>
              <Text style={styles.contactsTitle}>Ajouter des participants</Text>
              <View style={[
                styles.selectedCountBadge,
                selectedCount >= 2 ? styles.selectedCountBadgeSuccess : styles.selectedCountBadgeWarning
              ]}>
                <Text style={styles.selectedCountText}>{selectedCount}/2</Text>
              </View>
            </View>
            <Text style={styles.contactsSubtitle}>Sélectionnez au moins 2 contacts (minimum 3 participants au total)</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" style={styles.loadingIndicator} />
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.noContactsText}>Aucun contact disponible</Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.contactItem,
                    selectedContacts[item.id] && styles.contactItemSelected
                  ]}
                  onPress={() => toggleContact(item.id)}
                >
                  <View style={styles.contactImageContainer}>
                    {item.urlimage ? (
                      <Image
                        source={{ uri: item.urlimage }}
                        style={styles.contactImage}
                        defaultSource={require("../assets/profile.png")}
                      />
                    ) : (
                      <Image
                        source={require("../assets/profile.png")}
                        style={styles.contactImage}
                      />
                    )}
                  </View>

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.pseudo || "Utilisateur"}</Text>
                    <Text style={styles.contactNumber}>{item.numero || ""}</Text>
                  </View>

                  {selectedContacts[item.id] && (
                    <Ionicons name="checkmark-circle" size={24} color="rgb(88, 190, 85)" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.contactsList}
              ListFooterComponent={
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (!groupName.trim() || Object.keys(selectedContacts).filter(id => selectedContacts[id]).length < 2) && styles.createButtonDisabled
                  ]}
                  onPress={createGroup}
                  disabled={!groupName.trim() || Object.keys(selectedContacts).filter(id => selectedContacts[id]).length < 2 || creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.createButtonText}>Créer le groupe</Text>
                  )}
                </TouchableOpacity>
              }
              ListHeaderComponentStyle={styles.listHeaderStyle}
            />
          )}
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: -5,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listHeaderStyle: {
    marginBottom: 10,
  },
  groupImagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(50, 50, 50, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  groupImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  groupImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  groupImageText: {
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 5,
    fontSize: 12,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    color: "white",
    marginBottom: 20,
    fontSize: 16,
  },
  contactsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  contactsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  contactsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 15,
    fontStyle: "italic",
  },
  selectedCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  selectedCountBadgeWarning: {
    backgroundColor: "rgba(255, 150, 0, 0.7)",
  },
  selectedCountBadgeSuccess: {
    backgroundColor: "rgba(88, 190, 85, 0.7)",
  },
  selectedCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginTop: 20,
  },
  noContactsText: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  contactsList: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 40, 40, 0.6)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  contactItemSelected: {
    backgroundColor: "rgba(88, 190, 85, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(88, 190, 85, 0.3)",
  },
  contactImageContainer: {
    marginRight: 15,
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  createButton: {
    backgroundColor: "rgb(88, 190, 85)",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  createButtonDisabled: {
    backgroundColor: "rgba(88, 190, 85, 0.5)",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
