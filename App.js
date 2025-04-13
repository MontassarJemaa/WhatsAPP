import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"; // Import des icônes

import Authentification from "./Screen/Authentification";
import Home from "./Screen/Home";
import NewCompte from "./Screen/NewCompte";
import Chat from "./Screen/Chat";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Authentification"
          component={Authentification}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#5fb39d", // Changer la couleur de l'en-tête
              height: 60,
            },
            headerTintColor: "#fff", // Texte blanc pour le titre
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            headerLeft: () => (
              <MaterialCommunityIcons
                name="login" // Icône d'authentification
                size={25}
                color="#fff" // Icône en blanc
                style={{ marginLeft: 10 }}
              />
            ),
            title: "Connexion 🔐",
          }}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#5fb39d", // Changer la couleur de l'en-tête
              height: 60,
            },
            headerTintColor: "#fff", // Texte blanc pour le titre
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            headerLeft: () => (
              <MaterialCommunityIcons
                name="home" // Icône Home
                size={25}
                color="#fff" // Icône en blanc
                style={{ marginLeft: 10 }}
              />
            ),
            title: "Home 🌟",
          }}
        />

        <Stack.Screen
          name="NewCompte"
          component={NewCompte}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#5fb39d", // Changer la couleur de l'en-tête
              height: 60,
            },
            headerTintColor: "#fff", // Texte blanc pour le titre
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            headerLeft: () => (
              <MaterialCommunityIcons
                name="account-plus" // Icône pour Créer un compte
                size={25}
                color="#fff" // Icône en blanc
                style={{ marginLeft: 10 }}
              />
            ),
            title: "Créer un compte ✍️",
          }}
        />

        <Stack.Screen
          name="Chat"
          component={Chat}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#5fb39d", // Changer la couleur de l'en-tête
              height: 60,
            },
            headerTintColor: "#fff", // Texte blanc pour le titre
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            headerLeft: () => (
              <MaterialCommunityIcons
                name="chat" // Icône Chat
                size={25}
                color="#fff" // Icône en blanc
                style={{ marginLeft: 10 }}
              />
            ),
            title: "Chat 💬",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
