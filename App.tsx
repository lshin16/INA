import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, Text } from 'react-native';
import * as Notifications from 'expo-notifications';

import HomeScreen from './src/screens/HomeScreen';
import EmergencyProfileScreen from './src/screens/EmergencyProfileScreen';
import TalkNowScreen from './src/screens/TalkNowScreen';
import BodyMapScreen from './src/screens/BodyMapScreen';
import OPQRSTScreen from './src/screens/OPQRSTScreen';
import ResponderSummaryScreen from './src/screens/ResponderSummaryScreen';
import CaregiverPINScreen from './src/screens/CaregiverPINScreen';
import EditProfileMenuScreen from './src/screens/EditProfileMenuScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import DiagnosesScreen from './src/screens/DiagnosesScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import AllergiesScreen from './src/screens/AllergiesScreen';
import EmergencyContactsScreen from './src/screens/EmergencyContactsScreen';
import FirstResponderNotesScreen from './src/screens/FirstResponderNotesScreen';

import { RootStackParamList } from './src/types';
import { colors } from './src/utils/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.amber,
    notification: colors.red,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            headerBackTitleVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/* Member-facing screens */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EmergencyProfile"
            component={EmergencyProfileScreen}
            options={{ title: 'Emergency Profile', headerTintColor: colors.redLight }}
          />
          <Stack.Screen
            name="TalkNow"
            component={TalkNowScreen}
            options={{ title: 'Talk With Me Now', headerTintColor: colors.greenLight }}
          />
          <Stack.Screen
            name="BodyMap"
            component={BodyMapScreen}
            options={{ title: 'Where Does It Hurt?', headerTintColor: colors.amberLight }}
          />
          <Stack.Screen
            name="OPQRST"
            component={OPQRSTScreen}
            options={{ title: 'What\'s Happening?', headerTintColor: colors.amberLight }}
          />
          <Stack.Screen
            name="ResponderSummary"
            component={ResponderSummaryScreen}
            options={{ title: 'Responder Summary' }}
          />

          {/* Caregiver-gated screens */}
          <Stack.Screen
            name="CaregiverPIN"
            component={CaregiverPINScreen}
            options={{ title: 'Caregiver Mode', presentation: 'modal' }}
          />
          <Stack.Screen
            name="EditMenu"
            component={EditProfileMenuScreen}
            options={({ navigation }) => ({
              title: 'Edit Profile',
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.popToTop()}>
                  <Text style={{ color: colors.amber, fontSize: 16, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: 'Personal Info' }} />
          <Stack.Screen name="Diagnoses" component={DiagnosesScreen} options={{ title: 'Diagnoses & Conditions' }} />
          <Stack.Screen name="Medications" component={MedicationsScreen} options={{ title: 'Medications' }} />
          <Stack.Screen name="Allergies" component={AllergiesScreen} options={{ title: 'Allergies' }} />
          <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={{ title: 'Emergency Contacts' }} />
          <Stack.Screen name="FirstResponderNotes" component={FirstResponderNotesScreen} options={{ title: 'First Responder Notes' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
