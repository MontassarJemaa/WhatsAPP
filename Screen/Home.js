import React from "react";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import ListComptes from "./Home/ListComptes";
import Group from "./Home/Group";
import MonCompte from "./Home/MonCompte";

const Tab = createMaterialBottomTabNavigator();

export default function Home(props) {
  const iduser = props.route.params.iduser;
  const profileImage = props.route.params.profileImage || null;
  const initialScreen = props.route.params.screen || "ListComptes";
  return (
    <Tab.Navigator
      initialRouteName={initialScreen}
      activeColor="#5fb39d" 
      inactiveColor="#b0b0b0" 
      barStyle={{
        backgroundColor: "#212121", 
        elevation: 8,                 
        paddingBottom: 5,             
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
              size={30}  
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
              size={30}  
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
              size={32} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
