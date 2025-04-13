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
      activeColor="#fff"           // Icônes/texte actifs en blanc
      inactiveColor="#aaa"         // Icônes/texte inactifs gris clair
      barStyle={{ backgroundColor: "#000" }}  // Barre noire
    >
      <Tab.Screen
        name="ListComptes"
        component={ListComptes}
        options={{
          tabBarLabel: "Comptes",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-multiple" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Forum"
        component={Forum}
        options={{
          tabBarLabel: "Forum",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="forum" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="MonCompte"
        component={MonCompte}
        options={{
          tabBarLabel: "Moi",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
