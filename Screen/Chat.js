import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import firebase from "../Config";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const database = firebase.database();
const ref_database = database.ref();
const ref_liste_des_messages = ref_database.child("List_des_messages");

const emojis = ["❤️", "😂", "👍", "😮", "😢"];

const Chat = (props) => {
  const currentid = props.route.params.currentid;
  const secondid = props.route.params.secondid;
  const flatListRef = useRef(null);

  const iddesc =
    currentid > secondid ? currentid + secondid : secondid + currentid;
  const ref_une_discussion = ref_liste_des_messages.child(iddesc);
  const ref_messages = ref_une_discussion.child("les_messages");

  const ref_currentistyping = ref_une_discussion.child(currentid + "istyping");
  const ref_secondistyping = ref_une_discussion.child(secondid + "istyping");

  const [msg, setmsg] = useState("");
  const [messages, setmessages] = useState([]);
  const [istyping, setistyping] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [secondUserInfo, setSecondUserInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Lire état second is typing
  useEffect(() => {
    ref_secondistyping.on("value", (snapshot) => {
      setistyping(snapshot.val());
    });
    return () => {
      ref_secondistyping.off();
    };
  }, []);

  // Récupérer les informations des utilisateurs
  useEffect(() => {
    const ref_listcompte = ref_database.child("List_comptes");

    // Récupérer les infos de l'utilisateur courant
    ref_listcompte.child(currentid).once("value", (snapshot) => {
      setCurrentUserInfo(snapshot.val());
    });

    // Récupérer les infos du second utilisateur
    ref_listcompte.child(secondid).once("value", (snapshot) => {
      setSecondUserInfo(snapshot.val());
    });
  }, [currentid, secondid]);

  // Récupérer liste des messages et marquer comme vu
  useEffect(() => {
    ref_messages.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((unmsg) => {
        const messageData = unmsg.val();
        d.push({ id: unmsg.key, ...messageData });

        // Marquer les messages reçus comme vus
        if (messageData.receiver === currentid && messageData.sender === secondid && !messageData.seen) {
          ref_messages.child(unmsg.key).update({ seen: true });
        }

        // Afficher les informations sur les messages avec images
        if (messageData.imageUri) {
          console.log("Message avec image:", {
            id: unmsg.key,
            sender: messageData.sender,
            imageUri: messageData.imageUri,
            isMine: messageData.sender === currentid
          });
        }
      });
      setmessages(d);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      ref_messages.off();
    };
  }, [currentid, secondid]);

  const handleSendMessage = () => {
    if (msg.trim() === "") return;

    const key = ref_messages.push().key;
    const ref_unmsg = ref_messages.child(key);
    ref_unmsg.set({
      contenu: msg,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: currentid,
      receiver: secondid,
      reactions: {},
      seen: false,
    });
    setmsg("");

    // Désactiver l'indicateur de frappe après l'envoi du message
    ref_currentistyping.set(false);
  };

  const addReaction = (messageId, emoji) => {
    const messageRef = ref_messages.child(messageId);

    // Vérifier si l'utilisateur a déjà réagi avec cet emoji
    messageRef.child("reactions").child(currentid).once("value", (snapshot) => {
      const currentReaction = snapshot.val();

      if (currentReaction === emoji) {
        // Si l'utilisateur a déjà réagi avec cet emoji, supprimer la réaction
        messageRef.child("reactions").child(currentid).remove();
      } else {
        // Sinon, ajouter ou mettre à jour la réaction
        messageRef.child("reactions").child(currentid).set(emoji);
      }
    });

    setShowEmojiPicker(false);
  };

  // Fonction pour sélectionner une image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  // Fonction simplifiée pour envoyer un message avec image
  const sendImageMessage = async (uri) => {
    try {
      setIsUploading(true);
      const key = ref_messages.push().key;
      await ref_messages.child(key).set({
        contenu: "",
        imageUri: uri,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: currentid,
        receiver: secondid,
        reactions: {},
        seen: false
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer l'image");
    } finally {
      setIsUploading(false);
    }
  };



  const renderReactions = (reactions, isCurrentUser, messageId) => {
    if (!reactions) return null;

    // Regrouper les réactions par emoji
    const reactionsByEmoji = {};
    Object.entries(reactions).forEach(([userId, emoji]) => {
      if (!reactionsByEmoji[emoji]) {
        reactionsByEmoji[emoji] = [];
      }
      reactionsByEmoji[emoji].push(userId);
    });

    // Obtenir le nombre total de réactions
    const totalReactions = Object.values(reactions).length;

    return (
      <TouchableOpacity
        style={[
          styles.reactionsContainer,
          isCurrentUser
            ? styles.currentUserReactions
            : styles.otherUserReactions,
        ]}
        onPress={() => {
          // Afficher les détails des réactions (qui a réagi avec quoi)
          if (totalReactions > 0) {
            Alert.alert(
              "Réactions",
              Object.entries(reactionsByEmoji)
                .map(([emoji, userIds]) => {
                  const userCount = userIds.length;
                  return `${emoji} : ${userCount} ${userCount > 1 ? 'personnes' : 'personne'}`;
                })
                .join('\n'),
              [{ text: "OK" }]
            );
          }
        }}
      >
        {Object.entries(reactionsByEmoji).map(([emoji, userIds]) => (
          <View key={emoji} style={styles.reactionBubble}>
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {userIds.length > 1 && (
              <Text style={styles.reactionCount}>{userIds.length}</Text>
            )}
          </View>
        ))}

        {/* Bouton pour ajouter une réaction si l'utilisateur n'a pas encore réagi */}
        {!reactions[currentid] && (
          <TouchableOpacity
            style={styles.addReactionButton}
            onPress={() => {
              setSelectedMessageId(messageId);
              setShowEmojiPicker(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
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

      {/* En-tête avec profil */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {secondUserInfo && (
          <View style={styles.headerProfile}>
            <Image
              source={
                secondUserInfo.urlimage
                  ? { uri: secondUserInfo.urlimage }
                  : require("../assets/profile.png")
              }
              style={styles.headerAvatar}
            />
            <Text style={styles.headerTitle}>
              {secondUserInfo.pseudo || "Messages 💬"}
            </Text>
          </View>
        )}

        <View style={styles.headerSpacer} />
      </View>

      {/* Liste des messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
        keyboardVerticalOffset={90} // Ajusté pour la nouvelle hauteur d'en-tête
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          contentContainerStyle={styles.messagesContainer}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCurrentUser = item.sender === currentid;
            return (
              <View style={[
                styles.messageWrapper,
                isCurrentUser ? styles.currentUserWrapper : styles.otherUserWrapper
              ]}>
                {!isCurrentUser && secondUserInfo && (
                  <Image
                    source={
                      secondUserInfo.urlimage
                        ? { uri: secondUserInfo.urlimage }
                        : require("../assets/profile.png")
                    }
                    style={styles.messageAvatar}
                  />
                )}

                <View style={styles.messageContent}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onLongPress={() => {
                      setSelectedMessageId(item.id);
                      setShowEmojiPicker(true);
                    }}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isCurrentUser
                          ? styles.currentUserBubble
                          : styles.otherUserBubble,
                      ]}
                    >
                      <View>
                        {item.contenu ? (
                          <Text
                            style={[
                              styles.messageText,
                              isCurrentUser
                                ? styles.currentUserText
                                : styles.otherUserText,
                            ]}
                          >
                            {item.contenu}
                          </Text>
                        ) : null}

                        {item.imageUri && (
                          <View style={styles.imageContainer}>
                            <Image
                              source={{ uri: item.imageUri }}
                              style={styles.messageImage}
                              resizeMode="cover"
                              defaultSource={require("../assets/profile.png")}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.messageFooter}>
                        <Text style={styles.messageTime}>{item.time}</Text>
                        {isCurrentUser && (
                          <View style={styles.seenIndicatorContainer}>
                            {item.seen ? (
                              <Ionicons name="checkmark-done" size={16} color="#4FC3F7" />
                            ) : (
                              <Ionicons name="checkmark" size={16} color="#BBBBBB" />
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  {renderReactions(item.reactions, isCurrentUser, item.id)}
                </View>

                {isCurrentUser && currentUserInfo && (
                  <Image
                    source={
                      currentUserInfo.urlimage
                        ? { uri: currentUserInfo.urlimage }
                        : require("../assets/profile.png")
                    }
                    style={styles.messageAvatar}
                  />
                )}
              </View>
            );
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Nouvelle zone de saisie */}
        <View style={styles.inputContainer}>
          {istyping && <Text style={styles.typingIndicator}>Typing...</Text>}
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={pickImage}
              disabled={isUploading}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color="#4ca38d"
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#999"
              value={msg}
              onChangeText={(text) => {
                setmsg(text);
                // Mettre à jour l'état de frappe seulement si l'utilisateur est en train de taper
                if (text.length > 0) {
                  ref_currentistyping.set(true);
                } else {
                  ref_currentistyping.set(false);
                }
              }}
              onFocus={() => {
                if (msg.length > 0) {
                  ref_currentistyping.set(true);
                }
              }}
              onBlur={() => {
                ref_currentistyping.set(false);
              }}
              multiline
              onSubmitEditing={() => {
                handleSendMessage();
                ref_currentistyping.set(false);
              }}
              textAlignVertical="center"
              editable={!isUploading}
            />

            {isUploading ? (
              <ActivityIndicator size="small" color="#4ca38d" style={styles.sendButton} />
            ) : (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={!msg}
              >
                <Ionicons
                  name="send"
                  size={24}
                  color={msg ? "#4ca38d" : "#ddd"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal pour sélectionner un emoji */}
      <Modal
        transparent={true}
        visible={showEmojiPicker}
        onRequestClose={() => setShowEmojiPicker(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.emojiModalBackground}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiPicker}>
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>Réagir</Text>
              <TouchableOpacity
                onPress={() => setShowEmojiPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.emojiRow}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => addReaction(selectedMessageId, emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.emojiPickerFooter}>
              Appuyez une seconde fois pour supprimer la réaction
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Styles de l'en-tête avec profil
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 25,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "#2d5a4a",
    marginTop: StatusBar.currentHeight || 0,
    height: 90,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 5,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
    flex: 1,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 40,
  },
  // Styles existants
  flex1: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 5,
  },
  messageWrapper: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  currentUserWrapper: {
    justifyContent: "flex-end",
  },
  otherUserWrapper: {
    justifyContent: "flex-start",
  },
  messageContent: {
    maxWidth: "75%",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 15,
    borderRadius: 18,
    minWidth: 120, // Augmenter la largeur minimale
    marginVertical: 3, // Ajouter une marge verticale
  },

  currentUserBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#4ca38d", // Vert légèrement plus foncé pour un meilleur contraste
    borderBottomRightRadius: 5,
    paddingHorizontal: 18, // Augmenter le padding horizontal
  },
  otherUserBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 5,
    paddingHorizontal: 18, // Augmenter le padding horizontal
  },
  messageText: {
    fontSize: 17, // Augmenter légèrement la taille du texte
    lineHeight: 22, // Ajouter un espacement entre les lignes
  },
  currentUserText: {
    color: "white",
  },
  otherUserText: {
    color: "#333",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  seenIndicatorContainer: {
    marginLeft: 5,
  },
  imageContainer: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  inputContainer: {
    padding: 10,
    paddingTop: 5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderTopWidth: 1,
    borderTopColor: "#2d5a4a",
  },
  typingIndicator: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 3,
    marginLeft: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 25,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2d5a4a",
  },
  attachButton: {
    padding: 8,
    marginRight: 5,
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 90,
    fontSize: 16,
    color: "white",
    textAlign: "left",
    paddingVertical: 0,
  },
  sendButton: {
    padding: 8,
  },
  emojiModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiPicker: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emojiPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 15,
  },
  emojiButton: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: "#f8f8f8",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  emoji: {
    fontSize: 24,
  },
  emojiPickerFooter: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
    fontStyle: "italic",
  },
  reactionsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  currentUserReactions: {
    justifyContent: "flex-end",
  },
  otherUserReactions: {
    justifyContent: "flex-start",
  },
  reactionBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 3,
    color: "#555",
    fontWeight: "bold",
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
});

export default Chat;
