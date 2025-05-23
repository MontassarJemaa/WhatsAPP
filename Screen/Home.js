import React from "react";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import ListComptes from "./Home/ListComptes";
import Group from "./Home/Group";
import MonCompte from "./Home/MonCompte";

const Tab = createMaterialBottomTabNavigator();

export default function Home(props) {
  const iduser = props.route.params.iduser;
  // Récupérer l'objet profileImage s'il existe
  const profileImage = props.route.params.profileImage || null;
  // Récupérer l'écran initial depuis les paramètres (par défaut ListComptes)
  const initialScreen = props.route.params.screen || "ListComptes";
  return (
    <Tab.Navigator
      initialRouteName={initialScreen}
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
        initialParams={{iduser}}
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
        name="Group"
        component={Group}
        initialParams={{iduser}}
        options={{
          tabBarLabel: "Groupes",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-group"
              color={color}
              size={30}  // Taille des icônes
            />
          ),
        }}
      />
      <Tab.Screen
        name="MonCompte"
        component={MonCompte}
        initialParams={{iduser, profileImage}}
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
