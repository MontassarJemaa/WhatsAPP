import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
              backgroundColor: "#000",
              height: 60,
            },
            headerTintColor: "#fff",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            title: "Connexion 🔐",
          }}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#000",
              height: 60,
            },
            headerTintColor: "#fff",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            title: "Home 🌟",
          }}
        />

        <Stack.Screen
          name="NewCompte"
          component={NewCompte}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#000",
              height: 60,
            },
            headerTintColor: "#fff",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontSize: 20,
            },
            title: "Créer un compte ✍️",
          }}
        />
                <Stack.Screen 
                  name="Chat" component={Chat}>
                </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
}
