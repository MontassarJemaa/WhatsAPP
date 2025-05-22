import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import firebase from "../Config";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export default function GroupChat({ route, navigation }) {
  const { iduser, groupId, groupName } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const flatListRef = useRef(null);

  // Référence à la base de données Firebase
  const groupsRef = firebase.database().ref(`groups/${groupId}`);
  const messagesRef = firebase.database().ref(`group_messages/${groupId}`);
  const contactsRef = firebase.database().ref("List_comptes");

  useEffect(() => {
    // Charger les données
    loadData();

    // Nettoyer les écouteurs lors du démontage
    return () => {
      groupsRef.off();
      messagesRef.off();
      contactsRef.off();
    };
  }, []);

  // Fonction pour charger toutes les données
  const loadData = async () => {
    try {
      // Charger les informations du groupe
      groupsRef.on("value", (snapshot) => {
        const groupData = snapshot.val();
        if (groupData) {
          setGroupInfo(groupData);

          // Charger les membres du groupe
          if (groupData.members) {
            const memberIds = Object.keys(groupData.members).filter(id => groupData.members[id]);
            loadGroupMembers(memberIds);
          }
        } else {
          Alert.alert(
            "Erreur",
            "Ce groupe n'existe plus",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
      });

      // Charger les informations de l'utilisateur
      const userRef = firebase.database().ref(`List_comptes/${iduser}`);
      const userSnapshot = await userRef.once("value");
      const userData = userSnapshot.val();
      if (userData) {
        setUserInfo(userData);
      }

      // Charger les messages du groupe
      messagesRef.on("value", (snapshot) => {
        const messagesData = snapshot.val();
        if (messagesData) {
          const messagesList = Object.values(messagesData)
            .sort((a, b) => a.timestamp - b.timestamp);
          setMessages(messagesList);

          // Réinitialiser le compteur de messages non lus
          updateUnreadCount(0);

          // Faire défiler jusqu'au dernier message
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }, 300);
        } else {
          setMessages([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setLoading(false);
      Alert.alert(
        "Erreur",
        "Impossible de charger les données. Veuillez réessayer."
      );
    }
  };

  // Fonction pour charger les membres du groupe
  const loadGroupMembers = async (memberIds) => {
    try {
      contactsRef.on("value", (snapshot) => {
        const contactsData = snapshot.val();
        if (contactsData) {
          const membersList = memberIds.map(id => {
            return contactsData[id] || { id, pseudo: "Utilisateur inconnu" };
          });
          setMembers(membersList);
        }
      });
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    }
  };

  // Fonction pour mettre à jour le compteur de messages non lus
  const updateUnreadCount = async (count) => {
    try {
      const unreadCountRef = firebase.database().ref(`groups/${groupId}/unreadCount/${iduser}`);
      await unreadCountRef.set(count);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du compteur de messages non lus:", error);
    }
  };

  // Fonction pour envoyer un message
  const sendMessage = async () => {
    if (newMessage.trim() === "" || !userInfo) return;

    try {
      setSending(true);

      // Créer un nouvel ID de message
      const newMessageRef = messagesRef.push();
      const messageId = newMessageRef.key;

      // Créer le message
      const messageData = {
        id: messageId,
        text: newMessage.trim(),
        senderId: iduser,
        senderName: userInfo.pseudo || "Utilisateur",
        senderImage: userInfo.urlimage || null,
        timestamp: Date.now(),
        isImage: false
      };

      // Enregistrer le message dans la base de données
      await newMessageRef.set(messageData);

      // Mettre à jour le dernier message du groupe
      await groupsRef.update({
        lastMessage: {
          text: newMessage.trim(),
          senderId: iduser,
          senderName: userInfo.pseudo || "Utilisateur",
          timestamp: Date.now()
        }
      });

      // Incrémenter le compteur de messages non lus pour tous les membres sauf l'expéditeur
      if (groupInfo && groupInfo.members) {
        const memberIds = Object.keys(groupInfo.members).filter(id => groupInfo.members[id] && id !== iduser);
        memberIds.forEach(async (memberId) => {
          const unreadCountRef = firebase.database().ref(`groups/${groupId}/unreadCount/${memberId}`);
          const snapshot = await unreadCountRef.once("value");
          const currentCount = snapshot.val() || 0;
          await unreadCountRef.set(currentCount + 1);
        });
      }

      // Réinitialiser le champ de texte
      setNewMessage("");
      setSending(false);

      // Faire défiler jusqu'au dernier message
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setSending(false);
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer le message. Veuillez réessayer."
      );
    }
  };

  // Fonction pour sélectionner et envoyer une image
  const pickAndSendImage = async () => {
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    } finally {
      setShowImagePicker(false);
    }
  };

  // Fonction pour envoyer un message avec image
  const sendImageMessage = async (imageUri) => {
    if (!userInfo) return;

    try {
      setSending(true);

      // Télécharger l'image vers le stockage local
      const timestamp = Date.now();
      const fileName = FileSystem.documentDirectory + `chat_image_${groupId}_${timestamp}.jpg`;

      // Copier l'image vers le stockage local
      await FileSystem.copyAsync({
        from: imageUri,
        to: fileName
      });

      // Créer un nouvel ID de message
      const newMessageRef = messagesRef.push();
      const messageId = newMessageRef.key;

      // Créer le message
      const messageData = {
        id: messageId,
        text: "📷 Image",
        imageUrl: fileName,
        senderId: iduser,
        senderName: userInfo.pseudo || "Utilisateur",
        senderImage: userInfo.urlimage || null,
        timestamp: Date.now(),
        isImage: true
      };

      // Enregistrer le message dans la base de données
      await newMessageRef.set(messageData);

      // Mettre à jour le dernier message du groupe
      await groupsRef.update({
        lastMessage: {
          text: "📷 Image",
          senderId: iduser,
          senderName: userInfo.pseudo || "Utilisateur",
          timestamp: Date.now()
        }
      });

      // Incrémenter le compteur de messages non lus pour tous les membres sauf l'expéditeur
      if (groupInfo && groupInfo.members) {
        const memberIds = Object.keys(groupInfo.members).filter(id => groupInfo.members[id] && id !== iduser);
        memberIds.forEach(async (memberId) => {
          const unreadCountRef = firebase.database().ref(`groups/${groupId}/unreadCount/${memberId}`);
          const snapshot = await unreadCountRef.once("value");
          const currentCount = snapshot.val() || 0;
          await unreadCountRef.set(currentCount + 1);
        });
      }

      setSending(false);

      // Faire défiler jusqu'au dernier message
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'image:", error);
      setSending(false);
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer l'image. Veuillez réessayer."
      );
    }
  };

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Aujourd'hui: afficher l'heure
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Hier
      return `Hier ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      // Cette semaine
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return `${days[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Plus ancien
      return date.toLocaleDateString();
    }
  };

  // Rendu d'un message
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === iduser;
    const sender = members.find(member => member.id === item.senderId) || item;

    // Message système
    if (item.isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            {sender.urlimage ? (
              <Image
                source={{ uri: sender.urlimage }}
                style={styles.avatar}
                defaultSource={require("../assets/profile.png")}
              />
            ) : (
              <Image
                source={require("../assets/profile.png")}
                style={styles.avatar}
              />
            )}
          </View>
        )}

        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {!isCurrentUser && (
            <Text style={styles.senderName}>{sender.pseudo || "Utilisateur"}</Text>
          )}

          {item.isImage ? (
            <TouchableOpacity
              onPress={() => {
                // Afficher l'image en plein écran
                // (Fonctionnalité à implémenter)
              }}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text style={styles.messageText}>{item.text}</Text>
          )}

          <Text style={styles.messageTime}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  // Rendu de l'en-tête des participants
  const renderGroupInfo = () => {
    return (
      <View style={styles.groupInfoContainer}>
        <View style={styles.groupImageContainer}>
          {groupInfo && groupInfo.image ? (
            <Image
              source={{ uri: groupInfo.image }}
              style={styles.groupImage}
              defaultSource={require("../assets/profile.png")}
            />
          ) : (
            <Image
              source={require("../assets/profile.png")}
              style={styles.groupImage}
            />
          )}
        </View>

        <View style={styles.groupDetails}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.membersCount}>{members.length} participants</Text>
        </View>
      </View>
    );
  };

  // Rendu du modal d'informations du groupe
  const renderInfoModal = () => {
    return (
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Informations du groupe</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.groupInfoModal}>
              <View style={styles.groupImageContainerModal}>
                {groupInfo && groupInfo.image ? (
                  <Image
                    source={{ uri: groupInfo.image }}
                    style={styles.groupImageModal}
                    defaultSource={require("../assets/profile.png")}
                  />
                ) : (
                  <Image
                    source={require("../assets/profile.png")}
                    style={styles.groupImageModal}
                  />
                )}
              </View>

              <Text style={styles.groupNameModal}>{groupName}</Text>
              <Text style={styles.groupCreatedText}>
                Créé le {groupInfo ? formatDate(groupInfo.createdAt) : ""}
              </Text>
            </View>

            <Text style={styles.participantsTitle}>Participants ({members.length})</Text>

            <FlatList
              data={members}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <View style={styles.memberImageContainer}>
                    {item.urlimage ? (
                      <Image
                        source={{ uri: item.urlimage }}
                        style={styles.memberImage}
                        defaultSource={require("../assets/profile.png")}
                      />
                    ) : (
                      <Image
                        source={require("../assets/profile.png")}
                        style={styles.memberImage}
                      />
                    )}
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.pseudo || "Utilisateur"}</Text>
                    <Text style={styles.memberNumber}>{item.numero || ""}</Text>
                  </View>

                  {item.id === groupInfo?.createdBy && (
                    <Text style={styles.adminBadge}>Admin</Text>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
              style={styles.membersList}
            />

            <TouchableOpacity
              style={styles.leaveGroupButton}
              onPress={() => {
                Alert.alert(
                  "Quitter le groupe",
                  "Êtes-vous sûr de vouloir quitter ce groupe ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Quitter",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          // Supprimer l'utilisateur des membres du groupe
                          await firebase.database().ref(`groups/${groupId}/members/${iduser}`).set(false);
                          setInfoModalVisible(false);
                          navigation.goBack();
                        } catch (error) {
                          console.error("Erreur lors de la sortie du groupe:", error);
                          Alert.alert("Erreur", "Impossible de quitter le groupe. Veuillez réessayer.");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.leaveGroupButtonText}>Quitter le groupe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../assets/background.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar
          backgroundColor="rgba(0, 0, 0, 0.7)"
          barStyle="light-content"
        />

        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.groupInfoButton}
            onPress={() => setInfoModalVisible(true)}
          >
            {renderGroupInfo()}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setInfoModalVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Liste des messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Chargement des messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyText}>Aucun message dans ce groupe</Text>
              <Text style={styles.emptySubtext}>Soyez le premier à envoyer un message !</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => {
                if (flatListRef.current) {
                  flatListRef.current.scrollToEnd({ animated: false });
                }
              }}
              onLayout={() => {
                if (flatListRef.current) {
                  flatListRef.current.scrollToEnd({ animated: false });
                }
              }}
            />
          )}

          {/* Zone de saisie de message */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="image-outline" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Écrivez votre message..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (newMessage.trim() === "" || sending) ? styles.sendButtonDisabled : null
              ]}
              onPress={sendMessage}
              disabled={newMessage.trim() === "" || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Modal pour sélectionner une image */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowImagePicker(false)}>
            <View style={styles.imagePickerModalContainer}>
              <View style={styles.imagePickerContent}>
                <TouchableOpacity
                  style={styles.imagePickerOption}
                  onPress={pickAndSendImage}
                >
                  <Ionicons name="image-outline" size={30} color="white" />
                  <Text style={styles.imagePickerOptionText}>Choisir une image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imagePickerCancelButton}
                  onPress={() => setShowImagePicker(false)}
                >
                  <Text style={styles.imagePickerCancelText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Modal d'informations du groupe */}
        {renderInfoModal()}
      </ImageBackground>
    </TouchableWithoutFeedback>
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
  groupInfoButton: {
    flex: 1,
    marginHorizontal: 10,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: -5,
  },
  groupInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupImageContainer: {
    marginRight: 10,
  },
  groupImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  membersCount: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  keyboardAvoidingView: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 5,
    maxWidth: "80%",
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
    marginRight: "auto",
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  currentUserBubble: {
    backgroundColor: "rgb(88, 190, 85)", // Vert plus intense
    borderBottomRightRadius: 5,
  },
  otherUserBubble: {
    backgroundColor: "rgba(70, 70, 70, 0.8)",
    borderBottomLeftRadius: 5,
  },
  senderName: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
  },
  messageText: {
    color: "white",
    fontSize: 15,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 5,
  },
  messageTime: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  systemMessageContainer: {
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginVertical: 10,
  },
  systemMessageText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  attachButton: {
    padding: 8,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(60, 60, 60, 0.5)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "white",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "rgb(88, 190, 85)", // Vert plus intense
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(88, 190, 85, 0.5)", // Vert plus intense mais transparent
  },
  imagePickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imagePickerContent: {
    backgroundColor: "rgba(40, 40, 40, 0.9)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  imagePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  imagePickerOptionText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
  imagePickerCancelButton: {
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  imagePickerCancelText: {
    color: "rgb(88, 190, 85)",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  groupInfoModal: {
    alignItems: "center",
    marginBottom: 20,
  },
  groupImageContainerModal: {
    marginBottom: 10,
  },
  groupImageModal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  groupNameModal: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  groupCreatedText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  participantsTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  membersList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  memberImageContainer: {
    marginRight: 15,
  },
  memberImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  memberNumber: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  adminBadge: {
    color: "rgb(88, 190, 85)",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 10,
  },
  leaveGroupButton: {
    backgroundColor: "rgba(255, 50, 50, 0.8)",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 20,
  },
  leaveGroupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});