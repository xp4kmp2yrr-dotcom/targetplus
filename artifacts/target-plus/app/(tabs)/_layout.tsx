import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>ホーム</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="synonym">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet.fill" }} />
        <Label>類義語分類</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>意味検索</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="derivative">
        <Icon sf={{ default: "textformat.abc", selected: "textformat.abc" }} />
        <Label>派生語</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="etymology">
        <Icon sf={{ default: "book.closed", selected: "book.closed.fill" }} />
        <Label>語源(Beta)</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#0F1B2D" : "#FFFFFF",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: isDark ? "#2E3D50" : "#DDE3ED",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? "#0F1B2D" : "#FFFFFF" },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="synonym"
        options={{
          title: "類義語分類",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet" tintColor={color} size={24} />
            ) : (
              <Feather name="list" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "意味検索",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={24} />
            ) : (
              <Feather name="search" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="derivative"
        options={{
          title: "派生語",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="textformat.abc" tintColor={color} size={24} />
            ) : (
              <MaterialCommunityIcons name="alphabetical" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="etymology"
        options={{
          title: "語源検索(Beta)",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="book.closed" tintColor={color} size={24} />
            ) : (
              <Feather name="book" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
