import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  secureToggle,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error ? colors.destructive : colors.border;

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: colors.background,
            borderRadius: 10,
          },
        ]}
      >
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={18}
            color={colors.mutedForeground}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          style={[
            styles.input,
            { color: colors.foreground },
            !leftIcon && styles.inputNoPad,
            style as object,
          ]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secureToggle ? !showPassword : props.secureTextEntry}
          {...props}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      ) : null}
      {hint && !error ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  inputNoPad: {
    paddingHorizontal: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
  },
  hint: {
    fontSize: 12,
  },
});
