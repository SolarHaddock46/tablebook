import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { useLocale } from "@/lib/use-locale";

const Constants = {
  StackGap: 12,
  ListItemGap: 12,
  SectionGap: 16,
  HeaderGap: 8,
  InputFontSize: 16,
  BackButtonFontSize: 22,
  BackButtonColor: "#64748b",
  BackButtonHitSlop: 12,
  BackButtonPressedOpacity: 0.6
} as const;

export function Screen({
  title,
  children,
  scrollable = false,
  showBack
}: {
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  showBack?: boolean;
}) {
  const router = useRouter();
  const shouldShowBack = showBack ?? router.canGoBack();
  const header = title ? <ScreenHeader title={title} showBack={shouldShowBack} /> : null;

  if (scrollable) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {header}
        {children}
      </View>
    </View>
  );
}

function ScreenHeader({ title, showBack }: { title: string; showBack: boolean }) {
  const router = useRouter();
  const { dict } = useLocale();

  return (
    <View style={styles.headerRow}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={dict.back}
          hitSlop={backButtonHitSlop()}
          style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

function backButtonHitSlop() {
  const size = Constants.BackButtonHitSlop;
  return { top: size, bottom: size, left: size, right: size };
}

export function Stack({
  children,
  style
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.stack, style]}>{children}</View>;
}

export function MatchReasons({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) {
    return null;
  }

  return (
    <View style={styles.reasonRow}>
      {reasons.map((reason) => (
        <View key={reason} style={styles.reasonChip}>
          <Text style={styles.reasonChipText}>{reason}</Text>
        </View>
      ))}
    </View>
  );
}

export function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  content: {
    flex: 1,
    gap: Constants.StackGap,
    padding: 16,
    minWidth: 0
  },
  stack: {
    gap: Constants.StackGap
  },
  scrollContent: {
    gap: Constants.StackGap,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    alignSelf: "stretch"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Constants.HeaderGap,
    marginBottom: 4,
    minWidth: 0
  },
  backButton: {
    paddingVertical: 2,
    paddingRight: 2
  },
  backButtonPressed: {
    opacity: Constants.BackButtonPressedOpacity
  },
  backButtonText: {
    color: Constants.BackButtonColor,
    fontSize: Constants.BackButtonFontSize,
    lineHeight: Constants.BackButtonFontSize
  },
  title: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700",
    minWidth: 0
  },
  listSeparator: {
    height: Constants.ListItemGap
  },
  reasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  reasonChip: {
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#334155"
  },
  reasonChipText: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "600"
  }
});

export const ui = StyleSheet.create({
  input: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: Constants.InputFontSize
  },
  button: {
    backgroundColor: "#06b6d4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 4
  },
  value: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600"
  },
  link: {
    color: "#67e8f9",
    fontSize: 15
  },
  muted: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20
  },
  flatList: {
    flex: 1
  },
  listContent: {
    paddingBottom: 8
  }
});

export const spacing = {
  stack: Constants.StackGap,
  listItem: Constants.ListItemGap,
  section: Constants.SectionGap
};
