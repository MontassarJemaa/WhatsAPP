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
} from "react-native";
import React, { useEffect, useState } from "react";
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
      console.log(d);
      setData(d);
    });
    return () => {
      ref_listCompte.off();
    };
  }, []);

  return (
    <ImageBackground
      style={styles.bg}
      source={require("../../assets/background.png")}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Liste des Comptes</Text>

        <FlatList
          style={styles.flatList}
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
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(34, 33, 33, 0.6)",
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  flatList: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
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
    tintColor: "#7edbc4", // pour correspondre au thème
  },
});
