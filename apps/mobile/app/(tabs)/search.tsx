import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text } from "react-native";
import {
  CUISINE_FILTER_OPTIONS,
  DISTRICT_FILTER_OPTIONS,
  PRICE_LEVEL_FILTER_OPTIONS,
  t,
  type Locale
} from "@tablebook/shared";
import { DateField, TimeField } from "@/components/DateTimeField";
import { OptionRow } from "@/components/OptionRow";
import { Screen, ui } from "@/components/ui";

const cuisines = [
  { id: "", title: "Любая кухня" },
  ...CUISINE_FILTER_OPTIONS.map((item) => ({ id: item.id, title: item.titleRu }))
];

const districts = [
  { id: "", title: "Любой район" },
  ...DISTRICT_FILTER_OPTIONS.map((item) => ({ id: item.id, title: item.titleRu }))
];

const priceLevels = [
  { id: "", title: "Любой чек" },
  ...PRICE_LEVEL_FILTER_OPTIONS.map((item) => ({ id: String(item.id), title: item.titleRu }))
];

const guestOptions = ["1", "2", "3", "4", "5", "6"];

const Constants = {
  DefaultHour: 19,
  DefaultMinute: 0,
  MaxDaysAhead: 90
} as const;

function createInitialDate(): Date {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function createInitialTime(): Date {
  const value = new Date();
  value.setHours(Constants.DefaultHour, Constants.DefaultMinute, 0, 0);
  return value;
}

function formatIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeParam(value: Date): string {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

export default function SearchScreen() {
  const router = useRouter();
  const locale: Locale = "ru";
  const dict = t(locale);
  const [cuisine, setCuisine] = useState("");
  const [district, setDistrict] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [dateValue, setDateValue] = useState(createInitialDate);
  const [timeValue, setTimeValue] = useState(createInitialTime);
  const [guests, setGuests] = useState("2");

  const minimumDate = useMemo(() => createInitialDate(), []);
  const maximumDate = useMemo(() => {
    const value = createInitialDate();
    value.setDate(value.getDate() + Constants.MaxDaysAhead);
    return value;
  }, []);

  function handleSearch() {
    router.push({
      pathname: "/results",
      params: {
        cuisine,
        district,
        price_level: priceLevel,
        date: formatIsoDate(dateValue),
        time: formatTimeParam(timeValue),
        guests
      }
    });
  }

  return (
    <Screen title="Поиск ресторана" scrollable>
      <Text style={ui.label}>Кухня</Text>
      <OptionRow options={cuisines} value={cuisine} onChange={setCuisine} />
      <Text style={ui.label}>Район</Text>
      <OptionRow options={districts} value={district} onChange={setDistrict} />
      <Text style={ui.label}>Ценовой диапазон</Text>
      <OptionRow options={priceLevels} value={priceLevel} onChange={setPriceLevel} />
      <DateField
        label={dict.pickDate}
        value={dateValue}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={setDateValue}
      />
      <TimeField label={dict.pickTime} value={timeValue} onChange={setTimeValue} />
      <Text style={ui.label}>Гостей</Text>
      <OptionRow options={guestOptions.map((item) => ({ id: item, title: item }))} value={guests} onChange={setGuests} />
      <Pressable style={ui.button} onPress={handleSearch}>
        <Text style={ui.buttonText}>Найти</Text>
      </Pressable>
    </Screen>
  );
}
