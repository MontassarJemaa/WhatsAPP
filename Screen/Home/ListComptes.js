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
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../../Config";

const database = firebase.database();
const ref_database = database.ref();
const ref_listCompte = ref_database.child("List_comptes");

export default function ListComptes(props) {
  const iduser = props.route.params.iduser;
  const [data, setData] = useState([]);

  useEffect(() => {
    var d = [];
    ref_listCompte.on("value", (snapshot) => {
      snapshot.forEach((uncompte) => {
        if (uncompte.val().id != iduser) {
          d.push(uncompte.val());
        }
      });
      setData(d);
    });
    return () => {
      ref_listCompte.off();
    };
  }, []);

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
        <Text style={styles.title}>Liste des Comptes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <FlatList
          style={styles.flatList}
          contentContainerStyle={{ paddingTop: 10 }}
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Image
                source={require("../../assets/profile.png")}
                style={styles.avatar}
              />
              <View style={styles.info}>
                <Text style={styles.text}>Numéro: {item.numero}</Text>
                <Text style={styles.text}>Pseudo: {item.pseudo}</Text>
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
              <View
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 10,
                  backgroundColor: item.connected ? "green" : "red",
                }}
              ></View>
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
  backButton: {
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
  headerSpacer: {
    width: 40,
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
  avatar: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  info: {
    flex: 1,
    marginLeft: 5,
  },
  text: {
    fontSize: 16,
    color: "#fff",
  },
  icon: {
    width: 28,
    height: 28,
    marginHorizontal: 5,
    tintColor: "rgba(255, 255, 255, 0.93)",
  },
});
