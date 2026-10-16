import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildMapHtml } from "./maplibreHtml";
import { LiveMapProps } from "./LiveMap.types";

export function LiveMap(props: LiveMapProps) {
  const html = useMemo(() => buildMapHtml(props), [props]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "busPress" && props.onBusPress) {
        props.onBusPress(data.busId);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050B1E" },
  webview: { flex: 1, backgroundColor: "#050B1E" },
});