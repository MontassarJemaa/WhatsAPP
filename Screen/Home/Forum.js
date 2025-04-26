import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../../Config/index";

export default function Forum({ navigation }) {
  const [temp, setTemp] = useState(null);
  const [hum, setHum] = useState(null);
  const [alerte, setAlerte] = useState(false);
  const [ledVerte, setLedVerte] = useState(true);
  const [scaleValue] = useState(new Animated.Value(1));
  const [rotateValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const db = firebase.database();

    db.ref("capteurs/temperature").on("value", (snapshot) => {
      setTemp(snapshot.val());
      if (snapshot.val() > 30) {
        triggerAnimation();
      }
    });

    db.ref("capteurs/humidite").on("value", (snapshot) => {
      setHum(snapshot.val());
    });

    db.ref("capteurs/alerte").on("value", (snapshot) => {
      setAlerte(snapshot.val());
    });

    db.ref("led_verte").on("value", (snapshot) => {
      setLedVerte(snapshot.val());
    });
  }, []);

  const triggerAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const toggleLED = () => {
    const db = firebase.database();
    db.ref("led_verte").set(!ledVerte);
    setLedVerte(!ledVerte);
  };

  const rotateInterpolation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const ledEmoji = ledVerte ? "💡" : "🔌";

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
        <Text style={styles.title}>ClimaSenseMonitor</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Bienvenue dans</Text>
        <Text style={styles.appName}>ClimaSenseMonitor 🔥</Text>

        <View style={styles.dataContainer}>
          <Animated.View
            style={[styles.dataCard, { transform: [{ scale: scaleValue }] }]}
          >
            <Text style={styles.dataIcon}>🌡</Text>
            <Text style={styles.dataLabel}>Température</Text>
            <Text style={styles.dataValue}>{temp} 25 °C</Text>
          </Animated.View>

          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>💧</Text>
            <Text style={styles.dataLabel}>Humidité</Text>
            <Text style={styles.dataValue}>{hum}56 %</Text>
          </View>
        </View>

        {alerte && (
          <Animated.View
            style={[
              styles.alertBox,
              { transform: [{ rotate: rotateInterpolation }] },
            ]}
          >
            <Text style={styles.alertText}>⚠️ Température élevée !</Text>
          </Animated.View>
        )}

        <View style={styles.ledContainer}>
          <Text style={styles.ledStatusText}>État de la LED: {ledEmoji}</Text>
          <TouchableOpacity
            style={[
              styles.ledButton,
              { backgroundColor: ledVerte ? "#4CAF50" : "#9E9E9E" },
            ]}
            onPress={toggleLED}
            activeOpacity={0.7}
          >
            <Text style={styles.ledButtonText}>
              {ledVerte ? "Éteindre" : "Allumer"}
            </Text>
          </TouchableOpacity>
        </View>
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
    alignItems: "flex-end", // Changé de "center" à "flex-end" pour aligner en bas
    justifyContent: "space-between",
    paddingVertical: 25, // Gardé la même hauteur totale
    paddingHorizontal: 20,
    paddingBottom: 12, // Ajouté pour contrôler l'espace en bas
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginTop: StatusBar.currentHeight || 0,
    height: 90, // Hauteur totale explicite (ajustez selon besoin)
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: -5, // Ajustement fin pour position verticale
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 4, // Abaisse légèrement le texte
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  welcomeText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 5,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 40,
    textShadowColor: "rgba(0, 150, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dataContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  dataCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 20,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dataIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  dataLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 5,
  },
  dataValue: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  alertBox: {
    backgroundColor: "rgba(255, 50, 50, 0.2)",
    borderColor: "rgba(255, 50, 50, 0.5)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  alertText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "bold",
  },
  ledContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  ledStatusText: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 15,
  },
  ledButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ledButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
