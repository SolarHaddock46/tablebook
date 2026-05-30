import { Pressable, Text, View } from "react-native";
import { ui } from "./ui";

export function OptionRow({
  options,
  value,
  onChange
}: {
  options: Array<{ id: string; title: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id || "all"}
            style={[
              ui.card,
              {
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderColor: selected ? "#06b6d4" : "#334155"
              }
            ]}
            onPress={() => onChange(option.id)}
          >
            <Text style={selected ? ui.link : ui.muted}>{option.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MultiOptionRow({
  options,
  values,
  onChange
}: {
  options: Array<{ id: string; title: string }>;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = values.includes(option.id);
        return (
          <Pressable
            key={option.id}
            style={[
              ui.card,
              {
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderColor: selected ? "#06b6d4" : "#334155"
              }
            ]}
            onPress={() => toggleOption(option.id, values, onChange)}
          >
            <Text style={selected ? ui.link : ui.muted}>{option.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function toggleOption(id: string, values: string[], onChange: (next: string[]) => void) {
  if (values.includes(id)) {
    onChange(values.filter((value) => value !== id));
    return;
  }
  onChange([...values, id]);
}
