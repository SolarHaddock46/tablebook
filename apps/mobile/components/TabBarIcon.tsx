import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type TabBarIconProps = {
  activeName: IoniconName;
  inactiveName: IoniconName;
  color: string;
  focused: boolean;
  size?: number;
};

export function TabBarIcon({ activeName, inactiveName, color, focused, size = 24 }: TabBarIconProps) {
  return <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />;
}
