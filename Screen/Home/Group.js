import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import firebase from "../../Config";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Group({ route, navigation }) {
  const iduser = route?.params?.iduser || null;

  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const groupsRef = firebase.database().ref("groups");
  const contactsRef = firebase.database().ref("List_comptes");

  useEffect(() => {
    if (!iduser) {
      console.error("Erreur: iduser n'est pas défini dans route.params");
      Alert.alert(
        "Erreur de connexion",
        "Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      setLoading(false);
      return;
    }

    loadData();

    return () => {
      groupsRef.off();
      contactsRef.off();
    };
  }, [iduser, navigation]);

  // Fonction pour charger toutes les données
  const loadData = async () => {
    setLoading(true);

    try {
      const userRef = firebase.database().ref(`List_comptes/${iduser}`);
      const userSnapshot = await userRef.once("value");
      const userData = userSnapshot.val();

      if (userData) {
        setUserInfo(userData);
      } else {
        console.warn(`Aucune donnée utilisateur trouvée pour l'ID: ${iduser}`);
      }

      contactsRef.on("value", (snapshot) => {
        const contactsData = snapshot.val();
        if (contactsData) {
          const contactsList = Object.values(contactsData).filter(
            (contact) => contact.id !== iduser
          );
          setContacts(contactsList);
        } else {
          console.warn("Aucun contact trouvé dans la base de données");
          setContacts([]);
        }
      });

      groupsRef.on("value", (snapshot) => {
        const groupsData = snapshot.val();
        if (groupsData) {
          const userGroups = Object.values(groupsData).filter(group =>
            group.members && group.members[iduser]
          );

          userGroups.sort((a, b) => {
            const aLastMessage = a.lastMessage ? a.lastMessage.timestamp : 0;
            const bLastMessage = b.lastMessage ? b.lastMessage.timestamp : 0;
            return bLastMessage - aLastMessage;
          });

          setGroups(userGroups);
        } else {
          setGroups([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setLoading(false);
      Alert.alert(
        "Erreur",
        "Impossible de charger les données. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  };
  // Fonction pour créer un nouveau groupe
  const createNewGroup = () => {
    navigation.navigate("CreateGroup", { iduser });
  };
  const openGroup = (group) => {
    navigation.navigate("GroupChat", {
      iduser,
      groupId: group.id,
      groupName: group.name
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Groupes</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Chargement des groupes...</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={({ item }) => {
            const lastMessage = item.lastMessage || {};
            const lastMessageSender = lastMessage.senderId === iduser
              ? "Vous"
              : lastMessage.senderName || "Utilisateur";

            return (
              <TouchableOpacity
                style={styles.groupItem}
                onPress={() => openGroup(item)}
              >
                <View style={styles.groupImageContainer}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.groupImage}
                      defaultSource={require("../../assets/profile.png")}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/profile.png")}
                      style={styles.groupImage}
                    />
                  )}
                </View>

                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{item.name}</Text>

                  {lastMessage.text ? (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {lastMessageSender}: {lastMessage.text}
                    </Text>
                  ) : (
                    <Text style={styles.noMessages}>Aucun message</Text>
                  )}
                </View>

                {lastMessage.timestamp && (
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      {formatLastMessageTime(lastMessage.timestamp)}
                    </Text>

                    {item.unreadCount && item.unreadCount[iduser] > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {item.unreadCount[iduser]}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4CAF50"]}
              tintColor="#fff"
              title="Rafraîchissement..."
              titleColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyText}>Aucun groupe</Text>
              <Text style={styles.emptySubtext}>Créez un nouveau groupe pour commencer à discuter</Text>
              <TouchableOpacity
                style={styles.createGroupButton}
                onPress={() => navigation.navigate("CreateGroup", { iduser })}
              >
                <Text style={styles.createGroupButtonText}>Créer un groupe</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bouton flottant pour créer un groupe */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate("CreateGroup", { iduser })}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
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
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: -5,
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
  groupsContainer: {
    padding: 10,
    paddingBottom: 80, 
  },
  groupItem: {
    flexDirection: "row",
    backgroundColor: "rgba(40, 40, 40, 0.6)",
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    alignItems: "center",
  },
  groupImageContainer: {
    marginRight: 15,
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  noMessages: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
  },
  timeContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 10,
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: "rgb(88, 190, 85)",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 30,
  },
  createGroupButton: {
    backgroundColor: "rgb(88, 190, 85)",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createGroupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgb(88, 190, 85)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});