/**
 * Web (laptop / browser) — uses <iframe> since react-native-webview
 * is not supported on web platform.
 *
 * Permissions required for Daily.co:
 *   camera, microphone, display-capture, fullscreen, speaker-selection
 */
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  uri:          string;
  style?:       any;
  loadingColor?: string;
  // Accept (and ignore) WebView-specific props so callers don't need platform guards
  allowsInlineMediaPlayback?:       boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  javaScriptEnabled?:               boolean;
  domStorageEnabled?:               boolean;
  mediaCapturePermissionGrantType?: string;
  startInLoadingState?:             boolean;
  renderLoading?:                   () => React.ReactNode;
  onLoadStart?:                     () => void;
  onLoadEnd?:                       () => void;
}

export function WebViewUniversal({ uri, style }: Props) {
  return (
    <View style={[StyleSheet.absoluteFillObject, style]}>
      <iframe
        src={uri}
        style={{
          width:    '100%',
          height:   '100%',
          border:   'none',
          display:  'block',
        }}
        allow="camera; microphone; display-capture; fullscreen; speaker-selection; autoplay"
        allowFullScreen
        referrerPolicy="origin"
      />
    </View>
  );
}
