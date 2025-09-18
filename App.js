import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Authentification from "./screen/Authentification";
import Home from "./screen/Home";
import NewCompte from "./screen/NewCompte";
import Chat from "./screen/Chat";
import CreateGroup from "./screen/CreateGroup";
import GroupChat from "./screen/GroupChat";
import Details from "./screen/Details";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Authentification" component={Authentification} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="NewCompte" component={NewCompte} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} />
        <Stack.Screen name="GroupChat" component={GroupChat} />
        <Stack.Screen name="Details" component={Details} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
