import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

interface ReadyPlayerMeAvatarProps {
  avatarUrl: string;
  animationState: 'idle' | 'listening' | 'talking' | 'thinking';
  onAnimationComplete?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

const ReadyPlayerMeAvatar: React.FC<ReadyPlayerMeAvatarProps> = ({
  avatarUrl,
  animationState,
  onAnimationComplete,
  onLoadStart,
  onLoadEnd,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      transition: transform 0.3s ease;
    }

    /* Talking animation - subtle head bob and scale */
    @keyframes talking {
      0%, 100% {
        transform: scale(1) translateY(0);
      }
      25% {
        transform: scale(1.02) translateY(-2px);
      }
      50% {
        transform: scale(1.01) translateY(0);
      }
      75% {
        transform: scale(1.02) translateY(-1px);
      }
    }

    .talking {
      animation: talking 0.6s ease-in-out infinite;
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

    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #C9A96E;
      font-size: 14px;
      font-weight: 600;
      z-index: 10;
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
  <div class="loading" id="loading">Loading...</div>

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
  ></model-viewer>

  <!-- Animated mouth indicator for talking -->
  <div class="mouth-indicator" id="mouthIndicator">
    <div class="mouth-shape"></div>
  </div>

  <script>
    (function() {
      const modelViewer = document.getElementById('avatar');
      const loadingEl = document.getElementById('loading');
      const mouthIndicator = document.getElementById('mouthIndicator');
      let isReady = false;

      console.log('Avatar URL:', modelViewer.getAttribute('src'));

      // When model loads
      modelViewer.addEventListener('load', function() {
        console.log('Model loaded successfully');
        if (loadingEl) loadingEl.style.display = 'none';
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

      // Progress tracking
      modelViewer.addEventListener('progress', function(event) {
        const percent = Math.round((event.detail.totalProgress) * 100);
        if (loadingEl) {
          loadingEl.textContent = 'Loading ' + percent + '%';
        }
      });

      function showError(message) {
        if (loadingEl) loadingEl.style.display = 'none';
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

            // Remove all animation classes first
            modelViewer.classList.remove('talking');
            mouthIndicator.classList.remove('active');

            // Camera positions - zoomed out to show full body
            switch(data.state) {
              case 'talking':
                modelViewer.cameraOrbit = '0deg 92deg 3.3m'; // Slight zoom in
                modelViewer.cameraTarget = '0m 0.95m 0m';
                // Add talking animation and mouth indicator
                modelViewer.classList.add('talking');
                mouthIndicator.classList.add('active');
                break;
              case 'thinking':
                modelViewer.cameraOrbit = '10deg 90deg 3.6m'; // Slight angle
                modelViewer.cameraTarget = '0m 0.9m 0m';
                break;
              case 'listening':
                modelViewer.cameraOrbit = '-10deg 90deg 3.5m'; // Slight tilt
                modelViewer.cameraTarget = '0m 0.9m 0m';
                break;
              default:
                modelViewer.cameraOrbit = '0deg 90deg 3.5m'; // Default - zoomed out for full body
                modelViewer.cameraTarget = '0m 0.9m 0m';
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
    <View style={styles.container}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C9A96E" />
          <Text style={styles.loadingText}>Loading 3D Avatar...</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* WebView for Ready Player Me */}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={[styles.webview, (isLoading || error) && styles.hidden]}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        onLoadStart={() => {
          console.log('🎭 Avatar WebView: Loading started');
          setIsLoading(true);
          setError(null);
          onLoadStart?.();
        }}
        onLoadEnd={() => {
          console.log('🎭 Avatar WebView: Loading ended');
          setTimeout(() => {
            setIsLoading(false);
            onLoadEnd?.();
            console.log('🎭 Avatar WebView: Ready to display');
          }, 1000); // Small delay to ensure iframe loads
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setIsLoading(false);
          setError('Failed to load avatar. Please check your internet connection.');
          console.error('WebView error:', nativeEvent);
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
        cacheMode="LOAD_DEFAULT"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.75,  // Smaller width
    height: 380,          // Smaller height for full body
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  webview: {
    width: width * 0.75,
    height: 380,
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A96E',
    textAlign: 'center',
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
