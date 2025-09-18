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
import { supabase } from "../Config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

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
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [secondUserInfo, setSecondUserInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState({});
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const recordingTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    ref_secondistyping.on("value", (snapshot) => {
      setistyping(snapshot.val());
    });
    return () => {
      ref_secondistyping.off();
    };
  }, []);

  useEffect(() => {
    const ref_listcompte = ref_database.child("List_comptes");

    ref_listcompte.child(currentid).once("value", (snapshot) => {
      setCurrentUserInfo(snapshot.val());
    });

    ref_listcompte.child(secondid).once("value", (snapshot) => {
      setSecondUserInfo(snapshot.val());
    });
  }, [currentid, secondid]);
  useEffect(() => {
    ref_messages.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((unmsg) => {
        const messageData = unmsg.val();
        d.push({ id: unmsg.key, ...messageData });


        if (messageData.receiver === currentid && messageData.sender === secondid && !messageData.seen) {
          ref_messages.child(unmsg.key).update({ seen: true });
        }


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

    const messageData = {
      contenu: msg,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: currentid,
      receiver: secondid,
      reactions: {},
      seen: false,
    };

    const key = ref_messages.push().key;
    const ref_unmsg = ref_messages.child(key);
    ref_unmsg.set(messageData);


    ref_une_discussion.child("lastmessage").set({
      ...messageData,
      id: key,
      timestamp: Date.now()
    });

    setmsg("");


    ref_currentistyping.set(false);
  };

  const addReaction = (messageId, emoji) => {
    const messageRef = ref_messages.child(messageId);


    messageRef.child("reactions").child(currentid).once("value", (snapshot) => {
      const currentReaction = snapshot.val();

      if (currentReaction === emoji) {

        messageRef.child("reactions").child(currentid).remove();
      } else {

        messageRef.child("reactions").child(currentid).set(emoji);
      }
    });

    setShowEmojiPicker(false);
  };


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
    } finally {
      setShowImagePicker(false);
    }
  };


  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la caméra pour prendre des photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la prise de photo:", error);
      Alert.alert("Erreur", "Impossible de prendre une photo: " + error.message);
    } finally {
      setShowImagePicker(false);
    }
  };


  const sendImageMessage = async (uri) => {
    try {
      setIsUploading(true);
      const messageData = {
        contenu: "",
        imageUri: uri,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: currentid,
        receiver: secondid,
        reactions: {},
        seen: false
      };

      const key = ref_messages.push().key;
      await ref_messages.child(key).set(messageData);


      ref_une_discussion.child("lastmessage").set({
        ...messageData,
        id: key,
        timestamp: Date.now()
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer l'image");
    } finally {
      setIsUploading(false);
    }
  };


  const uploadImageToSupabaseAndSendLink = async (uri) => {
    try {
      setIsUploading(true);


      const fileName = `chat_images/${currentid}_${secondid}_${Date.now()}.jpg`;


      const response = await fetch(uri);
      const blob = await response.blob();


      const { data: uploadData, error } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error("Erreur upload Supabase:", error);
        throw error;
      }

      if (!uploadData) {
        throw new Error("Échec de l'upload - aucune donnée retournée");
      }

      console.log("Upload réussi:", uploadData);


      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicURL;

      if (!publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique de l'image");
      }

      console.log("URL publique Supabase:", publicUrl);


      const messageData = {
        contenu: `📷 Image: ${publicUrl}`,
        imageLink: publicUrl,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: currentid,
        receiver: secondid,
        reactions: {},
        seen: false,
        messageType: "imageLink"
      };

      const key = ref_messages.push().key;
      await ref_messages.child(key).set(messageData);


      ref_une_discussion.child("lastmessage").set({
        ...messageData,
        id: key,
        timestamp: Date.now()
      });

      Alert.alert("Succès", "Image uploadée et lien envoyé !");

    } catch (error) {
      console.error("Erreur upload Supabase:", error);
      console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
      Alert.alert("Erreur", "Impossible d'uploader l'image vers Supabase: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };


  const pickImageAsSupabaseLink = async () => {
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
        await uploadImageToSupabaseAndSendLink(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  // Fonction pour démarrer l'enregistrement audio
  const startRecording = async () => {
    try {
      console.log("Démarrage de l'enregistrement...");

      // Demander les permissions
      console.log("Demande des permissions...");
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès au microphone pour enregistrer des messages vocaux.");
        return;
      }
      console.log("Permissions accordées");

      // Configurer l'audio pour l'enregistrement
      console.log("Configuration de l'audio...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Utiliser des valeurs numériques directes au lieu des constantes
        interruptionModeIOS: 1, // 1 = DO_NOT_MIX
        interruptionModeAndroid: 1, // 1 = DO_NOT_MIX
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log("Audio configuré");

      // Créer un nouvel enregistrement avec des options simplifiées
      console.log("Création de l'enregistrement...");

      // Utiliser les options prédéfinies de haute qualité
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      console.log("Enregistrement créé");

      setRecording(recording);
      setIsRecording(true);

      // Démarrer le timer pour la durée d'enregistrement
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Arrêter automatiquement l'enregistrement après 30 secondes
          if (newDuration >= 30) {
            stopRecording();
            return 30;
          }
          return newDuration;
        });
      }, 1000);
      console.log("Enregistrement démarré avec succès");

    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement: " + error.message);
    }
  };

  // Fonction pour arrêter l'enregistrement et envoyer le message vocal
  const stopRecording = async () => {
    try {
      console.log("Arrêt de l'enregistrement...");
      if (!recording) {
        console.log("Aucun enregistrement en cours");
        return;
      }

      // Arrêter le timer
      if (recordingTimerRef.current) {
        console.log("Arrêt du timer");
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Arrêter l'enregistrement
      console.log("Arrêt de l'enregistrement audio");
      await recording.stopAndUnloadAsync();
      setIsRecording(false);

      // Récupérer l'URI de l'enregistrement
      console.log("Récupération de l'URI de l'enregistrement");
      const uri = recording.getURI();
      console.log("URI de l'enregistrement:", uri);
      setRecording(null);

      // Si l'enregistrement est trop court (moins de 1 seconde), ne pas l'envoyer
      if (recordingDuration < 1) {
        console.log("Enregistrement trop court");
        Alert.alert("Enregistrement trop court", "L'enregistrement doit durer au moins 1 seconde.");
        return;
      }

      // Envoyer le message vocal
      console.log("Envoi du message vocal");
      await sendVoiceMessage(uri, recordingDuration);
      console.log("Message vocal envoyé avec succès");

      // Réinitialiser la durée d'enregistrement
      setRecordingDuration(0);

    } catch (error) {
      console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
      Alert.alert("Erreur", "Impossible d'arrêter l'enregistrement: " + error.message);
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
    }
  };

  // Fonction pour envoyer un message vocal
  const sendVoiceMessage = async (uri, duration) => {
    try {
      console.log("Début de l'envoi du message vocal");
      setIsUploading(true);

      // Vérifier que l'URI est valide
      if (!uri) {
        throw new Error("URI de l'enregistrement invalide");
      }

      const messageData = {
        contenu: "",
        audioUri: uri,
        audioDuration: duration,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: currentid,
        receiver: secondid,
        reactions: {},
        seen: false,
        messageType: "audio" // Ajouter un type pour faciliter l'identification
      };

      console.log("Création d'une nouvelle entrée dans la base de données");
      const key = ref_messages.push().key;

      // Enregistrer le message dans Firebase
      console.log("Enregistrement du message vocal dans Firebase");
      await ref_messages.child(key).set(messageData);

      // Sauvegarder le dernier message
      ref_une_discussion.child("lastmessage").set({
        ...messageData,
        id: key,
        timestamp: Date.now()
      });

      console.log("Message vocal enregistré avec succès dans Firebase");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message vocal:", error);
      Alert.alert("Erreur", "Impossible d'envoyer le message vocal: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour lire un message vocal
  const playVoiceMessage = async (audioUri, messageId) => {
    try {
      console.log("Tentative de lecture du message vocal:", audioUri);

      // Configurer l'audio pour la lecture
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Utiliser des valeurs numériques directes au lieu des constantes
        interruptionModeIOS: 1, // 1 = DO_NOT_MIX
        interruptionModeAndroid: 1, // 1 = DO_NOT_MIX
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Si un son est déjà en cours de lecture, l'arrêter
      if (sound) {
        console.log("Arrêt du son précédent");
        await sound.unloadAsync();
        setSound(null);
      }

      // Si le message est déjà en cours de lecture, l'arrêter
      if (isPlaying[messageId]) {
        console.log("Le message est déjà en cours de lecture, on l'arrête");
        setIsPlaying(prev => ({ ...prev, [messageId]: false }));
        setCurrentlyPlayingId(null);
        return;
      }

      console.log("Chargement du son:", audioUri);

      // Charger le son
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );

      console.log("Son chargé avec succès");

      setSound(newSound);
      setIsPlaying(prev => ({ ...prev, [messageId]: true }));
      setCurrentlyPlayingId(messageId);

      // Quand le son est terminé
      newSound.setOnPlaybackStatusUpdate(status => {
        console.log("Statut de lecture:", status);
        if (status.didJustFinish) {
          console.log("Lecture terminée");
          setIsPlaying(prev => ({ ...prev, [messageId]: false }));
          setCurrentlyPlayingId(null);
          newSound.unloadAsync();
          setSound(null);
        }
      });

    } catch (error) {
      console.error("Erreur lors de la lecture du message vocal:", error);
      Alert.alert("Erreur", "Impossible de lire le message vocal: " + error.message);
    }
  };

  // Fonction pour formater la durée d'un enregistrement
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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

                        {item.imageLink && (
                          <TouchableOpacity
                            style={styles.imageLinkContainer}
                            onPress={() => {
                              // Optionnel : ouvrir l'image dans une visionneuse
                              Alert.alert("Lien d'image", item.imageLink);
                            }}
                          >
                            <View style={styles.imageLinkContent}>
                              <Ionicons
                                name="link"
                                size={20}
                                color={isCurrentUser ? "#fff" : "#4ca38d"}
                              />
                              <Text
                                style={[
                                  styles.imageLinkText,
                                  isCurrentUser ? styles.currentUserText : styles.otherUserText
                                ]}
                                numberOfLines={1}
                              >
                                Lien d'image
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}

                        {item.audioUri && (
                          <TouchableOpacity
                            style={styles.audioContainer}
                            onPress={() => playVoiceMessage(item.audioUri, item.id)}
                          >
                            <View style={styles.audioContent}>
                              <MaterialCommunityIcons
                                name={isPlaying[item.id] ? "pause-circle" : "play-circle"}
                                size={36}
                                color={isCurrentUser ? "#fff" : "#4ca38d"}
                              />
                              <View style={styles.audioInfo}>
                                <View style={styles.audioWaveform}>
                                  {[...Array(8)].map((_, i) => (
                                    <View
                                      key={i}
                                      style={[
                                        styles.audioWave,
                                        isCurrentUser ? styles.audioWaveCurrentUser : styles.audioWaveOtherUser,
                                        { height: 4 + Math.random() * 12 }
                                      ]}
                                    />
                                  ))}
                                </View>
                                <Text
                                  style={[
                                    styles.audioDuration,
                                    isCurrentUser ? styles.currentUserText : styles.otherUserText
                                  ]}
                                >
                                  {formatDuration(item.audioDuration || 0)}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
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

          {isRecording ? (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingInfo}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Enregistrement en cours... {formatDuration(recordingDuration)}
                </Text>
                <Text style={styles.recordingLimit}>
                  / {formatDuration(30)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.recordingStopButton}
                onPress={stopRecording}
              >
                <Ionicons name="stop-circle" size={48} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => setShowImagePicker(true)}
                disabled={isUploading}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachButton}
                onPress={pickImageAsSupabaseLink}
                disabled={isUploading}
              >
                <Ionicons
                  name="link-outline"
                  size={24}
                  color="rgba(255, 255, 255, 0.7)"
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
              ) : msg ? (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={startRecording}
                  onLongPress={startRecording}
                >
                  <Ionicons
                    name="mic"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
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

      {/* Modal pour sélectionner une image */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.imagePickerModalContainer}>
          <TouchableOpacity
            style={styles.imagePickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowImagePicker(false)}
          />
          <View style={styles.imagePickerContent}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={30} color="white" />
              <Text style={styles.imagePickerOptionText}>Galerie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={30} color="white" />
              <Text style={styles.imagePickerOptionText}>Appareil photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerCancelButton}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.imagePickerCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  imageLinkContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  imageLinkContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageLinkText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    backgroundColor: "rgba(30, 30, 30, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
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
    backgroundColor: "rgba(60, 60, 60, 0.5)",
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachButton: {
    padding: 8,
    marginRight: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "white",
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "rgb(88, 190, 85)", // Vert plus intense
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
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
  // Styles pour les messages vocaux
  audioContainer: {
    marginTop: 5,
    marginBottom: 5,
    width: '100%',
    minWidth: 150,
  },
  audioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  audioInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 5,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginBottom: 5,
    justifyContent: 'space-between',
  },
  audioWave: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  audioWaveCurrentUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  audioWaveOtherUser: {
    backgroundColor: 'rgba(76, 163, 141, 0.7)',
  },
  audioDuration: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // Styles pour le modal de sélection d'image
  imagePickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  imagePickerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  // Styles pour l'enregistrement
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 25,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
    marginVertical: 5,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    marginRight: 10,
    // Animation de pulsation (simulée avec une ombre)
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  recordingText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
  },
  recordingLimit: {
    color: 'rgba(231, 76, 60, 0.7)',
    fontSize: 14,
    marginLeft: 5,
  },
  recordingStopButton: {
    padding: 8,
    marginLeft: 10,
  },
});

export default Chat;
