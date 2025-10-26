import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

interface ReadyPlayerMeAvatarProps {
  avatarUrl: string;
  animationState: 'idle' | 'listening' | 'talking' | 'thinking';
  onAnimationComplete?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  containerStyle?: ViewStyle;
}

const ReadyPlayerMeAvatar: React.FC<ReadyPlayerMeAvatarProps> = ({
  avatarUrl,
  animationState,
  onAnimationComplete,
  onLoadStart,
  onLoadEnd,
  onError,
  containerStyle,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheKey] = useState(() => `avatar-${Date.now()}`);

  // Send animation state to WebView
  useEffect(() => {
    if (webViewRef.current && !isLoading) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'changeAnimation',
        state: animationState,
      }));
    }
  }, [animationState, isLoading]);

  // HTML with model-viewer to properly render GLB files
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta charset="utf-8">
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      width: 100vw;
      height: 100vh;
      background: transparent;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    model-viewer {
      width: 100%;
      height: 100%;
      background-color: transparent;
      transition: transform 0.5s ease;
      transform-origin: center center;
      z-index: 10;
    }

    /* Idle/Waiting animation - gentle breathing */
    @keyframes idle {
      0%, 100% {
        transform: scale(1) translateY(0) rotate(0deg);
      }
      50% {
        transform: scale(1.008) translateY(-3px) rotate(0deg);
      }
    }

    .idle {
      animation: idle 4s ease-in-out infinite;
    }

    /* Thinking animation - hand to chin, head tilt */
    @keyframes thinking {
      0%, 100% {
        transform: scale(1) translateY(0) rotate(-2deg) translateX(-5px);
      }
      25% {
        transform: scale(1.01) translateY(-2px) rotate(-3deg) translateX(-6px);
      }
      50% {
        transform: scale(1) translateY(0) rotate(-2deg) translateX(-5px);
      }
      75% {
        transform: scale(1.01) translateY(-1px) rotate(-2.5deg) translateX(-5.5px);
      }
    }

    .thinking {
      animation: thinking 3s ease-in-out infinite;
    }

    /* Listening animation - attentive lean forward */
    @keyframes listening {
      0%, 100% {
        transform: scale(1.02) translateY(-5px) rotate(1deg);
      }
      50% {
        transform: scale(1.025) translateY(-8px) rotate(0deg);
      }
    }

    .listening {
      animation: listening 2.5s ease-in-out infinite;
    }

    /* Talking animation - expressive head movement and gestures */
    @keyframes talking {
      0% {
        transform: scale(1) translateY(0) rotate(0deg);
      }
      15% {
        transform: scale(1.025) translateY(-4px) rotate(2deg) translateX(2px);
      }
      30% {
        transform: scale(1.02) translateY(-2px) rotate(-1deg) translateX(-1px);
      }
      45% {
        transform: scale(1.025) translateY(-5px) rotate(1deg) translateX(1px);
      }
      60% {
        transform: scale(1.02) translateY(-3px) rotate(-1.5deg) translateX(-2px);
      }
      75% {
        transform: scale(1.025) translateY(-4px) rotate(1.5deg) translateX(1px);
      }
      100% {
        transform: scale(1) translateY(0) rotate(0deg);
      }
    }

    .talking {
      animation: talking 1.2s ease-in-out infinite;
    }

    /* Mouth indicator - appears when talking */
    .mouth-indicator {
      position: absolute;
      bottom: 45%;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 30px;
      display: none;
      z-index: 5;
    }

    .mouth-indicator.active {
      display: block;
    }

    /* Animated mouth shape */
    @keyframes mouthMove {
      0%, 100% {
        border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
        height: 25px;
      }
      50% {
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        height: 35px;
      }
    }

    .mouth-shape {
      width: 100%;
      height: 100%;
      background: transparent;
      border: 3px solid rgba(201, 169, 110, 0.8);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      animation: mouthMove 0.3s ease-in-out infinite;
      box-shadow: 0 0 10px rgba(201, 169, 110, 0.5);
    }

    /* Thinking indicator - animated dots */
    .thinking-indicator {
      position: absolute;
      top: 20%;
      right: 15%;
      display: none;
      gap: 6px;
      z-index: 5;
      flex-direction: row;
      align-items: center;
    }

    .thinking-indicator.active {
      display: flex;
    }

    @keyframes thinkingBounce {
      0%, 80%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.4;
      }
      40% {
        transform: translateY(-10px) scale(1.2);
        opacity: 1;
      }
    }

    .thinking-dot {
      width: 8px;
      height: 8px;
      background: rgba(201, 169, 110, 0.8);
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(201, 169, 110, 0.6);
      animation: thinkingBounce 1.4s infinite ease-in-out;
    }

    .thinking-dot:nth-child(1) {
      animation-delay: 0s;
    }

    .thinking-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .thinking-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    /* Listening indicator - sound waves */
    .listening-indicator {
      position: absolute;
      top: 30%;
      left: 12%;
      display: none;
      gap: 4px;
      z-index: 5;
      flex-direction: row;
      align-items: flex-end;
      height: 30px;
    }

    .listening-indicator.active {
      display: flex;
    }

    @keyframes soundWave {
      0%, 100% {
        height: 8px;
        opacity: 0.5;
      }
      50% {
        height: 24px;
        opacity: 1;
      }
    }

    .sound-bar {
      width: 4px;
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.9), rgba(59, 130, 246, 0.6));
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
      animation: soundWave 1s infinite ease-in-out;
    }

    .sound-bar:nth-child(1) {
      animation-delay: 0s;
    }

    .sound-bar:nth-child(2) {
      animation-delay: 0.15s;
    }

    .sound-bar:nth-child(3) {
      animation-delay: 0.3s;
    }

    .sound-bar:nth-child(4) {
      animation-delay: 0.15s;
    }

    .error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #FF4757;
      font-size: 12px;
      text-align: center;
      padding: 20px;
      z-index: 10;
    }
  </style>
