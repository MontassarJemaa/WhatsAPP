import React from "react";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import ListComptes from "./Home/ListComptes";
import Forum from "./Home/Forum";
import MonCompte from "./Home/MonCompte";

const Tab = createMaterialBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator
      initialRouteName="ListComptes"
      activeColor="#5fb39d"  // Icônes/texte actifs en vert menthe clair
      inactiveColor="#b0b0b0" // Icônes/texte inactifs gris clair
      barStyle={{
        backgroundColor: "#212121",  // Barre noire pour la fondation
        elevation: 8,                 // Ombre portée pour un effet de surélévation
        paddingBottom: 5,             // Espacement au bas
      }}
    >
      <Tab.Screen
        name="ListComptes"
        component={ListComptes}
        options={{
          tabBarLabel: "Comptes",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-multiple"
              color={color}
              size={30}  // Taille des icônes
            />
          ),
        }}
      />
      <Tab.Screen
        name="Forum"
        component={Forum}
        options={{
          tabBarLabel: "Forum",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="forum"
              color={color}
              size={30}  // Taille des icônes
            />
          ),
        }}
      />
      <Tab.Screen
        name="MonCompte"
        component={MonCompte}
        options={{
          tabBarLabel: "Moi",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-circle"
              color={color}
              size={32}  // Taille des icônes
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
