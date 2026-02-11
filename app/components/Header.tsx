// components/CustomHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { Colors } from "@app/styles";
import { ms } from "react-native-size-matters";

type Props = {
  title: string;
};

const Header: React.FC<Props> = ({ title }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity> */}
      <View style={{ width: "20%", alignItems: "center" }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          {" "}
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: "30%", height: ms(40) }} /> Spacer for alignment
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ms(50),
    flexDirection: "row",
    alignItems: "center",
    // paddingHorizontal: 16,
    // justifyContent: "center",
    backgroundColor: Colors.background,
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
    width: "100%",
  },
  backButton: {
    // position: "absolute",
    // left: 16,
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: Colors.backgroundCard,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    width: "60%",
    textAlign: "center",
    // backgroundColor:'red'
  },
});

export default Header;
