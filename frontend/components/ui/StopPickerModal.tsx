import { Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Stop, searchStops } from "../../lib/routes";
import { useTheme } from "../../theme/ThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { typography } from "../../theme/typography";

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (stop: Stop) => void;
}

export function StopPickerModal({
  visible,
  title,
  onClose,
  onSelect,
}: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const t = setTimeout(async () => {
      try {
        const data = await searchStops(query);
        if (!cancelled) setStops(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.detail || "Could not load stops");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, visible]);

  function reset() {
    setQuery("");
    setStops([]);
    setError(null);
  }

  function handleSelect(stop: Stop) {
    onSelect(stop);
    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView
          edges={["bottom"]}
          style={[styles.sheet, { backgroundColor: colors.bg }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X color={colors.textSecondary} size={22} />
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Search color={colors.textMuted} size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search stops"
              placeholderTextColor={colors.textMuted}
              autoFocus
              style={[
                typography.body,
                styles.searchInput,
                { color: colors.textPrimary },
              ]}
            />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={[typography.bodySm, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          ) : stops.length === 0 ? (
            <View style={styles.center}>
              <Text
                style={[typography.bodySm, { color: colors.textSecondary }]}
              >
                No stops found
              </Text>
            </View>
          ) : (
            <FlatList
              data={stops}
              keyExtractor={(item) => item.stop_id}
              style={{ marginTop: spacing.md }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[typography.body, { color: colors.textPrimary }]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      typography.micro,
                      { color: colors.textMuted, marginTop: 2 },
                    ]}
                  >
                    {item.stop_id}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    maxHeight: "85%",
    minHeight: "60%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm },
  row: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});