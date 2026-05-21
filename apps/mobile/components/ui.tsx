import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

const Constants = {
  StackGap: 12,
  ListItemGap: 12,
  SectionGap: 16
} as const;

export function Screen({
  title,
  children,
  scrollable = false
}: {
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  if (scrollable) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </View>
    </View>
  );
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
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4
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
    borderColor: "#334155"
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
