import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { buildMapHtml } from "./maplibreHtml";
import { LiveMapProps } from "./LiveMap.types";

export function LiveMap(props: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const html = useMemo(() => buildMapHtml(props), [props]);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === "busPress" && props.onBusPress) {
        props.onBusPress(data.busId);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [props]);

  // Mount/replace iframe whenever HTML changes
  useEffect(() => {
    if (!containerRef.current) return;
    if (iframeRef.current) iframeRef.current.remove();

    const iframe = document.createElement("iframe");
    iframe.src = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.title = "SmartFare Live Map";
    containerRef.current.appendChild(iframe);
    iframeRef.current = iframe;

    return () => {
      iframe.remove();
    };
  }, [html]);

  return (
    <View
      style={styles.container}
      // @ts-ignore — react-native-web passes ref through to the DOM node
      ref={(r: any) => {
        containerRef.current = r as HTMLDivElement;
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050B1E" },
});