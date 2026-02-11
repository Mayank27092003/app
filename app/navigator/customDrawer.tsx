// AppNavigator.tsx
import React, { useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import {
  LogOut,
  Settings,
  Contact,
  Dock,
  FileText,
  ListChecks,
  User,
  Edit,
} from "lucide-react-native";
import { BottomTab } from "./bottom-tab";
import { Colors } from "@app/styles";
import { Routes } from "./constants";
import { logoutApp, selectProfile } from "@app/module/common";
import { useAuthStore } from "@app/store/authStore";
import { useDispatch, useSelector } from "react-redux";
import { ms } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import { DriverProfile, MerchantProfile } from "@app/types";
import { LanguageSettingsScreen, TermsScreen } from "@app/module/settings";
import PrivacyPolicyScreen from "@app/module/settings/view/PrivacyPolicyScreen";
import { editProfile } from "@app/module/profile/slice";
import { EditProfileScreen } from "@app/module/profile/view/editProfile";
import { Button } from "@app/components";
import { useTranslation } from 'react-i18next';
// Screens
const HomeScreen = () => (
  <View style={styles.screen}>
    <Text>🏠 Home Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text>👤 Profile Screen</Text>
  </View>
);

// Drawer Navigator
const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const [error, setError] = useState(false);
  const { userRole, logout } = useAuthStore();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const handleLogout = () => {
    logout();
    dispatch(logoutApp());
  };
  const userProfile = useSelector(selectProfile)


  return (
    <View style={styles.drawer}>
      {userProfile ? <View style={styles.avatarContainer}>
        <View style={{}}>
          {userProfile?.profileImage ? (
            <Image
              source={
                error || !userProfile?.profileImage
                  ? require("../assets/dummyImage.png") // fallback local image
                  : { uri: userProfile.profileImage }
              }
              style={styles.avatar}
              onError={() => setError(true)}
            />

          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {userProfile?.userName?.charAt(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={() => navigation.navigate(Routes.EditProfileScreen)}
          >
            <Edit size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={{ marginHorizontal: 10, width: '68%', }}>
          <Text style={styles.userName}>{userProfile?.userName}</Text>
          <Text style={styles.userRole}>
            {userProfile?.roles?.[0]?.role?.name}

          </Text>
        </View>
      </View> :
        <View style={{ ...styles.avatarContainer, backgroundColor: Colors.background, alignItems: 'center', paddingVertical: ms(50), justifyContent: 'center' }}>
          <Button
            title={t('drawer.signIn')}
            variant="primary"

            style={styles.signInButton}
            onPress={handleLogout}
          />
        </View>}
      {/* </View> */}
      <View style={{ padding: ms(20) }}>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate(Routes.LanguageSettingsScreen)}
        >
          <Settings size={25} color={Colors.primary} />
          <Text style={styles.drawerText}>{t('drawer.settings')}</Text>
        </TouchableOpacity>





        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate(Routes.PrivacyPolicyScreen)}
        // onPress={() => Linking.openURL('https://www.gofrts.com/privacy-policy')}

        >
          <FileText size={25} color={Colors.primary} />
          <Text style={styles.drawerText}>{t('drawer.privacy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate(Routes.TermsScreen)}
        >
          <ListChecks size={25} color={Colors.primary} />
          <Text style={styles.drawerText}>{t('drawer.terms')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate(Routes.ContactUsScreen)}
        >
          <Contact size={25} color={Colors.primary} />
          <Text style={styles.drawerText}>{t('drawer.contact')}</Text>
        </TouchableOpacity>
        {userProfile && <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
          <LogOut size={25} color={Colors.primary} />
          <Text style={styles.drawerText}>{t('drawer.logout')}</Text>
        </TouchableOpacity>}

      </View>
    </View>
  );
};

export default function CustomDrawer() {
  return (
    // <NavigationContainer>
    <Drawer.Navigator
      screenOptions={{
        drawerType: "front",
        drawerStyle: {
          width: 300, // 👈 Set your desired drawer width here
          backgroundColor: Colors.background,
        },
        headerShown: false, // 👈 Hide the header
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}

    // screenOptions={{
    //   headerLeft: ({ tintColor }) => (
    //     <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => props.navigation.openDrawer()}>
    //       <Menu size={28} color={tintColor || 'black'} />
    //     </TouchableOpacity>
    //   ),
    // }}
    >
      <Drawer.Screen name="BottomTab" component={BottomTab} />
      <Drawer.Screen
        name={Routes.LanguageSettingsScreen}
        component={LanguageSettingsScreen}
      />
      <Drawer.Screen name={Routes.TermsScreen} component={TermsScreen} />
      <Drawer.Screen
        name={Routes.PrivacyPolicyScreen}
        component={PrivacyPolicyScreen}
      />
      <Drawer.Screen
        name={Routes.EditProfileScreen}
        component={EditProfileScreen}
      />
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
    // </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  drawer: {
    flex: 1,
    // paddingTop: 60,

    backgroundColor: Colors.background,
  },
  drawerItem: {
    marginBottom: 30,
    flexDirection: "row",
    margin: 10,
  },
  drawerText: {
    fontSize: 20,
    marginLeft: 10,
    color: Colors.text,
  },
  avatar: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(50),
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.white,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: ms(20),
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
    // maxWidth:'80%'
  },

  avatarContainer: {
    position: "relative", // 👈 Important for absolute children
    alignItems: "center",
    marginBottom: 16,
    padding: 20,
    paddingVertical: 40,
    width: "100%",
    backgroundColor: Colors.primary,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  userRole: {
    fontSize: 16,
    color: Colors.gray600,
    marginBottom: 12,
    textTransform: "capitalize",
  },
});