</head>
<body>
  <model-viewer
    id="avatar"
    src="${avatarUrl}"
    alt="3D Avatar"
    camera-orbit="0deg 90deg 3.5m"
    camera-target="0m 0.9m 0m"
    min-camera-orbit="auto auto 3m"
    max-camera-orbit="auto auto 4m"
    field-of-view="50deg"
    environment-image="neutral"
    shadow-intensity="0.5"
    exposure="1.2"
    interaction-prompt="none"
    disable-zoom
    loading="eager"
    reveal="auto"
  ></model-viewer>

  <!-- Animated mouth indicator for talking -->
  <div class="mouth-indicator" id="mouthIndicator">
    <div class="mouth-shape"></div>
  </div>

  <!-- Animated thinking indicator -->
  <div class="thinking-indicator" id="thinkingIndicator">
    <div class="thinking-dot"></div>
    <div class="thinking-dot"></div>
    <div class="thinking-dot"></div>
  </div>

  <!-- Animated listening indicator -->
  <div class="listening-indicator" id="listeningIndicator">
    <div class="sound-bar"></div>
    <div class="sound-bar"></div>
    <div class="sound-bar"></div>
    <div class="sound-bar"></div>
  </div>

  <script>
    (function() {
      const modelViewer = document.getElementById('avatar');
      const mouthIndicator = document.getElementById('mouthIndicator');
      const thinkingIndicator = document.getElementById('thinkingIndicator');
      const listeningIndicator = document.getElementById('listeningIndicator');
      let isReady = false;

      console.log('🎭 [WebView] Avatar URL:', modelViewer.getAttribute('src'));
      console.log('🎭 [WebView] Initializing model-viewer...');

      // When model loads
      modelViewer.addEventListener('load', function() {
        console.log('✅ [WebView] Model loaded successfully!');
        isReady = true;

        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'avatarLoaded',
          status: 'success'
        }));
      });

      // When model fails to load
      modelViewer.addEventListener('error', function(event) {
        console.error('Model load error:', event);
        showError('Failed to load 3D avatar');
      });

      function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);

        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'avatarError',
          error: message
        }));
      }

      // Handle animation state changes from React Native
      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'changeAnimation' && isReady) {
            // Animation state received
            console.log('Animation state:', data.state);

            // Remove all animation classes and indicators first
            modelViewer.classList.remove('idle', 'thinking', 'listening', 'talking');
            mouthIndicator.classList.remove('active');
            thinkingIndicator.classList.remove('active');
            listeningIndicator.classList.remove('active');

            // Camera positions and animations for each state
            switch(data.state) {
              case 'idle':
                // Default idle state - gentle breathing
                modelViewer.cameraOrbit = '0deg 90deg 3.5m';
                modelViewer.cameraTarget = '0m 0.9m 0m';
                modelViewer.classList.add('idle');
                console.log('✨ Avatar state: Idle (breathing)');
                break;

              case 'thinking':
                // Thinking pose - head tilt with slight angle
                modelViewer.cameraOrbit = '10deg 88deg 3.4m';
                modelViewer.cameraTarget = '0m 0.95m 0m';
                modelViewer.classList.add('thinking');
                thinkingIndicator.classList.add('active');
                console.log('🤔 Avatar state: Thinking (contemplative)');
                break;

              case 'listening':
                // Listening pose - attentive, leaning slightly forward
                modelViewer.cameraOrbit = '-8deg 92deg 3.3m';
                modelViewer.cameraTarget = '0m 0.92m 0m';
                modelViewer.classList.add('listening');
                listeningIndicator.classList.add('active');
                console.log('👂 Avatar state: Listening (attentive)');
                break;

              case 'talking':
                // Talking state - expressive with mouth movement
                modelViewer.cameraOrbit = '0deg 92deg 3.2m'; // Zoom in slightly
                modelViewer.cameraTarget = '0m 0.95m 0m';
                modelViewer.classList.add('talking');
                mouthIndicator.classList.add('active');
                console.log('💬 Avatar state: Talking (expressive)');
                break;

              default:
                // Fallback to idle
                modelViewer.cameraOrbit = '0deg 90deg 3.5m';
                modelViewer.cameraTarget = '0m 0.9m 0m';
                modelViewer.classList.add('idle');
            }
          }
        } catch (e) {
          console.error('Message handling error:', e);
        }
      });

      console.log('Avatar viewer initialized');
    })();
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={{ position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(201, 169, 110, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 10000 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Loading 3D avatar...</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={{ color: '#ff0', fontSize: 10 }}>URL: {avatarUrl}</Text>
        </View>
      )}

      {/* WebView for Ready Player Me */}
      <WebView
        key={cacheKey}
        ref={webViewRef}
        source={{ html }}
        style={[styles.webview, containerStyle, error && styles.hidden]}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        incognito={true}
        onLoadStart={() => {
          console.log('🎭 Avatar WebView: Loading started');
          setError(null);
          onLoadStart?.();
        }}
        onLoadEnd={() => {
          console.log('🎭 Avatar WebView: Loading ended');
          setIsLoading(false);
          onLoadEnd?.();
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setIsLoading(false);
          setError('Failed to load avatar. Please check your internet connection.');
          console.error('WebView error:', nativeEvent);
          onError?.();
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);

            switch (data.type) {
              case 'avatarLoaded':
                setIsLoading(false);
                setError(null);
                break;

              case 'avatarError':
                setIsLoading(false);
                setError(data.error || 'Failed to load avatar');
                onError?.();
                break;

              case 'animationComplete':
                if (onAnimationComplete) {
                  onAnimationComplete();
                }
                break;

              case 'readyPlayerMeEvent':
                // Handle Ready Player Me events if needed
                console.log('Ready Player Me event:', data.data);
                break;

              default:
                break;
            }
          } catch (e) {
            console.error('Error parsing WebView message:', e);
          }
        }}
        // Performance optimizations
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        startInLoadingState={false}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.95,
    height: 480,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    width: width * 0.95,
    height: 480,
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    zIndex: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4757',
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default ReadyPlayerMeAvatar;
