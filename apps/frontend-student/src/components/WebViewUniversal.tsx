/**
 * Native (iOS / Android) — uses react-native-webview.
 * Metro automatically picks WebViewUniversal.web.tsx on web builds (where
 * react-native-webview is unsupported and throws).
 */
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';

interface Props extends Omit<WebViewProps, 'source'> {
  uri: string;
  loadingColor?: string;
}

export function WebViewUniversal({ uri, loadingColor = '#7c3aed', style, ...rest }: Props) {
  return (
    <WebView
      source={{ uri }}
      style={[StyleSheet.absoluteFillObject, style]}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      mediaCapturePermissionGrantType="grant"
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFillObject, styles.loading]}>
          <ActivityIndicator color={loadingColor} size="large" />
        </View>
      )}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  loading: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f3ff' },
});
