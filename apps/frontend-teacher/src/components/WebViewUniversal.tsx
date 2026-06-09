/**
 * Native (iOS / Android) — uses react-native-webview.
 * Metro automatically picks WebViewUniversal.web.tsx on web builds.
 */
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';

interface Props extends Omit<WebViewProps, 'source'> {
  uri:         string;
  loadingColor?: string;
}

export function WebViewUniversal({ uri, loadingColor = '#3b82f6', style, ...rest }: Props) {
  return (
    <WebView
      source={{ uri }}
      style={[StyleSheet.absoluteFillObject, style]}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      mediaCapturePermissionGrantType="grant"
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFillObject, styles.loading]}>
          <ActivityIndicator color={loadingColor} />
        </View>
      )}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  loading: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
});
