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
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import firebase from "../Config";
import { Ionicons } from "@expo/vector-icons";

const database = firebase.database();
const ref_database = database.ref();
const ref_liste_des_messages = ref_database.child("List_des_messages");

const emojis = ["❤️", "😂", "😮", "😢", "👍", "👎"];

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

  // Lire état second is typing
  useEffect(() => {
    ref_secondistyping.on("value", (snapshot) => {
      setistyping(snapshot.val());
    });
    return () => {
      ref_secondistyping.off();
    };
  }, []);

  // Récupérer liste des messages
  useEffect(() => {
    ref_messages.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((unmsg) => {
        d.push({ id: unmsg.key, ...unmsg.val() });
      });
      setmessages(d);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      ref_messages.off();
    };
  }, []);

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
    });
    setmsg("");
  };

  const addReaction = (messageId, emoji) => {
    const messageRef = ref_messages.child(messageId);
    messageRef.child("reactions").child(currentid).set(emoji);
    setShowEmojiPicker(false);
  };

  const renderReactions = (reactions, isCurrentUser) => {
    if (!reactions) return null;

    const reactionCounts = {};
    Object.values(reactions).forEach((emoji) => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });

    return (
      <View
        style={[
          styles.reactionsContainer,
          isCurrentUser
            ? styles.currentUserReactions
            : styles.otherUserReactions,
        ]}
      >
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <View key={emoji} style={styles.reactionBubble}>
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
          </View>
        ))}
      </View>
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

      {/* Nouvel en-tête unifié */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages 💬</Text>
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
              <View style={styles.messageWrapper}>
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
                    <Text style={styles.messageTime}>{item.time}</Text>
                  </View>
                </TouchableOpacity>
                {renderReactions(item.reactions, isCurrentUser)}
              </View>
            );
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Zone de saisie */}
        <View style={styles.inputContainer}>
          {istyping && <Text style={styles.typingIndicator}>Typing...</Text>}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Écrire un message..."
              placeholderTextColor="#999"
              value={msg}
              onChangeText={setmsg}
              onFocus={() => ref_currentistyping.set(true)}
              onBlur={() => ref_currentistyping.set(false)}
              multiline
              onSubmitEditing={handleSendMessage}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!msg}
            >
              <Ionicons
                name="send"
                size={24}
                color={msg ? "#5fb39d" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal pour sélectionner un emoji */}
      <Modal
        transparent={true}
        visible={showEmojiPicker}
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={styles.emojiModalBackground}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiPicker}>
            <Text style={styles.emojiPickerTitle}>Ajouter une réaction</Text>
            <View style={styles.emojiContainer}>
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
  // Styles de l'en-tête unifié
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 15,
    marginBottom: 8,
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
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 15,
  },
  currentUserBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#5fb39d",
    borderBottomRightRadius: 5,
  },
  otherUserBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: "white",
  },
  otherUserText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
    textAlign: "right",
  },
  inputContainer: {
    padding: 15,
    paddingTop: 5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  typingIndicator: {
    color: "#999",
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    fontSize: 16,
    color: "#333",
    textAlign: "left",
    paddingVertical: 0,
  },
  sendButton: {
    padding: 10,
  },
  emojiModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiPicker: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  emojiContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  emojiButton: {
    padding: 10,
  },
  emoji: {
    fontSize: 24,
  },
  reactionsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  currentUserReactions: {
    justifyContent: "flex-end",
    marginRight: 10,
  },
  otherUserReactions: {
    justifyContent: "flex-start",
    marginLeft: 10,
  },
  reactionBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: "#555",
  },
});

export default Chat;
