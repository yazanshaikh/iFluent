/**
 * Web (laptop / browser) — uses <iframe>, since react-native-webview is not
 * supported on web ("React Native WebView does not support this platform").
 *
 * Permissions cover both Nearpod and Daily embeds (camera/mic for video).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { WebViewProps } from 'react-native-webview';

// Accept (and ignore) WebView-only props so callers need no platform guards.
interface Props extends Partial<Omit<WebViewProps, 'source'>> {
  uri: string;
  loadingColor?: string;
}

export function WebViewUniversal({ uri, style }: Props) {
  return (
    <View style={[StyleSheet.absoluteFillObject, style as any]}>
      <iframe
        src={uri}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="camera; microphone; display-capture; fullscreen; speaker-selection; autoplay"
        allowFullScreen
        referrerPolicy="origin"
      />
    </View>
  );
}
