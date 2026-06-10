import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { sessionService } from "@/services/sessions";
import { getErrorMessage } from "@/services/api";
import { extractToken } from "@/utils/qr";
import { Button } from "@/components/ui/Button";

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setSession = useSessionStore((s) => s.setSession);

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameModal, setNameModal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [manualToken, setManualToken] = useState("");
  const pendingToken = useRef<string | null>(null);
  const scannedRef = useRef(false);

  const join = async (token: string, name?: string) => {
    setJoining(true);
    setError(null);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await sessionService.scanAndJoin(
        token,
        Platform.OS,
        name,
      );
      setSession(result.session, result.menu);
      router.replace(`/session/${result.session.id}`);
    } catch (e) {
      setError(getErrorMessage(e));
      scannedRef.current = false;
      setJoining(false);
    }
  };

  const handleToken = (token: string | null) => {
    if (!token) {
      setError("Código QR inválido");
      scannedRef.current = false;
      return;
    }
    if (isAuthenticated) {
      join(token, user?.full_name);
    } else {
      pendingToken.current = token;
      setNameModal(true);
    }
  };

  const handleBarcode = ({ data }: { data: string }) => {
    if (scannedRef.current || joining || nameModal) return;
    scannedRef.current = true;
    handleToken(extractToken(data));
  };

  const confirmName = () => {
    const name = guestName.trim();
    if (!name) return;
    setNameModal(false);
    if (pendingToken.current) join(pendingToken.current, name);
  };

  const submitManual = () => {
    const token = extractToken(manualToken);
    if (!token) {
      setError("Ingresá un código válido");
      return;
    }
    handleToken(token);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const HeaderBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
        <Feather name="arrow-left" size={24} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.topTitle}>Escanear QR</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  // Web or no camera hardware: manual token entry.
  const showManual = Platform.OS === "web";

  if (showManual) {
    return (
      <View style={[styles.manualContainer, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.manualBack}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.manualBody}>
          <View style={[styles.qrIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="maximize" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.manualTitle, { color: colors.foreground }]}>
            Escanear QR
          </Text>
          <Text style={[styles.manualDesc, { color: colors.mutedForeground }]}>
            El escaneo con cámara está disponible en la app móvil. Ingresá el
            código de tu mesa para continuar.
          </Text>
          <TextInput
            style={[
              styles.manualInput,
              { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
            ]}
            placeholder="Código o enlace de la mesa"
            placeholderTextColor={colors.mutedForeground}
            value={manualToken}
            onChangeText={setManualToken}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}
          <Button
            title={joining ? "Uniéndote..." : "Unirme a la mesa"}
            onPress={submitManual}
            loading={joining}
            fullWidth
          />
        </View>
        <NameModal
          visible={nameModal}
          name={guestName}
          onChange={setGuestName}
          onConfirm={confirmName}
          onClose={() => {
            setNameModal(false);
            scannedRef.current = false;
          }}
        />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    const blocked = permission.status === "denied" && !permission.canAskAgain;
    return (
      <View style={[styles.permContainer, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.manualBack}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.manualBody}>
          <View style={[styles.qrIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="camera" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.manualTitle, { color: colors.foreground }]}>
            Permiso de cámara
          </Text>
          <Text style={[styles.manualDesc, { color: colors.mutedForeground }]}>
            {blocked
              ? "Activá el permiso de cámara desde los ajustes para escanear el código de tu mesa."
              : "Necesitamos acceso a la cámara para escanear el código QR de tu mesa."}
          </Text>
          <Button
            title={blocked ? "Abrir ajustes" : "Permitir cámara"}
            onPress={async () => {
              if (blocked && Platform.OS !== "web") {
                try {
                  const Linking = await import("expo-linking");
                  Linking.openSettings();
                } catch {
                  /* noop */
                }
              } else {
                requestPermission();
              }
            }}
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={joining ? undefined : handleBarcode}
      />
      <View style={styles.overlay}>
        {HeaderBar}
        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={styles.hint}>Apuntá al código QR de tu mesa</Text>
          {joining ? (
            <View style={styles.joiningBadge}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.joiningText}>Uniéndote a la mesa...</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBadge}>
              <Feather name="alert-circle" size={16} color="#FFFFFF" />
              <Text style={styles.errorBadgeText}>{error}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ height: insets.bottom + 24 }} />
      </View>

      <NameModal
        visible={nameModal}
        name={guestName}
        onChange={setGuestName}
        onConfirm={confirmName}
        onClose={() => {
          setNameModal(false);
          scannedRef.current = false;
        }}
      />
    </View>
  );
}

function NameModal({
  visible,
  name,
  onChange,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  name: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            ¿Cómo te llamamos?
          </Text>
          <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
            Tu nombre se mostrará al resto de la mesa.
          </Text>
          <TextInput
            style={[
              styles.manualInput,
              { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
            ]}
            placeholder="Tu nombre"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={onChange}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onConfirm}
          />
          <View style={styles.modalActions}>
            <Button title="Cancelar" variant="ghost" onPress={onClose} />
            <Button title="Continuar" onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  frameArea: {
    alignItems: "center",
    gap: 24,
  },
  frame: {
    width: 240,
    height: 240,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "#FFFFFF",
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  hint: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  joiningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  joiningText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E74C3C",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 24,
  },
  errorBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  manualContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  permContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  manualBack: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  manualBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingBottom: 80,
  },
  qrIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  manualDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
  },
  manualInput: {
    alignSelf: "stretch",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    alignSelf: "stretch",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 18,
    padding: 24,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
});
