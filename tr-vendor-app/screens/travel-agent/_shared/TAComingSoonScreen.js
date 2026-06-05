// screens/travel-agent/_shared/TAComingSoonScreen.js
// Route-params-driven placeholder. Lets us register many "coming soon" routes
// in the Stack navigator without duplicating files. Each Stack.Screen passes
// its own title/description/phase/icon via `initialParams`.
import React from "react";
import PhasePlaceholder from "./PhasePlaceholder";

export default function TAComingSoonScreen({ navigation, route }) {
  const { title = "Coming Soon", description, phase = "Upcoming phase", icon } =
    route?.params || {};
  return (
    <PhasePlaceholder
      navigation={navigation}
      title={title}
      description={description}
      phase={phase}
      icon={icon}
    />
  );
}
