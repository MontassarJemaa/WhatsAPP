import React, { useEffect, useState } from "react";
import {
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
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../../Config";
import { supabase } from "../../Config";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const database = firebase.database();
const ref_database = database.ref();
const ref_listcompte = ref_database.child("List_comptes");


function ProfileImagePicker({ onImageSelected, defaultImage, userId }) {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission nécessaire",
        "Nous avons besoin de votre permission pour accéder à vos photos."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };



  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      console.log("Démarrage de l'upload de l'image...");

      // Utiliser directement l'URI de l'image sélectionnée
      console.log("Utilisation directe de l'image:", uri);

      // Créer un nom de fichier unique pour l'image locale
      const timestamp = Date.now();
      const localFileName = FileSystem.documentDirectory + `profile_${userId || 'user'}_${timestamp}.jpg`;

      // Copier l'image vers le stockage local
      try {
        await FileSystem.copyAsync({
          from: uri,
          to: localFileName
        });
        console.log("Image copiée localement:", localFileName);
      } catch (copyError) {
        console.error("Erreur lors de la copie locale de l'image:", copyError);
        // Continuer avec l'URI original si la copie échoue
      }

      // Utiliser directement le chemin local comme URL d'image
      const imageUrl = localFileName;
      console.log("URL d'image à utiliser:", imageUrl);

      // Notifier le composant parent avec l'URL de l'image locale
      onImageSelected && onImageSelected({
        url: imageUrl
      });

    } catch (error) {
      console.error("Erreur complète:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'uploader l'image: " + error.message,
        [
          {
            text: "Réessayer",
            onPress: () => uploadImage(uri)
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={pickImage} disabled={uploading}>
      <View style={styles.imagePickerContainer}>
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
        {/* Approche ultra-simplifiée pour l'affichage des images */}
        <View style={styles.profileImageContainer}>
          {/* Image de secours (couleur de fond) toujours affichée en arrière-plan */}
          <View style={[styles.profileImage, styles.fallbackImage]} />

          {/* Afficher l'image sélectionnée localement ou l'image par défaut */}
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : defaultImage && defaultImage.uri ? (
            <Image
              source={{ uri: defaultImage.uri }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : null}
        </View>
        {/* Afficher le texte uniquement s'il n'y a pas d'image */}
        {(!image && defaultImage === null) && (
          <View style={styles.uploadIconContainer}>
            <Image
              source={require("../../assets/upload.png")}
              style={{
                tintColor: 'white',
                width: 80,
                height: 80,
                resizeMode: 'contain',
                opacity: 0.85,
              }}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MonCompte(props) {
  const iduser = props.route.params.iduser;
  // Récupérer l'image de profil des paramètres (si elle existe)
  const profileImageFromParams = props.route.params.profileImage || null;
  const [pseudo, setPseudo] = useState("");
  const [numero, setNumero] = useState("");
  const [numeroError, setNumeroError] = useState("");
  const ref_uncompte = ref_listcompte.child(iduser);
  const [uriimage, seturiimage] = useState();
  const [isdefault, setisdefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fonction pour charger l'image depuis le cache local
    const loadImageFromCache = async () => {
      try {
        const cachedImageUrl = await AsyncStorage.getItem(`profile_image_${iduser}`);
        if (cachedImageUrl) {
          console.log("Image trouvée dans le cache local:", cachedImageUrl);
          seturiimage(cachedImageUrl);
          setisdefault(false);
          return true;
        }
      } catch (error) {
        console.warn("Erreur lors de la récupération du cache:", error);
      }
      return false;
    };

    // Fonction pour gérer les données du compte
    const handleAccountData = async (data) => {
      if (!data) return;

      console.log("Données du compte chargées:", data);

      // Définir le pseudo et le numéro
      setPseudo(data.pseudo || "");
      setNumero(data.numero || "");

      // Gérer l'image de profil
      const hasProfileImageFromParams = profileImageFromParams && profileImageFromParams.url;

      // Si nous avons une image de profil des paramètres, l'utiliser
      if (hasProfileImageFromParams) {
        console.log("Utilisation de l'image de profil des paramètres");
        if (profileImageFromParams.url) {
          const cleanUrl = profileImageFromParams.url.trim().replace(/ /g, '%20');

          // Essayer de charger l'image locale d'abord
          const localImagePath = await AsyncStorage.getItem(`local_profile_image_${iduser}`);
          if (localImagePath) {
            // Vérifier si le fichier existe
            const fileInfo = await FileSystem.getInfoAsync(localImagePath);
            if (fileInfo.exists) {
              console.log("Image locale trouvée pour les paramètres:", localImagePath);
              seturiimage(localImagePath);
              setisdefault(false);
            } else {
              // Si le fichier local n'existe pas, télécharger l'image
              console.log("Téléchargement de l'image des paramètres vers le stockage local");
              const localPath = await downloadImageToLocal(cleanUrl);
              if (localPath) {
                seturiimage(localPath);
              } else {
                seturiimage(cleanUrl);
              }
              setisdefault(false);
            }
          } else {
            // Si pas d'image locale, télécharger l'image
            console.log("Téléchargement de l'image des paramètres vers le stockage local");
            const localPath = await downloadImageToLocal(cleanUrl);
            if (localPath) {
              seturiimage(localPath);
            } else {
              seturiimage(cleanUrl);
            }
            setisdefault(false);
          }

          // Mettre en cache l'URL Supabase
          try {
            await AsyncStorage.setItem(`profile_image_${iduser}`, cleanUrl);
            console.log("URL d'image des paramètres mise en cache localement");
          } catch (cacheError) {
            console.warn("Erreur lors de la mise en cache de l'URL des paramètres:", cacheError);
          }
        }
      }
      // Sinon, utiliser l'image de la base de données si disponible
      else if (data.urlimage) {
        console.log("Image URL chargée depuis la base de données:", data.urlimage);
        const cleanUrl = data.urlimage.trim().replace(/ /g, '%20');

        // Essayer de charger l'image locale d'abord
        const localImagePath = await AsyncStorage.getItem(`local_profile_image_${iduser}`);
        if (localImagePath) {
          // Vérifier si le fichier existe
          const fileInfo = await FileSystem.getInfoAsync(localImagePath);
          if (fileInfo.exists) {
            console.log("Image locale trouvée pour la base de données:", localImagePath);
            seturiimage(localImagePath);
            setisdefault(false);
          } else {
            // Si le fichier local n'existe pas, télécharger l'image
            console.log("Téléchargement de l'image de la base de données vers le stockage local");
            const localPath = await downloadImageToLocal(cleanUrl);
            if (localPath) {
              seturiimage(localPath);
            } else {
              seturiimage(cleanUrl);
            }
            setisdefault(false);
          }
        } else {
          // Si pas d'image locale, télécharger l'image
          console.log("Téléchargement de l'image de la base de données vers le stockage local");
          const localPath = await downloadImageToLocal(cleanUrl);
          if (localPath) {
            seturiimage(localPath);
          } else {
            seturiimage(cleanUrl);
          }
          setisdefault(false);
        }

        // Mettre en cache l'URL Supabase
        try {
          await AsyncStorage.setItem(`profile_image_${iduser}`, cleanUrl);
          console.log("URL d'image de la base de données mise en cache localement");
        } catch (cacheError) {
          console.warn("Erreur lors de la mise en cache de l'URL de la base de données:", cacheError);
        }
      }
      // Si aucune image n'est disponible dans la base de données, essayer de charger depuis le cache
      else {
        const imageLoadedFromCache = await loadImageFromCache();
        if (!imageLoadedFromCache) {
          // Si aucune image n'est disponible dans le cache non plus, utiliser l'image par défaut
          setisdefault(true);
        }
      }
    };

    // Écouter les changements dans la base de données
    ref_uncompte.on("value", (snapshot) => {
      // Utiliser une fonction immédiatement invoquée pour pouvoir utiliser async/await
      (async () => {
        await handleAccountData(snapshot.val());
      })();
    });

    // Nettoyer l'écouteur lorsque le composant est démonté
    return () => {
      ref_uncompte.off();
    };
  }, [profileImageFromParams, iduser]);

  // Fonction pour télécharger une image depuis une URL et la sauvegarder localement
  const downloadImageToLocal = async (imageUrl) => {
    try {
      // Si l'URL est déjà un chemin local, la retourner directement
      if (imageUrl && imageUrl.startsWith('file://')) {
        console.log("L'URL est déjà un chemin local, pas besoin de télécharger:", imageUrl);

        // Vérifier si le fichier existe
        const fileInfo = await FileSystem.getInfoAsync(imageUrl);
        if (fileInfo.exists) {
          console.log("Le fichier local existe déjà:", imageUrl);

          // Mettre à jour le cache avec ce chemin
          await AsyncStorage.setItem(`local_profile_image_${iduser}`, imageUrl);

          return imageUrl;
        } else {
          console.warn("Le fichier local n'existe pas:", imageUrl);
        }
      }

      // Si l'URL est vide ou invalide, retourner null
      if (!imageUrl || !imageUrl.startsWith('http')) {
        console.warn("URL invalide pour le téléchargement:", imageUrl);
        return null;
      }

      console.log("Téléchargement de l'image vers le stockage local:", imageUrl);

      // Créer un nom de fichier unique
      const fileName = FileSystem.documentDirectory + `local_profile_${iduser}_${Date.now()}.png`;

      // Télécharger l'image avec plusieurs tentatives
      let downloadSuccess = false;
      let attempts = 0;
      let downloadError = null;
      let downloadResult = null;

      while (!downloadSuccess && attempts < 3) {
        attempts++;
        console.log(`Tentative de téléchargement ${attempts}/3...`);

        try {
          downloadResult = await FileSystem.downloadAsync(imageUrl, fileName);

          if (downloadResult.status === 200) {
            downloadSuccess = true;
            console.log("Image téléchargée avec succès à la tentative", attempts);
          } else {
            console.error(`Échec du téléchargement à la tentative ${attempts}:`, downloadResult);
            downloadError = new Error(`Status: ${downloadResult.status}`);
            // Attendre un peu avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (attemptError) {
          console.error(`Exception lors de la tentative ${attempts}:`, attemptError);
          downloadError = attemptError;
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (downloadSuccess) {
        console.log("Image téléchargée avec succès vers:", fileName);

        // Enregistrer le chemin local dans AsyncStorage
        await AsyncStorage.setItem(`local_profile_image_${iduser}`, fileName);

        return fileName;
      } else {
        console.error("Échec du téléchargement de l'image après plusieurs tentatives:", downloadError);
        return null;
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      return null;
    }
  };

  // Fonction simplifiée pour gérer la sélection d'image via ProfileImagePicker
  const handleImageSelected = async (imageData) => {
    if (imageData && imageData.url) {
      try {
        // Afficher un indicateur de chargement
        setIsSaving(true);

        // Nettoyer l'URL de l'image
        const imageUrl = imageData.url.trim().replace(/ /g, '%20');
        console.log("URL de l'image reçue:", imageUrl);

        // Vérifier si le fichier existe
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageUrl);
          if (!fileInfo.exists) {
            console.warn("Le fichier n'existe pas:", imageUrl);
            setisdefault(true);
            return;
          }
          console.log("Le fichier existe:", imageUrl);
        } catch (fileError) {
          console.warn("Erreur lors de la vérification du fichier:", fileError);
        }

        // Mettre à jour l'état local avec l'URL de l'image
        seturiimage(imageUrl);
        setisdefault(false);

        // Mettre à jour l'image dans la base de données
        try {
          // Utiliser directement l'URL de l'image locale
          console.log("Image à stocker dans la base de données:", imageUrl);

          // Mettre à jour l'URL dans la base de données
          const updateData = {
            urlimage: imageUrl,
            id: iduser
          };

          console.log("Mise à jour de la base de données avec l'image:", imageUrl);

          // Mettre à jour dans les deux bases de données
          const ref_listCompte = firebase.database().ref("List_comptes");

          // Mettre à jour ou créer le compte dans List_comptes
          const completeData = {
            ...updateData,
            pseudo: pseudo || "",
            numero: numero || ""
          };

          // Mettre à jour dans List_comptes
          await ref_listCompte.child(iduser).update(completeData);

          // Mettre à jour dans la référence principale
          await ref_uncompte.update(updateData);

          console.log("Base de données mise à jour avec succès");
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la base de données:", error);
          Alert.alert("Erreur", "Impossible de mettre à jour l'image dans la base de données");
        }
      } catch (error) {
        console.error("Erreur lors du traitement de l'image:", error);
        Alert.alert("Erreur", "Impossible de traiter l'image sélectionnée");
      } finally {
        setIsSaving(false);
      }
    }
  }

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
        <Text style={styles.headerTitle}>Mon Compte</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <ProfileImagePicker
              onImageSelected={handleImageSelected}
              defaultImage={
                isdefault
                  ? null // Utiliser null au lieu d'une image par défaut
                  : { uri: uriimage }
              }
              userId={iduser}
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
              placeholder="Ecrire votre numéro (8 chiffres)"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={numero}
              onChangeText={(text) => {
                // Vérifier que le texte ne contient que des chiffres
                if (text === '' || /^\d+$/.test(text)) {
                  // Limiter à 8 chiffres
                  if (text.length <= 8) {
                    setNumero(text);
                    // Réinitialiser l'erreur si le numéro est valide ou vide
                    if (text.length === 8 || text.length === 0) {
                      setNumeroError("");
                    } else {
                      setNumeroError("Le numéro doit contenir exactement 8 chiffres");
                    }
                  }
                }
              }}
              keyboardType="numeric"
              maxLength={8}
            />
            {numeroError ? (
              <Text style={styles.errorText}>{numeroError}</Text>
            ) : null}

            {/* Message d'information sur les champs requis */}
            <Text style={styles.infoText}>
              * Tous les champs sont obligatoires pour enregistrer votre compte
            </Text>

            {/* Bouton SAVE */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                // Griser le bouton si les conditions ne sont pas remplies
                (!uriimage || !pseudo || numero.length !== 8) ? styles.disabledButton : null
              ]}
              disabled={isSaving || !uriimage || !pseudo || numero.length !== 8}
              onPress={async () => {
                try {
                  // Vérifier que tous les champs requis sont remplis
                  if (!uriimage) {
                    alert("⚠️ Veuillez importer une image de profil");
                    return;
                  }

                  if (!pseudo) {
                    alert("⚠️ Veuillez entrer un pseudo");
                    return;
                  }

                  // Vérifier que le numéro est valide (8 chiffres)
                  if (numero.length !== 8) {
                    setNumeroError("Le numéro doit contenir exactement 8 chiffres");
                    alert("⚠️ Le numéro doit contenir exactement 8 chiffres");
                    return;
                  }

                  setIsSaving(true);
                  const snapshot = await ref_listcompte.get();
                  let exist = false;

                  snapshot.forEach((child) => {
                    const data = child.val();
                    if (data.pseudo === pseudo && data.numero === numero && data.id !== iduser) {
                      exist = true;
                    }
                  });

                  if (exist) {
                    alert("⚠️ Ce compte existe déjà !");
                  } else {
                    const ref_uncompte = ref_listcompte.child(iduser);

                    // Préparer les données à mettre à jour
                    const updateData = {
                      id: iduser,
                      pseudo,
                      numero,
                    };

                    // Ajouter l'URL de l'image seulement si elle est définie
                    if (uriimage) {
                      // Nettoyer l'URL de l'image
                      const cleanUrl = uriimage.trim().replace(/ /g, '%20');
                      updateData.urlimage = cleanUrl;

                      // Mettre à jour l'URL dans List_comptes également
                      const ref_listCompte = firebase.database().ref("List_comptes");

                      // Vérifier si le compte existe déjà dans List_comptes
                      const listCompteSnapshot = await ref_listCompte.child(iduser).once("value");
                      if (listCompteSnapshot.exists()) {
                        await ref_listCompte.child(iduser).update({
                          urlimage: cleanUrl,
                          id: iduser,
                          pseudo: pseudo,
                          numero: numero
                        });
                      } else {
                        // Créer un nouveau compte si nécessaire
                        await ref_listCompte.child(iduser).set({
                          urlimage: cleanUrl,
                          id: iduser,
                          pseudo: pseudo,
                          numero: numero
                        });
                      }

                      console.log("URL d'image enregistrée dans la base de données:", cleanUrl);
                    }
                    // Mettre à jour les données
                    console.log("Données à mettre à jour:", updateData);
                    await ref_uncompte.update(updateData);
                    alert("✅ Compte enregistré !");

                    // Naviguer vers ListComptes après sauvegarde
                    props.navigation.navigate("ListComptes");
                  }
                } catch (err) {
                  console.error(err);
                  alert("❌ Erreur lors de l'enregistrement.");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>SAVE</Text>
              )}
            </TouchableOpacity>

            {/* Bouton DÉCONNECT */}
            <TouchableOpacity
              style={styles.deconnectButton}
              disabled={isSaving}
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
  imagePickerContainer: {
    width: 220,
    height: 220,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  profileImageContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
    borderRadius: 110, // Moitié de la largeur du conteneur pour le rendre circulaire
  },
  fallbackImage: {
    backgroundColor: 'rgba(80, 80, 80, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 110, // Moitié de la largeur du conteneur pour le rendre circulaire
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  uploadIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 110, // Moitié de la largeur du conteneur pour le rendre circulaire
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
    backgroundColor: "rgb(88, 190, 85)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "80%",
  },
  disabledButton: {
    backgroundColor: "rgba(88, 190, 85, 0.5)",
    opacity: 0.7,
  },
    deconnectButton: {
    backgroundColor: "rgb(93, 99, 115)",
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
  errorText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
    width: "80%",
    textAlign: "left",
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 15,
    width: "80%",
    textAlign: "center",
  },
});