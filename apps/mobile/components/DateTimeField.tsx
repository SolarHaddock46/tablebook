import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ui } from "@/components/ui";

type DateFieldProps = {
  label: string;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (next: Date) => void;
};

type TimeFieldProps = {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
};

export function DateField({ label, value, minimumDate, maximumDate, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={styles.field}>
        <Text style={ui.label}>{label}</Text>
        <View style={styles.webInputShell}>
          <Text style={ui.value}>{formatDateLabel(value)}</Text>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <input
            type="date"
            className="tablebook-picker-input"
            value={toIsoDate(value)}
            min={minimumDate ? toIsoDate(minimumDate) : undefined}
            max={maximumDate ? toIsoDate(maximumDate) : undefined}
            onChange={(event) => {
              const next = parseIsoDate(event.currentTarget.value, value);
              onChange(next);
            }}
          />
        </View>
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <View style={styles.field}>
        <Text style={ui.label}>{label}</Text>
        <View style={styles.pickerShell}>
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            themeVariant="dark"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            style={styles.iosPicker}
            onChange={(_event, selected) => {
              if (selected) {
                onChange(selected);
              }
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={ui.label}>{label}</Text>
      <Pressable style={[ui.input, styles.pressableInput]} onPress={() => setOpen(true)}>
        <Text style={ui.value}>{formatDateLabel(value)}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selected) => handlePickerChange(event, selected, setOpen, onChange)}
        />
      ) : null}
    </View>
  );
}

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={styles.field}>
        <Text style={ui.label}>{label}</Text>
        <View style={styles.webInputShell}>
          <Text style={ui.value}>{formatTimeLabel(value)}</Text>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <input
            type="time"
            className="tablebook-picker-input"
            value={toTimeValue(value)}
            onChange={(event) => {
              const next = parseTimeValue(event.currentTarget.value, value);
              onChange(next);
            }}
          />
        </View>
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <View style={styles.field}>
        <Text style={ui.label}>{label}</Text>
        <View style={styles.pickerShell}>
          <DateTimePicker
            value={value}
            mode="time"
            display="compact"
            themeVariant="dark"
            is24Hour
            style={styles.iosPicker}
            onChange={(_event, selected) => {
              if (selected) {
                onChange(selected);
              }
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={ui.label}>{label}</Text>
      <Pressable style={[ui.input, styles.pressableInput]} onPress={() => setOpen(true)}>
        <Text style={ui.value}>{formatTimeLabel(value)}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          is24Hour
          onChange={(event, selected) => handlePickerChange(event, selected, setOpen, onChange)}
        />
      ) : null}
    </View>
  );
}

function handlePickerChange(
  event: DateTimePickerEvent,
  selected: Date | undefined,
  setOpen: (open: boolean) => void,
  onChange: (next: Date) => void
) {
  if (event.type === "dismissed") {
    setOpen(false);
    return;
  }
  if (selected) {
    onChange(selected);
  }
  if (Platform.OS === "android") {
    setOpen(false);
  }
}

function formatDateLabel(value: Date): string {
  return value.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatTimeLabel(value: Date): string {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate: string, fallback: Date): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return fallback;
  }
  const next = new Date(fallback);
  next.setFullYear(year, month - 1, day);
  return next;
}

function toTimeValue(value: Date): string {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

function parseTimeValue(timeValue: string, fallback: Date): Date {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const next = new Date(fallback);
  next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return next;
}

const styles = StyleSheet.create({
  field: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    alignSelf: "stretch"
  },
  webInputShell: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    alignSelf: "stretch",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center"
  },
  pickerShell: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  iosPicker: {
    width: "100%",
    alignSelf: "stretch"
  },
  pressableInput: {
    width: "100%",
    alignSelf: "stretch"
  }
});
