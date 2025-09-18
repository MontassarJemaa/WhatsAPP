import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../../Config";
import { supabase } from "../../Config";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const database = firebase.database();
const ref_database = database.ref();
const ref_listCompte = ref_database.child("List_comptes");


const ProfileImage = ({ imageUrl, userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState(null);

  const cacheImage = async (uri, userId) => {
    try {
      const filename = FileSystem.documentDirectory + `profile_${userId}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(uri, filename);

      if (downloadResult.status === 200) {
        console.log(`Image mise en cache avec succès pour l'utilisateur ${userId}`);

        await AsyncStorage.setItem(`profile_image_${userId}`, filename);

        return filename;
      }
    } catch (error) {
      console.error("Erreur lors de la mise en cache de l'image:", error);
    }
    return null;
  };

  // Fonction pour charger l'image depuis le cache
  const loadImageFromCache = async (userId) => {
    try {
      const cachedUri = await AsyncStorage.getItem(`profile_image_${userId}`);
      if (cachedUri) {
        const fileInfo = await FileSystem.getInfoAsync(cachedUri);
        if (fileInfo.exists) {
          console.log(`Image chargée depuis le cache pour l'utilisateur ${userId}`);
          return cachedUri;
        }
      }
    } catch (error) {
      console.warn("Erreur lors du chargement de l'image depuis le cache:", error);
    }
    return null;
  };

  useEffect(() => {
    const loadImage = async () => {
      if (!imageUrl) return;

      setIsLoading(true);

      const cachedUri = await loadImageFromCache(userId);
      if (cachedUri) {
        setCachedImageUri(cachedUri);
        setIsLoading(false);
        return;
      }

      try {
        const newCachedUri = await cacheImage(imageUrl, userId);
        if (newCachedUri) {
          setCachedImageUri(newCachedUri);
        } else {
          setCachedImageUri(imageUrl);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'image:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [imageUrl, userId]);

  if (isLoading) {
    return (
      <View style={styles.avatarContainer}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (hasError || !imageUrl) {
    return (
      <View style={styles.avatarContainer}>
        <Image
          source={require("../../assets/profile.png")}
          style={styles.avatar}
        />
      </View>
    );
  }

  return (
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: cachedImageUri || imageUrl }}
        style={styles.avatar}
        defaultSource={require("../../assets/profile.png")}
        onError={() => {
          console.log("Erreur de chargement de l'image:", imageUrl);
          setHasError(true);
        }}
      />
    </View>
  );
};

export default function ListComptes(props) {
  const iduser = props.route.params.iduser;
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [imageCache, setImageCache] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});

  // Fonction pour précharger les images des contacts
  const preloadContactImages = async (contacts) => {
    console.log("Préchargement des images des contacts...");

    const newCache = {};

    // Pour chaque contact avec une image
    for (const contact of contacts) {
      if (contact.urlimage && contact.id) {
        try {
          const cachedUri = await AsyncStorage.getItem(`profile_image_${contact.id}`);
          if (cachedUri) {
            const fileInfo = await FileSystem.getInfoAsync(cachedUri);
            if (fileInfo.exists) {
              console.log(`Image déjà en cache pour l'utilisateur ${contact.id}`);
              newCache[contact.id] = cachedUri;
              continue;
            }
          }

          const filename = FileSystem.documentDirectory + `profile_${contact.id}.jpg`;
          const downloadResult = await FileSystem.downloadAsync(contact.urlimage, filename);
          if (downloadResult.status === 200) {
            console.log(`Image mise en cache avec succès pour l'utilisateur ${contact.id}`);
            await AsyncStorage.setItem(`profile_image_${contact.id}`, filename);
            newCache[contact.id] = filename;
          }
        } catch (error) {
          console.warn(`Erreur lors du préchargement de l'image pour l'utilisateur ${contact.id}:`, error);
        }
      }
    }
    setImageCache(newCache);
    console.log("Préchargement des images terminé");
  };

  // Fonction pour charger les données
  const loadData = () => {
    setRefreshing(true);

    const handleDataChange = async (snapshot) => {
      const d = [];

      snapshot.forEach((uncompte) => {
        const compteData = uncompte.val();
        if (compteData.id != iduser) {
          d.push(compteData);
        }
      });

      setData(d);
      setRefreshing(false);

      await preloadContactImages(d);
    };

    ref_listCompte.once("value", handleDataChange);
  };

  // Fonction pour rafraîchir les données
  const onRefresh = loadData;

  const checkUnreadMessages = async (contactId) => {
    try {
      const discussionId = iduser > contactId ? iduser + contactId : contactId + iduser;
      const discussionRef = ref_database.child("List_des_messages").child(discussionId).child("les_messages");
      const snapshot = await discussionRef.once("value");
      let unreadCount = 0;

      snapshot.forEach((message) => {
        const messageData = message.val();
        // Compter les messages non lus envoyés par le contact
        if (messageData.sender === contactId && messageData.receiver === iduser && !messageData.seen) {
          unreadCount++;
        }
      });

      return unreadCount;
    } catch (error) {
      console.error("Erreur lors de la vérification des messages non lus:", error);
      return 0;
    }
  };

  // Fonction pour vérifier les messages non lus pour tous les contacts
  const checkAllUnreadMessages = async (contacts) => {
    const unreadCounts = {};

    for (const contact of contacts) {
      unreadCounts[contact.id] = await checkUnreadMessages(contact.id);
    }

    setUnreadMessages(unreadCounts);
  };

  useEffect(() => {
    loadData();

    const handleDataChange = async (snapshot) => {
      const d = [];

      snapshot.forEach((uncompte) => {
        const compteData = uncompte.val();
        if (compteData.id != iduser) {
          d.push(compteData);
        }
      });

      setData(d);

      await preloadContactImages(d);

      await checkAllUnreadMessages(d);
    };

    ref_listCompte.on("value", handleDataChange);

    const messagesRef = ref_database.child("List_des_messages");
    messagesRef.on("child_changed", async () => {
      await checkAllUnreadMessages(data);
    });

    return () => {
      ref_listCompte.off("value", handleDataChange);
      messagesRef.off("child_changed");
    };
  }, [iduser, data.length]);

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

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Liste des Comptes</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadData}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          style={styles.flatList}
          contentContainerStyle={{ paddingTop: 10 }}
          data={data}
          keyExtractor={(_, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4CAF50"]}
              tintColor="#fff"
              title="Rafraîchissement..."
              titleColor="#fff"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={() => {
                  props.navigation.navigate("Details", {
                    contactId: item.id,
                    currentUserId: iduser,
                  });
                }}
              >
                <ProfileImage
                  imageUrl={item.urlimage}
                  userId={item.id}
                />
                <View
                  style={[
                    styles.connectionIndicator,
                    {
                      backgroundColor: item.connected ? "green" : "red",
                    }
                  ]}
                />
              </TouchableOpacity>

              <View style={styles.info}>
                <Text style={styles.text}>Numéro: {item.numero}</Text>
                <Text style={styles.text}>Pseudo: {item.pseudo}</Text>
                {unreadMessages[item.id] > 0 && (
                  <View style={styles.messageIndicatorContainer}>
                    <Text style={styles.messageIndicatorText}>
                      {unreadMessages[item.id]} nouveau{unreadMessages[item.id] > 1 ? 'x' : ''} message{unreadMessages[item.id] > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  props.navigation.navigate("Chat", {
                    currentid: iduser,
                    secondid: item.id,
                  });
                }}
              >
                <Image
                  source={require("../../assets/sendmsg.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const url =
                    Platform.OS === "android"
                      ? "tel:" + item.numero
                      : "telprompt:" + item.numero;
                  Linking.openURL(url);
                }}
              >
                <Image
                  source={require("../../assets/call.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
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
  headerSpacer: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: -5,
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

  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  flatList: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 33, 33, 0.6)",
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  connectionIndicator: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    bottom: 0,
    left: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  info: {
    flex: 1,
    marginLeft: 5,
  },
  text: {
    fontSize: 16,
    color: "#fff",
  },
  messageIndicatorContainer: {
    backgroundColor: 'rgba(88, 190, 85, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(88, 190, 85, 0.5)',
  },
  messageIndicatorText: {
    color: 'rgb(88, 190, 85)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  icon: {
    width: 28,
    height: 28,
    marginHorizontal: 5,
    tintColor: "rgba(255, 255, 255, 0.93)",
  },
});
