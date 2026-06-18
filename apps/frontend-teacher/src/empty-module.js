// Empty stand-in used by the Metro web resolver to keep native-only modules
// (e.g. @daily-co/react-native-daily-js / react-native-webrtc) OUT of the web
// bundle. Web code paths never import these — they use the web SDK instead.
module.exports = {};
